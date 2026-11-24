import React, { useEffect, useRef, useState } from 'react';
import { loadAv, saveAv, canChooseOutput } from '@/lib/avDevices';

// /av-setup — ανοίγει ΣΤΗ ΣΥΣΚΕΥΗ της TV ή του Tablet: κάμερα, μικρόφωνο USB-C, έξοδος ήχου (κάρτα ήχου / ακουστικά).
const SELECT = 'mt-1 w-full rounded-xl bg-[#2C2C2E] px-3 py-3 text-[15px] text-white';

export default function AvSetup() {
  const [devices, setDevices] = useState({ cams: [], mics: [], outs: [] });
  const [sel, setSel] = useState(loadAv());
  const [level, setLevel] = useState(0);
  const [msg, setMsg] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  async function scan() {
    setMsg('');
    try {
      const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => navigator.mediaDevices.getUserMedia({ audio: true }));
      tmp?.getTracks().forEach((t) => t.stop());
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        cams: list.filter((d) => d.kind === 'videoinput'),
        mics: list.filter((d) => d.kind === 'audioinput'),
        outs: list.filter((d) => d.kind === 'audiooutput'),
      });
    } catch (e) { setMsg(`Δεν δόθηκε πρόσβαση σε κάμερα/μικρόφωνο: ${e.message}`); }
  }
  useEffect(() => { scan(); }, []);

  // Ζωντανή προεπισκόπηση κάμερας + μετρητής μικροφώνου με τις επιλεγμένες συσκευές.
  useEffect(() => {
    let alive = true;
    let raf = 0;
    let ctx = null;
    (async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: sel.camera ? { deviceId: { exact: sel.camera } } : true,
          audio: sel.mic ? { deviceId: { exact: sel.mic }, echoCancellation: false, noiseSuppression: false } : true,
        });
        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let peak = 0;
          for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
          setLevel(Math.min(100, Math.round((peak / 128) * 140)));
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) { setMsg(`Η συσκευή δεν ξεκίνησε: ${e.message}`); }
    })();
    return () => { alive = false; cancelAnimationFrame(raf); ctx?.close().catch(() => {}); streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, [sel.camera, sel.mic]);

  const choose = (key, value) => { const next = { ...sel, [key]: value }; setSel(next); saveAv({ [key]: value }); setMsg('Αποθηκεύτηκε σε αυτή τη συσκευή ✓'); };

  async function testSound() {
    const ctx = new AudioContext();
    if (sel.speaker && typeof ctx.setSinkId === 'function') await ctx.setSinkId(sel.speaker).catch(() => {});
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = f; o.type = 'triangle';
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.55);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1600);
  }

  const label = (d, i, kind) => d.label || `${kind} ${i + 1}`;
  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-[34px] font-extrabold tracking-tight">Ήχος & εικόνα</h1>
        <p className="text-[15px] text-white/60">Άνοιξε αυτή τη σελίδα <b>στη συσκευή της TV ή του Tablet</b>. Οι επιλογές αποθηκεύονται σε αυτή τη συσκευή και ισχύουν σε όλο το παιχνίδι (TV, intro βίντεο, ήχοι, ζωντανή κάμερα, Decibel Meter).</p>
        <section className="space-y-3 rounded-2xl bg-[#1C1C1E] p-4">
          <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full rounded-xl bg-black object-cover" />
          <label className="block text-[13px] text-white/70">📷 Κάμερα
            <select className={SELECT} value={sel.camera || ''} onChange={(e) => choose('camera', e.target.value)}>
              <option value="">Προεπιλογή συστήματος</option>
              {devices.cams.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{label(d, i, 'Κάμερα')}</option>)}
            </select>
          </label>
          <label className="block text-[13px] text-white/70">🎙️ Μικρόφωνο (π.χ. USB-C)
            <select className={SELECT} value={sel.mic || ''} onChange={(e) => choose('mic', e.target.value)}>
              <option value="">Προεπιλογή συστήματος</option>
              {devices.mics.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{label(d, i, 'Μικρόφωνο')}</option>)}
            </select>
          </label>
          <div className="h-3 overflow-hidden rounded-full bg-[#2C2C2E]" aria-label="Στάθμη μικροφώνου"><div className="h-full rounded-full bg-[#30D158]" style={{ width: `${level}%` }} /></div>
          <label className="block text-[13px] text-white/70">🔊 Έξοδος ήχου (κάρτα ήχου USB-C, ηχεία, ασύρματα ακουστικά)
            {canChooseOutput() ? (
              <select className={SELECT} value={sel.speaker || ''} onChange={(e) => choose('speaker', e.target.value)}>
                <option value="">Προεπιλογή συστήματος</option>
                {devices.outs.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{label(d, i, 'Έξοδος')}</option>)}
              </select>
            ) : <div className="mt-1 rounded-xl bg-[#2C2C2E] px-3 py-3 text-sm text-white/60">Σε αυτόν τον browser (Safari) η έξοδος ακολουθεί το σύστημα: διάλεξε ηχεία/ακουστικά από το εικονίδιο ήχου του Mac/iPhone. Σε Chrome/Edge διαλέγεις εδώ.</div>}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={testSound} className="h-12 rounded-full bg-[#E8C26B] font-bold text-black">🔔 Δοκιμαστικός ήχος</button>
            <button type="button" onClick={scan} className="h-12 rounded-full bg-[#2C2C2E] font-semibold">↻ Νέες συσκευές</button>
          </div>
          <p className="text-xs text-white/45">Ασύρματα ακουστικά: σύνδεσέ τα πρώτα από τις ρυθμίσεις Bluetooth της συσκευής και πάτα «Νέες συσκευές».</p>
          {msg && <div className="rounded-xl bg-[#2C2C2E] px-3 py-2 text-sm">{msg}</div>}
        </section>
        <div className="grid grid-cols-2 gap-2">
          <a href="/tv" className="flex h-12 items-center justify-center rounded-full bg-[#1C1C1E] font-semibold text-[#0A84FF]">📺 Άνοιγμα TV</a>
          <a href="/" className="flex h-12 items-center justify-center rounded-full bg-[#1C1C1E] font-semibold text-[#0A84FF]">📟 Άνοιγμα Tablet</a>
        </div>
      </div>
    </div>
  );
}
