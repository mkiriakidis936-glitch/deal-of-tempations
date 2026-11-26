import React, { useEffect, useRef, useState } from 'react';
import { appApi } from '@/api/apiClient';
import { GAME_MODES } from '@/data/gameConfig';
import { createInitialState, generateSessionCode } from '@/lib/gameLogic';
import { getActiveSessionCode, setActiveSessionCode } from '@/lib/activeSession';
import { initVilla } from '@/lib/villaEngine';

// Πρόβα 2′: η διοργανώτρια ελέγχει μόνη της TV, ήχο, βίντεο και κινητά πριν έρθουν οι καλεσμένες.
const TOTAL = 120;
const FAKE = [{ name: 'Δοκιμή Α' }, { name: 'Δοκιμή Β' }, { name: 'Δοκιμή Γ' }];

// Η «φάση» κάθε mode, όπως τη διαβάζουν TV και κινητά.
const PHASES = {
  classic: [{ stage: 0 }, { stage: 1 }, { stage: 2 }],
  arrest_heist: [{ stage: 0 }, { stage: 1 }, { stage: 2 }],
  lockdown: ['l1', 'l2', 'l3', 'exit'].map((stage) => ({ mg: { ld: { stage } } })),
  marathon_4h: [0, 1, 2, 3].map((phase) => ({ mg: { lounge: { phase } } })),
  villa_takeover: [1, 17, 33].map((sq) => ({ mg: { villa: { sq } } })),
};
const ENDING = { classic: { stage: 3 }, arrest_heist: { stage: 3, grandHeist: { winner: 'A' } } };

export default function AdminRehearsal() {
  const [mode, setMode] = useState(GAME_MODES[0]?.id || 'classic');
  const [run, setRun] = useState(null); // { id, code, startedAt, previous }
  const [now, setNow] = useState(Date.now());
  const [log, setLog] = useState([]);
  const stepRef = useRef(-1);

  const add = (text) => setLog((l) => [`${new Date().toLocaleTimeString('el-GR')} · ${text}`, ...l].slice(0, 20));
  const patch = (id, statePatch) => appApi.entities.GameSession.update(id, { statePatch });

  async function start() {
    const previous = await getActiveSessionCode().catch(() => '');
    const code = `T${generateSessionCode().slice(0, 4)}`;
    const state = createInitialState(mode, 'medium', FAKE.map((p) => ({ ...p, footwearLevel: 1 })));
    state.mg = { ...(state.mg || {}), briefingRequired: true, introAt: Date.now(), consentRequired: false, consent: { done: true, players: {} }, rehearsal: true };
    if (mode === 'villa_takeover') state.mg.villa = initVilla(state.players);
    state.gameStartedAt = Date.now();
    const session = await appApi.entities.GameSession.create({ sessionCode: code, mode, state: { ...state, rehearsal: true } });
    await setActiveSessionCode(code);
    stepRef.current = -1;
    setLog([]);
    setRun({ id: session.id, code, startedAt: Date.now(), previous });
    add(`Ξεκίνησε η πρόβα (${GAME_MODES.find((m) => m.id === mode)?.name}). Κωδικός ${code}. Η TV δείχνει intro και κανόνες.`);
  }

  async function stop(reason = 'Η πρόβα τελείωσε') {
    const current = run;
    setRun(null);
    if (!current) return;
    try { await appApi.entities.GameSession.delete(current.id); } catch { /* ήδη σβησμένη */ }
    if (current.previous) await setActiveSessionCode(current.previous).catch(() => {});
    add(`${reason}. Η δοκιμαστική βραδιά σβήστηκε${current.previous ? ` και η TV επέστρεψε στη βραδιά ${current.previous}` : ''}.`);
  }

  // Χρονοδιάγραμμα: 0–20″ intro/κανόνες, μετά μία φάση κάθε ~18″, τελετή, σβήσιμο στα 120″.
  useEffect(() => {
    if (!run) return undefined;
    const id = setInterval(async () => {
      setNow(Date.now());
      const t = (Date.now() - run.startedAt) / 1000;
      const phases = PHASES[mode] || [];
      const step = t < 20 ? -1 : Math.min(phases.length, Math.floor((t - 20) / 18));
      if (t >= TOTAL) { clearInterval(id); stop(); return; }
      if (step === stepRef.current) return;
      stepRef.current = step;
      try {
        if (step >= 0 && step < phases.length) {
          const p = phases[step];
          await patch(run.id, { ...(p.stage !== undefined ? { stage: p.stage } : {}), mg: { briefingDone: true, briefingDoneAt: Date.now(), ...(p.mg || {}) } });
          add(`Φάση ${step + 1}/${phases.length} — έλεγξε την κάρτα μετάβασης και την κατάταξη στην TV.`);
        } else if (step >= phases.length) {
          await patch(run.id, ENDING[mode] || { mg: { finishedAll: true } });
          add('Τελετή νικήτριας στην TV — έλεγξε ήχο και εικόνα.');
        }
      } catch (e) { add(`Σφάλμα: ${e.message}`); }
    }, 1000);
    return () => clearInterval(id);
  }, [run?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = run ? Math.max(0, TOTAL - Math.floor((now - run.startedAt) / 1000)) : TOTAL;
  return (
    <div className="mx-auto max-w-3xl space-y-4 text-white">
      <p className="text-[15px] text-white/60">Τρέξε όλη τη βραδιά μόνη σου σε 2 λεπτά για να ελέγξεις TV, ήχο, βίντεο και κινητά πριν έρθουν οι καλεσμένες. Χρησιμοποιεί 3 ψεύτικες παίκτριες και σβήνεται μόνη της στο τέλος.</p>
      <section className="space-y-3 rounded-2xl bg-[#1C1C1E] p-4">
        <label className="block text-[13px] text-white/70">Mode
          <select className="mt-1 w-full rounded-xl bg-[#2C2C2E] px-3 py-2.5 text-[15px]" value={mode} disabled={!!run} onChange={(e) => setMode(e.target.value)}>
            {GAME_MODES.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
          </select>
        </label>
        {!run
          ? <button type="button" onClick={() => start().catch((e) => add(`Σφάλμα: ${e.message}`))} className="h-12 w-full rounded-full bg-[#E8C26B] text-[16px] font-bold text-black">▶ Έναρξη πρόβας 2′</button>
          : <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-3xl font-bold tabular-nums">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span><span className="rounded-full bg-[#2C2C2E] px-3 py-1 text-sm">Κωδικός <b className="tracking-[0.2em]">{run.code}</b></span></div>
              <div className="grid grid-cols-2 gap-2">
                <a href="/tv" target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center rounded-full bg-[#2C2C2E] text-sm font-semibold text-[#0A84FF]">📺 Άνοιγμα TV</a>
                <a href={`/play?code=${run.code}`} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center rounded-full bg-[#2C2C2E] text-sm font-semibold text-[#0A84FF]">📱 Άνοιγμα κινητού</a>
              </div>
              <button type="button" onClick={() => stop('Η πρόβα σταμάτησε')} className="h-11 w-full rounded-full bg-[#FF453A] text-sm font-bold text-white">■ Τέλος πρόβας</button>
            </div>}
      </section>
      <section className="rounded-2xl bg-[#1C1C1E] p-4">
        <div className="mb-2 text-[13px] font-medium text-white/60">Τι να ελέγξεις</div>
        <ul className="space-y-1 text-sm text-white/80">
          <li>• TV: παίζει το intro βίντεο με ήχο (πάτα μία φορά πάνω της για ήχο).</li>
          <li>• TV: κανόνες, κάρτες μετάβασης με φωτογραφίες, κατάταξη, τελετή.</li>
          <li>• Κινητό: μπαίνει με τον κωδικό και ακολουθεί τις φάσεις.</li>
          <li>• Ηχεία / ακουστικά / κάρτα ήχου: ακούγονται τα εφέ.</li>
        </ul>
      </section>
      {log.length > 0 && <section className="rounded-2xl bg-[#1C1C1E] p-4 text-sm text-white/75">{log.map((line) => <div key={line} className="border-b border-white/10 py-1.5 last:border-0">{line}</div>)}</section>}
    </div>
  );
}
