import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GAME_MODES } from '@/data/gameConfig';
import { NEW_MODES, modeMeta } from '@/data/modes/modeRegistry';
import ModeForm from '@/pages/ModeForm';
import InvitationIntakeForm from '@/components/invitation/InvitationIntakeForm';
import { FormShell, SuccessScreen, formImageFor } from '@/components/forms/FormKit';

const isNewMode = (id) => NEW_MODES.some((mode) => mode.id === id);

// /forms: η καλεσμένη διαλέγει εμπειρία και ανοίγει η σωστή φόρμα (ένα mode ανά αίτηση).
export default function PublicForms() {
  const [params, setParams] = useSearchParams();
  const [done, setDone] = useState(false);
  const [doneName, setDoneName] = useState('');
  const selectedMode = params.get('mode') || '';
  const validMode = GAME_MODES.some((mode) => mode.id === selectedMode);

  function chooseMode(id) {
    const next = new URLSearchParams(params);
    next.set('mode', id);
    setParams(next, { replace: false });
    setDone(false);
    window.scrollTo({ top: 0 });
  }

  if (validMode && done) return <SuccessScreen name={doneName} modeName={GAME_MODES.find((m) => m.id === selectedMode)?.name} image={formImageFor(selectedMode)} />;
  if (validMode) {
    if (isNewMode(selectedMode)) return <ModeForm />;
    return <InvitationIntakeForm onDone={(name) => { setDoneName(name || ''); setDone(true); }} />;
  }

  const groups = [
    { id: 'engine', title: '🎲 Επιτραπέζια με ζάρι', modes: GAME_MODES.filter((m) => m.kind === 'engine') },
    { id: 'digital', title: '📱 Ψηφιακές εμπειρίες', modes: GAME_MODES.filter((m) => m.kind !== 'engine') },
  ];

  return (
    <FormShell image={formImageFor('arrest_heist')} kicker="Φόρμα συμμετοχής · 18+" title="Διάλεξε εμπειρία" subtitle="Μία εμπειρία ανά αίτηση. Η θέση ενεργοποιείται μετά την έγκριση.">
      {groups.map((group) => (
        <section key={group.id} className="space-y-3">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8C26B]">{group.title}</h2>
          {group.modes.map((mode) => {
            const meta = modeMeta(mode.id);
            return (
              <button key={mode.id} type="button" onClick={() => chooseMode(mode.id)}
                className="group relative block w-full overflow-hidden rounded-[26px] text-left ring-1 ring-white/10 transition-transform active:scale-[0.98]">
                <img src={formImageFor(mode.id)} alt="" loading="lazy" className="aspect-[16/8] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" />
                <div className="absolute inset-y-0 left-0 flex max-w-[78%] flex-col justify-center p-5">
                  <div className="text-xl font-bold leading-tight text-white">{mode.icon} {mode.name}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-white/70">{mode.desc}</div>
                  {meta && <div className="mt-2 text-[11px] font-semibold text-[#E8C26B]">{meta.minutes}′ · {meta.min}–{meta.max} παίκτριες</div>}
                </div>
                <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#E8C26B] text-lg font-bold text-black">→</span>
              </button>
            );
          })}
        </section>
      ))}
      <p className="pt-2 text-center text-xs text-white/45">Τα όρια και οι προτιμήσεις σου τα βλέπει μόνο η διοργανώτρια.</p>
    </FormShell>
  );
}
