import React, { useEffect, useRef, useState } from 'react';
import { SITE_EVENTS, getSiteContent } from '@/data/siteContent';
import { SITE_MODE_IDS } from '@/components/site/SiteV2';
import { MODE_MEDIA, MODE_COVERS, ART, PHOTO } from '@/data/brandArt';

// Κάρτα για Instagram / social: ζωντανή προεπισκόπηση σε canvas και λήψη PNG (Post 4:5 ή Story 9:16).
const FORMATS = { post: { w: 1080, h: 1350, label: 'Post 4:5' }, story: { w: 1080, h: 1920, label: 'Story 9:16' } };
const INPUT = 'w-full rounded-xl bg-[#2C2C2E] px-3.5 py-2.5 text-[15px] text-white';

const imageFor = (ev) => {
  const id = SITE_MODE_IDS[ev];
  return MODE_MEDIA[id]?.hero || MODE_MEDIA[id]?.cover || MODE_COVERS[`modeCover_${id}`] || PHOTO.siteHero || ART.heist5 || '';
};

function wrap(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export default function AdminSocialCard() {
  const [ev, setEv] = useState(SITE_EVENTS[0]?.id || 'heist');
  const [format, setFormat] = useState('post');
  const c = getSiteContent(ev);
  const [title, setTitle] = useState((c.titleLines || []).join(' '));
  const [date, setDate] = useState('');
  const [text, setText] = useState(c.tagline || '');
  const [cta, setCta] = useState('Κλείσε θέση · link in bio');
  const [image, setImage] = useState(imageFor(ev));
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    const next = getSiteContent(ev);
    setTitle((next.titleLines || []).join(' '));
    setText(next.tagline || '');
    setImage(imageFor(ev));
  }, [ev]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = FORMATS[format];
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const draw = (img) => {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      if (img) {
        const scale = Math.max(w / img.width, h / img.height);
        ctx.drawImage(img, (w - img.width * scale) / 2, (h - img.height * scale) / 2, img.width * scale, img.height * scale);
      }
      const g = ctx.createLinearGradient(0, h * 0.3, 0, h);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.45, 'rgba(0,0,0,0.82)'); g.addColorStop(1, 'rgba(0,0,0,0.97)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const pad = 80;
      ctx.fillStyle = '#E8C26B'; ctx.font = '600 34px -apple-system, "SF Pro Display", Inter, sans-serif';
      ctx.fillText('DEAL OF TEMPTATION · 18+', pad, pad + 20);
      let y = h - pad - 60;
      ctx.font = '600 38px -apple-system, Inter, sans-serif'; ctx.fillStyle = '#E8C26B';
      ctx.fillText(cta, pad, y);
      y -= 70;
      ctx.font = '400 40px -apple-system, Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const body = wrap(ctx, text, w - pad * 2).slice(0, 4);
      for (let i = body.length - 1; i >= 0; i -= 1) { ctx.fillText(body[i], pad, y); y -= 54; }
      if (date) {
        y -= 20; ctx.font = '700 42px -apple-system, Inter, sans-serif'; ctx.fillStyle = '#fff';
        ctx.fillText(new Date(date).toLocaleString('el-GR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }), pad, y); y -= 70;
      }
      ctx.font = '800 112px -apple-system, "SF Pro Display", Inter, sans-serif'; ctx.fillStyle = '#F7E3A8';
      const heads = wrap(ctx, title.toUpperCase(), w - pad * 2).slice(0, 3);
      for (let i = heads.length - 1; i >= 0; i -= 1) { ctx.fillText(heads[i], pad, y); y -= 118; }
    };
    if (!image) { draw(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { setError(''); draw(img); };
    img.onerror = () => { setError('Η φωτογραφία δεν φορτώθηκε — η κάρτα βγαίνει χωρίς φόντο.'); draw(null); };
    img.src = image;
  }, [format, title, date, text, cta, image]);

  function download() {
    try {
      canvasRef.current.toBlob((blob) => {
        if (!blob) { setError('Δεν δημιουργήθηκε η εικόνα. Δοκίμασε άλλη φωτογραφία (από τη βιβλιοθήκη του Admin).'); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `deal-of-temptation-${ev}-${format}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, 'image/png');
    } catch { setError('Η φωτογραφία δεν επιτρέπει λήψη. Χρησιμοποίησε φωτογραφία που ανέβηκε στο Admin.'); }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-4 text-white lg:grid-cols-[1fr_360px]">
      <div className="space-y-3 rounded-2xl bg-[#1C1C1E] p-4">
        <p className="text-[15px] text-white/60">Φτιάξε κάρτα για Instagram, Facebook ή WhatsApp από τις φωτογραφίες και τα κείμενα του site.</p>
        <div className="flex gap-1.5">{Object.entries(FORMATS).map(([id, f]) => <button key={id} type="button" onClick={() => setFormat(id)} className={`rounded-full px-4 py-2 text-[14px] font-semibold ${format === id ? 'bg-white text-black' : 'bg-[#2C2C2E] text-white/80'}`}>{f.label}</button>)}</div>
        <label className="block text-[13px] text-white/70">Εμπειρία<select className={`${INPUT} mt-1`} value={ev} onChange={(e) => setEv(e.target.value)}>{SITE_EVENTS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}</select></label>
        <label className="block text-[13px] text-white/70">Τίτλος<input className={`${INPUT} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="block text-[13px] text-white/70">Ημερομηνία (προαιρετικά)<input type="datetime-local" className={`${INPUT} mt-1`} value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="block text-[13px] text-white/70">Κείμενο<textarea rows={3} className={`${INPUT} mt-1`} value={text} onChange={(e) => setText(e.target.value)} /></label>
        <label className="block text-[13px] text-white/70">Κάλεσμα<input className={`${INPUT} mt-1`} value={cta} onChange={(e) => setCta(e.target.value)} /></label>
        <label className="block text-[13px] text-white/70">Φωτογραφία (διεύθυνση — από τη βιβλιοθήκη του Admin)<input className={`${INPUT} mt-1`} value={image} onChange={(e) => setImage(e.target.value)} /></label>
        {error && <div className="rounded-xl bg-[#FF9F0A]/15 px-3 py-2 text-sm text-[#FFB340]">{error}</div>}
        <button type="button" onClick={download} className="h-12 w-full rounded-full bg-[#E8C26B] text-[16px] font-bold text-black">⬇ Λήψη PNG</button>
      </div>
      <div className="rounded-2xl bg-[#1C1C1E] p-3">
        <div className="mb-2 text-[13px] text-white/60">Προεπισκόπηση · {FORMATS[format].label}</div>
        <canvas ref={canvasRef} className="w-full rounded-xl" aria-label="Προεπισκόπηση κάρτας social" />
      </div>
    </div>
  );
}
