import React, { useEffect, useRef, useState } from 'react';

const waitForIceGathering = (pc) => new Promise((resolve) => {
  if (pc.iceGatheringState === 'complete') return resolve();
  const timeout = setTimeout(resolve, 12000);
  const onChange = () => {
    if (pc.iceGatheringState === 'complete') {
      clearTimeout(timeout);
      pc.removeEventListener('icegatheringstatechange', onChange);
      resolve();
    }
  };
  pc.addEventListener('icegatheringstatechange', onChange);
});

async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Live Feed unavailable');
  return data;
}

export default function Extra4LiveFeedTV({ sessionCode, token, feed = {} }) {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const offerRef = useRef('');
  const restartRequestedRef = useRef(false);
  const [status, setStatus] = useState('ΑΝΑΜΟΝΗ');
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    if (!sessionCode || !token) return undefined;
    let alive = true;
    let interval = null;

    async function closeConnection() {
      if (pcRef.current) {
        pcRef.current.ontrack = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
      }
      pcRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }

    async function answerOffer(offer) {
      await closeConnection();
      const pc = new RTCPeerConnection({ iceServers: [] });
      pcRef.current = pc;
      offerRef.current = offer.sdp;
      restartRequestedRef.current = false;
      pc.ontrack = (event) => {
        if (videoRef.current) videoRef.current.srcObject = event.streams[0] || new MediaStream([event.track]);
      };
      pc.onconnectionstatechange = () => {
        if (!alive || pcRef.current !== pc) return;
        setStatus(pc.connectionState === 'connected' ? 'LIVE' : pc.connectionState.toUpperCase());
        if (['disconnected', 'failed'].includes(pc.connectionState) && !restartRequestedRef.current) {
          restartRequestedRef.current = true;
          setStatus('ΕΠΑΝΑΣΥΝΔΕΣΗ…');
          requestJson(`/api/entities/live-feed/${encodeURIComponent(sessionCode)}/signal`, {
            method: 'POST',
            body: JSON.stringify({ token, role: 'tv', requestRestart: true }),
          }).catch(() => {});
        }
      };
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForIceGathering(pc);
      await requestJson(`/api/entities/live-feed/${encodeURIComponent(sessionCode)}/signal`, {
        method: 'POST',
        body: JSON.stringify({ token, role: 'tv', answer: pc.localDescription }),
      });
      if (alive) setStatus('ΑΝΑΜΟΝΗ ΣΥΝΔΕΣΗΣ');
    }

    async function poll() {
      try {
        const result = await requestJson(`/api/entities/live-feed/${encodeURIComponent(sessionCode)}/state?token=${encodeURIComponent(token)}`);
        const latest = result.liveFeed || {};
        if (!alive) return;
        if (latest.status === 'off') {
          await closeConnection();
          setStatus('ΑΝΕΝΕΡΓΟ');
          return;
        }
        if (latest.offer?.sdp && latest.offer.sdp !== offerRef.current) {
          await answerOffer(latest.offer);
        }
      } catch {
        if (alive) setStatus('ΑΝΑΜΟΝΗ ΣΥΝΔΕΣΗΣ');
      }
    }

    poll();
    interval = setInterval(poll, 900);
    return () => {
      alive = false;
      if (interval) clearInterval(interval);
      closeConnection();
    };
  }, [sessionCode, token]);

  useEffect(() => {
    if (feed.status !== 'off' || !pcRef.current) return;
    pcRef.current.ontrack = null;
    pcRef.current.onconnectionstatechange = null;
    pcRef.current.close();
    pcRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('ΑΝΕΝΕΡΓΟ');
  }, [feed.status]);

  if (!token) return null;
  const pip = !!feed.tvPip;
  const audioRequested = !!feed.tvAudio;

  return (
    <div className={pip
      ? 'fixed bottom-5 right-5 z-[82] w-[min(38vw,560px)] overflow-hidden rounded-xl border-2 border-primary bg-black shadow-2xl'
      : 'fixed inset-0 z-[82] flex items-center justify-center bg-black'}>
      <video ref={videoRef} autoPlay playsInline muted={!audioRequested || !audioEnabled} className={pip ? 'aspect-video w-full bg-black object-cover' : 'h-full w-full bg-black object-contain'} />
      <div className="absolute left-2 top-2 rounded bg-black/75 px-2 py-1 text-[10px] font-bold text-white">ISOLATION CHAMBER · {status}</div>
      {audioRequested && !audioEnabled && <button type="button" onClick={() => setAudioEnabled(true)} className="absolute bottom-3 right-3 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-black">ΕΝΕΡΓΟΠΟΙΗΣΗ ΗΧΟΥ</button>}
    </div>
  );
}
