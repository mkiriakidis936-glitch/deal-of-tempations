import React, { useEffect, useState } from 'react';
import { pushSupported, isIOS, isStandalone, enablePlayerPush } from '@/lib/push';

// Οδηγός ειδοποιήσεων στο κινητό: εμφανίζεται μέχρι να ενεργοποιηθούν (ή να πατηθεί «Όχι τώρα»).
// Στο iPhone οι ειδοποιήσεις δουλεύουν μόνο αν το app έχει προστεθεί στην αρχική οθόνη.
export default function NotifyOnboarding({ sessionCode, playerId }) {
  const key = `dot_push_${sessionCode}_${playerId}`;
  const [state, setState] = useState('checking'); // checking | ios | ask | done | hidden
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!sessionCode || !playerId) { setState('hidden'); return; }
    let done = false;
    try { done = localStorage.getItem(key) === '1' || sessionStorage.getItem(`${key}_later`) === '1'; } catch { /* χωρίς storage */ }
    if (done) { setState('hidden'); return; }
    if (isIOS() && !isStandalone()) { setState('ios'); return; }
    if (!pushSupported()) { setState('hidden'); return; }
    setState('ask');
  }, [key, sessionCode, playerId]);

  async function enable() {
    setMsg('Σύνδεση…');
    try {
      await enablePlayerPush(sessionCode, playerId);
      try { localStorage.setItem(key, '1'); } catch { /* χωρίς storage */ }
      setState('done');
      setMsg('');
    } catch (e) { setMsg(e?.message || 'Δεν ενεργοποιήθηκαν οι ειδοποιήσεις.'); }
  }
  const later = () => { try { sessionStorage.setItem(`${key}_later`, '1'); } catch { /* χωρίς storage */ } setState('hidden'); };

  if (state === 'hidden' || state === 'checking') return null;
  if (state === 'done') return <div className="rounded-2xl bg-[#30D158]/15 px-4 py-3 text-sm font-semibold text-[#7BE495]">🔔 Οι ειδοποιήσεις είναι ενεργές — θα σε ειδοποιούμε για σειρά, κάρτες και μυστικές αποστολές.</div>;
  return (
    <section className="rounded-3xl bg-[#1C1C1E] p-4 text-white" aria-label="Ενεργοποίηση ειδοποιήσεων">
      <div className="text-[17px] font-semibold">🔔 Μην χάσεις τη σειρά σου</div>
      {state === 'ios' ? (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-white/80">
          <li>Πάτα <b>Κοινοποίηση</b> (το τετράγωνο με το βελάκι) κάτω στο Safari.</li>
          <li>Διάλεξε <b>«Προσθήκη στην οθόνη Αφετηρίας»</b>.</li>
          <li>Άνοιξε το <b>Deal of Temptation</b> από την αρχική οθόνη και πάτα εδώ «Ενεργοποίηση».</li>
        </ol>
      ) : (
        <p className="mt-1 text-sm text-white/75">Ενεργοποίησε τις ειδοποιήσεις για να ξέρεις πότε έχεις σειρά, κάρτα ή μυστική αποστολή — ακόμα κι αν το κινητό είναι κλειδωμένο.</p>
      )}
      {msg && <div className="mt-2 text-sm text-[#FFB340]">{msg}</div>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {state === 'ask' && <button type="button" onClick={enable} className="h-11 rounded-full bg-[#E8C26B] font-bold text-black">Ενεργοποίηση</button>}
        <button type="button" onClick={later} className={`h-11 rounded-full bg-[#2C2C2E] font-semibold ${state === 'ios' ? 'col-span-2' : ''}`}>Όχι τώρα</button>
      </div>
    </section>
  );
}
