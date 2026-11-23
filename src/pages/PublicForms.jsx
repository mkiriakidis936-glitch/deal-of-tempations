import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GAME_MODES } from '@/data/gameConfig';
import { NEW_MODES } from '@/data/modes/modeRegistry';
import ModeForm from '@/pages/ModeForm';
import PajamaForm from '@/pages/PajamaForm';
import InvitationIntakeForm from '@/components/invitation/InvitationIntakeForm';
import { MODE_COVERS } from '@/data/brandArt';

const isNewMode = (id) => NEW_MODES.some((mode) => mode.id === id);

export default function PublicForms() {
  const [params, setParams] = useSearchParams();
  const [done, setDone] = useState(false);
  const selectedMode = params.get('mode') || '';
  const validMode = GAME_MODES.some((mode) => mode.id === selectedMode);

  function chooseMode(id) {
    const next = new URLSearchParams(params);
    next.set('mode', id);
    setParams(next, { replace: true });
    setDone(false);
  }

  if (validMode && !done) {
    if (selectedMode === 'pajama') return <PajamaForm />;
    if (isNewMode(selectedMode)) return <ModeForm />;
    return <InvitationIntakeForm onDone={() => setDone(true)} />;
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black p-5 text-[#f5ebd1]">
        <section className="w-full max-w-md rounded-2xl border border-[#b99a45] bg-[#111] p-8 text-center">
          <div className="text-4xl text-[#E8C26B]">✓</div>
          <h1 className="mt-3 text-2xl font-bold text-[#E8C26B]">Η ΣΥΜΜΕΤΟΧΗ ΚΑΤΑΧΩΡΗΘΗΚΕ</h1>
          <p className="mt-3 text-sm text-[#b6aa8b]">Η αίτησή σου στάλθηκε για έγκριση από τη διοργανώτρια.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f5ebd1]">
      <div className="mx-auto max-w-2xl">
        <header className="rounded-2xl border border-[#b99a45] bg-gradient-to-br from-[#201a0d] to-[#090909] p-6 text-center">
          <div className="text-xs tracking-[.4em] text-[#E8C26B]">DEAL OF TEMPTATIONS</div>
          <h1 className="mt-3 text-3xl font-bold text-[#F7E3A8]">ΦΟΡΜΑ ΣΥΜΜΕΤΟΧΗΣ</h1>
          <p className="mt-2 text-sm text-[#b6aa8b]">Επίλεξε ένα Mode για να συμπληρώσεις την αίτησή σου.</p>
        </header>
        <h2 className="mt-6 text-xs font-bold tracking-[.3em] text-[#E8C26B]">🎲 ΜΗΧΑΝΕΣ ΠΑΙΧΝΙΔΙΟΥ</h2>
        <section className="mt-3 grid gap-3 sm:grid-cols-2">
          {GAME_MODES.filter((m) => m.kind === 'engine').map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => chooseMode(mode.id)}
              className="overflow-hidden rounded-2xl border border-[#806a35] bg-[#111] text-left hover:border-[#E8C26B]"
            >
              {MODE_COVERS[`modeCover_${mode.id}`] && <img src={MODE_COVERS[`modeCover_${mode.id}`]} alt="" loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover" />}
              <span className="block p-4">
                <span className="block text-lg font-bold text-[#F7E3A8]">{mode.icon} {mode.name}</span>
                <span className="mt-2 block text-sm text-[#b6aa8b]">{mode.desc}</span>
              </span>
            </button>
          ))}
        </section>
        <h2 className="mt-6 text-xs font-bold tracking-[.3em] text-[#E8C26B]">📱 ΨΗΦΙΑΚΑ MODES</h2>
        <section className="mt-3 grid gap-3 sm:grid-cols-2">
          {GAME_MODES.filter((m) => m.kind !== 'engine').map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => chooseMode(mode.id)}
              className="overflow-hidden rounded-2xl border border-[#806a35] bg-[#111] text-left hover:border-[#E8C26B]"
            >
              {MODE_COVERS[`modeCover_${mode.id}`] && <img src={MODE_COVERS[`modeCover_${mode.id}`]} alt="" loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover" />}
              <span className="block p-4">
                <span className="block text-lg font-bold text-[#F7E3A8]">{mode.icon} {mode.name}</span>
                <span className="mt-2 block text-sm text-[#b6aa8b]">{mode.desc}</span>
              </span>
            </button>
          ))}
        </section>
        <p className="mt-5 text-center text-xs text-[#81775f]">Μία υποβολή αντιστοιχεί σε ένα μόνο Mode. Η συμμετοχή ενεργοποιείται μετά την έγκριση.</p>
      </div>
    </main>
  );
}
