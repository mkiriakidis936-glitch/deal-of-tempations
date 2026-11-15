import React, { useEffect, useRef, useState } from 'react';
import { useGameSession } from '@/hooks/useGameSession';

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
  if (!response.ok) throw new Error(data.error || 'Η σύνδεση Live Feed απέτυχε.');
  return data;
}

export default function Isolation() {
  const { session, state, loading, joinByCode } = useGameSession({ autoLoad: false });
  const [includeAudio, setIncludeAudio] = useState(false);
  const [consented, setConsented] = useState(false);
  const [connection, setConnection] = useState('idle');
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const pcRef = useRef(null);
  const pollRef = useRef(null);
  const restartingRef = useRef(false);
  const lastRestartRef = useRef(0);

  const params = new URLSearchParams(window.location.search);
  const sessionCode = String(params.get('code') || '').trim().toUpperCase();
  const token = String(params.get('token') || '');
  const feed = state?.extra4?.liveFeed || {};
  const requested = ['requested', 'connecting', 'connected'].includes(feed.status);

  useEffect(() => {
    if (sessionCode) joinByCode(sessionCode);
  }, [sessionCode, joinByCode]);

  function stopMedia(nextConnection = 'idle') {
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
    }
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setConnection(nextConnection);
    setConsented(false);
  }

  function stopLocal() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    stopMedia('idle');
  }

  async function publishOffer(pc, microphoneEnabled) {
    pc.restartIce?.();
    const offer = await pc.createOffer({ iceRestart: true }).catch(() => pc.createOffer());
    await pc.setLocalDescription(offer);
    await waitForIceGathering(pc);
    await requestJson(`/api/entities/live-feed/${encodeURIComponent(sessionCode)}/signal`, {
      method: 'POST',
      body: JSON.stringify({ token, role: 'source', offer: pc.localDescription, microphoneEnabled }),
    });
    setConnection('connecting');
  }

  async function startFeed() {
    if (!token || !sessionCode || !requested || feed.status === 'off') return;
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: includeAudio && feed.tvAudio === true,
      });
      streamRef.current = stream;
      setConsented(true);
      if (videoRef.current) videoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: [] });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pc.onconnectionstatechange = () => {
        if (pcRef.current !== pc) return;
        setConnection(pc.connectionState);
        if (pc.connectionState === 'connected') {
          requestJson(`/api/entities/live-feed/${encodeURIComponent(sessionCode)}/signal`, {
            method: 'POST',
            body: JSON.stringify({ token, role: 'source', connected: true }),
          }).catch(() => {});
        } else if (['disconnected', 'failed'].includes(pc.connectionState)) {
          // A dropped connection must never silently reactivate camera or microphone.
          requestJson(`/api/entities/live-feed/${encodeURIComponent(sessionCode)}/signal`, {
            method: 'POST',
            body: JSON.stringify({ token, role: 'source', connected: false }),
          }).catch(() => {});
          stopMedia('reconnecting');
        }
      };
      await publishOffer(pc, includeAudio && feed.tvAudio === true);
      lastRestartRef.current = Number(feed.restartRequest) || 0;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        if (restartingRef.current) return;
        try {
          const result = await requestJson(`/api/entities/live-feed/${encodeURIComponent(sessionCode)}/state?token=${encodeURIComponent(token)}`);
          const latest = result.liveFeed || {};
          if (latest.status === 'off') {
            stopLocal();
            return;
          }
          const restartRequest = Number(latest.restartRequest) || 0;
          if (restartRequest > lastRestartRef.current) {
            lastRestartRef.current = restartRequest;
            // Director has to issue a fresh request and the participant must consent again.
            stopMedia('idle');
            setError('Η σύνδεση διακόπηκε. Περιμένεις νέο αίτημα του Director και χρειάζεται νέα συναίνεση.');
            return;
          }
          const currentPc = pcRef.current;
          if (currentPc && latest.answer?.sdp && currentPc.signalingState === 'have-local-offer' && latest.answer.sdp !== currentPc.remoteDescription?.sdp) {
            await currentPc.setRemoteDescription(new RTCSessionDescription(latest.answer));
          }
        } catch {
          if (pcRef.current) setConnection('reconnecting');
        }
      }, 900);
    } catch (cause) {
      stopLocal();
      setError(cause?.message || 'Δεν ήταν δυνατή η ενεργοποίηση της κάμερας.');
    }
  }

  async function stopFeed() {
    try {
      if (token && sessionCode) {
        await requestJson(`/api/entities/live-feed/${encodeURIComponent(sessionCode)}/stop`, {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
      }
    } catch (cause) {
      setError(cause?.message || 'Δεν ολοκληρώθηκε η διακοπή.');
    } finally {
      stopLocal();
    }
  }

  useEffect(() => {
    if (feed.status === 'off' && (streamRef.current || pcRef.current)) stopLocal();
  }, [feed.status]);

  useEffect(() => () => stopLocal(), []);

  const statusText = {
    idle: 'ΑΝΑΜΟΝΗ',
    connecting: 'ΣΥΝΔΕΣΗ ΜΕ TV',
    connected: 'LIVE ΣΤΗΝ TV',
    disconnected: 'Η ΣΥΝΔΕΣΗ ΔΙΑΚΟΠΗΚΕ',
    failed: 'ΑΠΟΤΥΧΙΑ ΣΥΝΔΕΣΗΣ',
    reconnecting: 'ΠΡΟΣΠΑΘΕΙΑ ΕΠΑΝΑΣΥΝΔΕΣΗΣ',
  }[connection] || connection.toUpperCase();

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f4e8c5]">
      <div className="mx-auto max-w-xl space-y-5">
        <header className="rounded-2xl border border-[#c9a94e]/50 bg-[#111] p-5 text-center">
          <div className="text-xs tracking-[.35em] text-[#c9a94e]">DEAL OF TEMPTATION · EXTRA 4.0</div>
          <h1 className="mt-3 font-serif text-3xl tracking-wider text-[#f4e8c5]">ISOLATION CHAMBER</h1>
          <p className="mt-2 text-sm text-[#bcae8c]">Η κάμερα παραμένει κλειστή μέχρι να επιβεβαιώσεις τη συμμετοχή σου.</p>
        </header>

        {!token || !sessionCode ? <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm">Μη έγκυρος σύνδεσμος Isolation Chamber.</div>
          : loading || !session ? <div className="p-8 text-center text-[#c9a94e]">Φόρτωση συνεδρίας…</div>
          : !requested ? <div className="rounded-xl border border-[#806a34] bg-[#15120b] p-4 text-sm">Δεν υπάρχει ενεργό αίτημα Live Feed από τον Director.</div>
          : <>
            <section className="rounded-2xl border border-[#c9a94e]/35 bg-[#111] p-4">
              <div className="flex items-center justify-between gap-3">
                <div><div className="text-xs text-[#bcae8c]">ΣΥΝΔΕΣΗ</div><div className="mt-1 font-bold text-[#e5cf91]">{statusText}</div></div>
                {consented && <span className="rounded-full border border-red-500 bg-red-950 px-3 py-1 text-xs text-red-200">● ΚΑΜΕΡΑ ΕΝΕΡΓΗ</span>}
              </div>
              <video ref={videoRef} autoPlay playsInline muted className="mt-4 aspect-video w-full rounded-xl bg-black object-cover" />
            </section>
            {!consented && <section className="space-y-4 rounded-2xl border border-[#c9a94e]/35 bg-[#111] p-4">
              <div className="text-sm">Ο Director ζήτησε να ξεκινήσει η μετάδοση εικόνας.</div>
              {feed.tvAudio === true && <label className="flex items-start gap-3 rounded-lg bg-[#201b10] p-3 text-sm"><input type="checkbox" checked={includeAudio} onChange={(e) => setIncludeAudio(e.target.checked)} className="mt-1" /><span>Συναινώ να μεταδοθεί και ο ήχος από το μικρόφωνό μου. Αν δεν επιλεγεί, η μετάδοση θα είναι μόνο εικόνα.</span></label>}
              <button type="button" onClick={startFeed} className="w-full rounded-xl bg-[#c9a94e] px-4 py-4 font-bold text-black">ΣΥΝΑΙΝΩ ΚΑΙ ΕΝΑΡΞΗ ΚΑΜΕΡΑΣ</button>
            </section>}
            {consented && <button type="button" onClick={stopFeed} className="w-full rounded-xl border border-red-500 bg-red-950 px-4 py-4 font-bold text-red-100">STOP — ΔΙΑΚΟΠΗ ΚΑΜΕΡΑΣ ΚΑΙ ΜΙΚΡΟΦΩΝΟΥ</button>}
          </>}
        {error && <div role="alert" className="rounded-xl border border-red-700 bg-red-950/60 p-3 text-sm text-red-100">{error}</div>}
        <div className="text-center text-xs text-[#8e8165]">Η μετάδοση γίνεται μέσω WebRTC στο τοπικό δίκτυο. Δεν πραγματοποιείται εγγραφή ή αποθήκευση βίντεο.</div>
      </div>
    </main>
  );
}
