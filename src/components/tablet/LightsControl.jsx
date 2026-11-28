import React, { useEffect, useState } from 'react';
import { DockItem } from '@/design/ui';
import { request } from '@/api/apiClient';

// 11.1.0 · Tablet → «💡 Φώτα»: τα φώτα του σπιτιού (SmartThings) και «Στείλε στην TV» (Google Cast).
// Εμφανίζεται μόνο αν έχει γίνει σύνδεση στο Admin → Φώτα & Samsung TV. Δεν αλλάζει τίποτα στο παιχνίδι:
// γράφει μόνο state.lightsOn / state.lightsManual, που διαβάζει ο server για τα φώτα.

// Google Cast μιας σελίδας μέσω Presentation API (Chrome σε υπολογιστή/Android). Αλλού: οδηγίες.
export const canCastPage = () => typeof window !== 'undefined' && 'PresentationRequest' in window;
export async function castPage(url) {
  const req = new window.PresentationRequest([url]);
  return req.start(); // ανοίγει τη λίστα συσκευών (Samsung με Google Cast, Chromecast…)
}

export default function LightsControl({ state, updateState, sessionCode }) {
  const [open, setOpen] = useState(false);
  const [st, setSt] = useState(null);
  const [castMsg, setCastMsg] = useState('');
  useEffect(() => {
    let alive = true;
    const load = () => request('GET', '/api/lights/status').then((s) => { if (alive) setSt(s); }).catch(() => { if (alive) setSt(null); });
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  const tvUrl = `${window.location.origin}/tv?code=${encodeURIComponent(sessionCode || '')}`;
  const connected = st && st.auth?.type !== 'none';
  const on = state?.lightsOn !== false;
  const manual = state?.lightsManual || null;
  const cast = async () => {
    setCastMsg('');
    if (!canCastPage()) { setCastMsg('Αυτός ο browser δεν κάνει Cast σελίδας. Άνοιξε τον σύνδεσμο σε Chrome → ⋮ → «Μετάδοση…», ή στον browser της TV.'); return; }
    try { await castPage(tvUrl); setCastMsg('📺 Η TV ανοίγει στη Samsung.'); } catch (e) { setCastMsg(e?.name === 'NotAllowedError' ? 'Ακυρώθηκε.' : 'Δεν βρέθηκε TV με Google Cast. Δοκίμασε τον browser της TV (Admin → Φώτα & Samsung TV).'); }
  };

  return (
    <>
      <DockItem order={4} fallbackClassName="fixed bottom-[22rem] left-3 z-[65]">
        <button type="button" className="ui-btn" onClick={() => setOpen(true)} aria-label="Φώτα σπιτιού και TV">{connected ? (on ? '💡 Φώτα' : '💡 Φώτα · off') : '📺 TV'}</button>
      </DockItem>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-3 sm:items-center" onClick={() => setOpen(false)}>
          <div className="max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#1a0d4a] p-4 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xl font-bold">💡 Φώτα & 📺 TV</div>
              <button type="button" className="ui-btn ui-btn--sm" onClick={() => setOpen(false)}>Κλείσιμο</button>
            </div>

            {connected ? (
              <>
                <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-black/30 px-4 py-3">
                  <span><span className="block font-semibold">Τα φώτα ακολουθούν το παιχνίδι</span><span className="block text-xs text-white/55">{st.enabled ? 'Ενεργό στο Admin.' : '⚠️ Κλειστό στο Admin → Φώτα.'} {st.auth?.expired ? '⛔ Το token έληξε.' : ''}</span></span>
                  <input type="checkbox" role="switch" className="h-6 w-11 shrink-0 accent-[#ffd23f]" checked={on} onChange={(e) => updateState({ lightsOn: e.target.checked })} />
                </label>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => updateState({ lightsManual: manual === 'normal' ? null : 'normal' })} className={`min-h-12 rounded-2xl px-2 text-sm font-semibold ${manual === 'normal' ? 'bg-[#ffd23f] text-black' : 'bg-white/10'}`}>☀️ Κανονικό φως</button>
                  <button type="button" onClick={() => updateState({ lightsManual: manual === 'dim' ? null : 'dim' })} className={`min-h-12 rounded-2xl px-2 text-sm font-semibold ${manual === 'dim' ? 'bg-[#ffd23f] text-black' : 'bg-white/10'}`}>🌙 Χαμηλά</button>
                  <button type="button" onClick={() => updateState({ lightsManual: null })} className={`min-h-12 rounded-2xl px-2 text-sm font-semibold ${!manual ? 'bg-[#ffd23f] text-black' : 'bg-white/10'}`}>🎬 Με το παιχνίδι</button>
                </div>
                <p className="mt-2 text-xs text-white/50">Το ΣΤΟΠ ανάβει πάντα δυνατό λευκό φως. Οι αλλαγές φτάνουν στα φώτα σε 1–3″.</p>
                {st.lastError && <p className="mt-2 rounded-xl bg-[#ff2d55]/20 p-2 text-xs">⚠️ {st.lastError}</p>}
              </>
            ) : (
              <p className="mt-3 rounded-2xl bg-black/30 p-3 text-sm text-white/70">Τα φώτα του σπιτιού συνδέονται στο Admin → «Φώτα & Samsung TV».</p>
            )}

            <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffd23f]">📺 TV</div>
            <button type="button" onClick={cast} className="mt-2 h-12 w-full rounded-full bg-[#2de2ff] text-base font-bold text-black">📺 Στείλε στην TV (Google Cast)</button>
            {castMsg && <p className="mt-2 text-sm text-white/75">{castMsg}</p>}
            <div className="mt-2 flex items-center gap-2 text-xs"><code className="min-w-0 flex-1 truncate rounded bg-black/40 px-2 py-1">{tvUrl}</code><button type="button" className="ui-btn ui-btn--sm" onClick={() => navigator.clipboard?.writeText(tvUrl)}>Αντιγραφή</button></div>
          </div>
        </div>
      )}
    </>
  );
}
