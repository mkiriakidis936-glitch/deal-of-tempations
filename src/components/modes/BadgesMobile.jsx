import React, { useState } from 'react';
import { shareCardBlob } from '@/lib/shareCard';

// 12.0.0 · Κινητό: «🏅 Παράσημα» (κατά τη διάρκεια: όσα κρατάς τώρα· στο φινάλε: τα δικά σου) + κάρτα για story.
export default function BadgesMobile({ badges = [], finale = false, card = null }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [msg, setMsg] = useState('');
  if (!badges.length && !finale) return null;
  const share = async () => {
    setBusy(true); setMsg('');
    try {
      const blob = await shareCardBlob({ ...card, badges });
      const file = new File([blob], 'deal-of-temptation.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Deal of Temptation' }); }
      else { setUrl(URL.createObjectURL(blob)); setMsg('Πάτα παρατεταμένα την εικόνα → Αποθήκευση.'); }
    } catch (e) { if (e?.name !== 'AbortError') setMsg('Δεν έγινε η κάρτα. Δοκίμασε ξανά.'); } finally { setBusy(false); }
  };
  return (
    <section className="gx-glass p-4">
      <div className="show-kicker text-[11px]">🏅 Παράσημα</div>
      <div className="show-title text-[24px]">{finale ? 'Τα παράσημά σου' : 'Κρατάς τώρα'}</div>
      {badges.length ? (
        <div className="mt-2 grid gap-2">
          {badges.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-black/30 px-3 py-2">
              <span className="text-3xl" aria-hidden="true">{b.icon}</span>
              <span className="min-w-0"><b className="block italic">{b.title}</b><span className="text-xs text-white/60">{b.text}</span></span>
            </div>
          ))}
        </div>
      ) : <p className="mt-1 text-sm text-white/60">Δεν πήρες παράσημο αυτή τη φορά — την επόμενη!</p>}
      {finale && card && (
        <>
          <button type="button" disabled={busy} onClick={share} className="show-btn show-btn--pink mt-3 w-full text-[18px]">📸 {busy ? 'Ετοιμάζεται…' : 'Κάρτα για story'}</button>
          {msg && <p className="mt-2 text-xs text-white/70">{msg}</p>}
          {url && <img src={url} alt="Η κάρτα σου" className="mt-2 w-full rounded-2xl" />}
        </>
      )}
    </section>
  );
}
