import { getToken } from '@/api/base44Client';

// Ζωντανή κάμερα → TV μέσω WebRTC. Η εικόνα πηγαίνει απευθείας από συσκευή σε συσκευή (ίδιο WiFi)·
// ο server μεταφέρει μόνο τη «χειραψία». Μόνο εικόνα, χωρίς ήχο (για να μη γίνεται μικροφωνισμός).
const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

async function call(method, path, body, admin = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (admin) { const t = getToken(); if (t) headers.Authorization = `Bearer ${t}`; }
  const res = await fetch(`${API}/api/camera${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Σφάλμα ${res.status}`), { status: res.status });
  return data;
}

// Περιμένει να μαζευτούν οι διαδρομές δικτύου (χωρίς trickle ICE) — έως 4″.
function gathered(pc) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => { pc.removeEventListener('icegatheringstatechange', check); clearTimeout(timer); resolve(); };
    const check = () => { if (pc.iceGatheringState === 'complete') done(); };
    const timer = setTimeout(done, 4000);
    pc.addEventListener('icegatheringstatechange', check);
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const code = (c) => encodeURIComponent(String(c || '').toUpperCase());

export async function openCameraStream(facingMode = 'environment') {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Αυτή η συσκευή δεν δίνει πρόσβαση σε κάμερα από τον browser.');
  return navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } }, audio: false });
}

// ---------- Αποστολέας (Tablet / κινητό admin) ----------
export async function startCameraSender({ sessionCode, stream, onViewers }) {
  const { camId } = await call('POST', `/${code(sessionCode)}/start`, {}, true);
  const peers = new Map();
  let stopped = false;

  const answer = async ({ viewerId, sdp }) => {
    const pc = new RTCPeerConnection(ICE);
    peers.set(viewerId, pc);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pc.addEventListener('connectionstatechange', () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) { pc.close(); peers.delete(viewerId); onViewers?.(peers.size); }
      if (pc.connectionState === 'connected') onViewers?.(peers.size);
    });
    await pc.setRemoteDescription({ type: 'offer', sdp });
    await pc.setLocalDescription(await pc.createAnswer());
    await gathered(pc);
    await call('POST', `/${code(sessionCode)}/answer`, { camId, viewerId, sdp: pc.localDescription.sdp }, true);
  };

  (async () => {
    while (!stopped) {
      try {
        const { pending } = await call('GET', `/${code(sessionCode)}/pending?camId=${camId}`, null, true);
        for (const item of pending) if (!peers.has(item.viewerId)) await answer(item).catch(() => {});
      } catch (error) { if (error.status === 404) break; }
      await sleep(1500);
    }
  })();

  return {
    camId,
    async stop() {
      stopped = true;
      peers.forEach((pc) => pc.close());
      peers.clear();
      stream.getTracks().forEach((track) => track.stop());
      await call('DELETE', `/${code(sessionCode)}`, null, true).catch(() => {});
    },
  };
}

// ---------- Θεατής (TV) ----------
// Επιστρέφει συνάρτηση διακοπής. Ξαναδοκιμάζει μόνο του αν χαθεί η σύνδεση.
export function watchCamera({ sessionCode, camId, onStream, onStatus }) {
  let stopped = false;
  let pc = null;

  const connect = async () => {
    while (!stopped) {
      try {
        onStatus?.('connecting');
        pc = new RTCPeerConnection(ICE);
        pc.addTransceiver('video', { direction: 'recvonly' });
        const lost = new Promise((resolve) => {
          pc.addEventListener('track', (event) => onStream?.(event.streams[0] || new MediaStream([event.track])));
          pc.addEventListener('connectionstatechange', () => {
            if (pc.connectionState === 'connected') onStatus?.('live');
            if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) resolve();
          });
        });
        await pc.setLocalDescription(await pc.createOffer());
        await gathered(pc);
        const { viewerId } = await call('POST', `/${code(sessionCode)}/viewer`, { camId, sdp: pc.localDescription.sdp });
        let answer = null;
        for (let i = 0; i < 20 && !stopped && !answer; i += 1) {
          await sleep(1000);
          ({ answer } = await call('GET', `/${code(sessionCode)}/viewer/${viewerId}`));
        }
        if (!answer) throw new Error('Η κάμερα δεν απάντησε.');
        await pc.setRemoteDescription({ type: 'answer', sdp: answer });
        await lost;
      } catch { /* ξαναδοκιμάζει παρακάτω */ }
      pc?.close();
      if (!stopped) { onStatus?.('retry'); await sleep(3000); }
    }
  };
  connect();
  return () => { stopped = true; pc?.close(); };
}
