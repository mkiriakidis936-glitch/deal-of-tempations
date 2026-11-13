import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { DURATIONS, INTENSITIES, createNight, pickTwist, agendaMessages } from '@/lib/nightDirector';

// Κουμπί + πάνελ του Σκηνοθέτη στο tablet. Δουλεύει πάνω από κάθε mode.
export default function NightDirectorHost({ state, updateState }) {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState(180);
  const [intensity, setIntensity] = useState('medium');
  const night = state.night;
  const players = state.players || [];

  async function start() {
    if (!players.length) return;
    const created = createNight({ durationMin: duration, intensity, players });
    await updateState({ night: created, privateMessages: agendaMessages(created, state.privateMessages) });
  }

  async function patch(partial) {
    await updateState({ night: { ...night, ...partial } });
  }

  async function fireTwist() {
    const t = pickTwist(night);
    const history = [{ type: 'plot_twist', description: `ΑΝΑΤΡΟΠΗ: ${t.text}`, timestamp: Date.now() }, ...(state.history || [])];
    await updateState({
      night: { ...night, twist: { text: t.text, at: Date.now() }, twistsUsed: [...(night.twistsUsed || []), t.idx] },
      history,
    });
  }

  async function setDone(pid, value) {
    const current = night.agendas[pid];
    await patch({ agendas: { ...night.agendas, [pid]: { ...current, done: current.done === value ? null : value } } });
  }

  function cancelNight() {
    if (window.confirm('Να ακυρωθεί ο Σκηνοθέτης της βραδιάς;')) updateState({ night: null });
  }

  const idx = night?.roundIdx || 0;
  const nameOf = (pid) => players.find((p) => p.id === pid)?.name || '—';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-3 z-[60] comic-boom bg-tarot-royal text-tarot-gold px-3 py-2 font-heading text-sm"
      >
        🎭 ΣΚΗΝΟΘΕΤΗΣ
      </button>
      {open && (
        <div className="fixed inset-0 z-[75] bg-background/85 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-2xl w-full space-y-3 max-h-[90vh] overflow-y-auto">
            <ComicPanel className="bg-tarot-royal text-center py-4">
              <div className="font-heading text-3xl comic-text-stroke text-tarot-gold">Ο ΣΚΗΝΟΘΕΤΗΣ ΤΗΣ ΒΡΑΔΙΑΣ</div>
              <div className="text-sm font-bold text-foreground/80 font-body">Πρόγραμμα, κρυφοί στόχοι, ανατροπές, αποκάλυψη</div>
            </ComicPanel>

            {!night ? (
              <ComicPanel className="bg-card space-y-3">
                <div className="font-heading text-lg text-primary">ΔΙΑΡΚΕΙΑ</div>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <ComicButton key={d} variant={duration === d ? 'yellow' : 'dark'} size="md" className="flex-1" onClick={() => setDuration(d)}>
                      {d / 60} ώρες
                    </ComicButton>
                  ))}
                </div>
                <div className="font-heading text-lg text-primary">ΕΝΤΑΣΗ</div>
                <div className="flex gap-2">
                  {INTENSITIES.map((i) => (
                    <ComicButton key={i.id} variant={intensity === i.id ? 'red' : 'dark'} size="md" className="flex-1" onClick={() => setIntensity(i.id)}>
                      {i.label}
                    </ComicButton>
                  ))}
                </div>
                <div className="text-sm text-foreground/70 font-body">
                  {players.length
                    ? `Θα μοιραστούν ${players.length} κρυφοί στόχοι στα κινητά.`
                    : 'Πρόσθεσε πρώτα παίκτριες στο παιχνίδι.'}
                </div>
                <ComicButton variant="yellow" size="lg" className="w-full" disabled={!players.length} onClick={start}>
                  🎭 ΞΕΚΙΝΑ ΤΗ ΒΡΑΔΙΑ
                </ComicButton>
              </ComicPanel>
            ) : (
              <>
                <ComicPanel className="bg-card space-y-2">
                  <div className="flex justify-between items-baseline">
                    <div className="font-heading text-lg text-primary">ΤΟ ΠΡΟΓΡΑΜΜΑ</div>
                    <div className="text-xs text-foreground/60">{night.settings?.durationMin}′ · {night.program.length} γύροι</div>
                  </div>
                  {night.program.map((r, i) => (
                    <div key={r.id} className={`p-2 border ${i === idx ? 'border-primary bg-primary/15' : 'border-border'}`}>
                      <div className="flex justify-between text-sm">
                        <span className="font-heading">{i + 1} · {r.title}</span>
                        <span className="text-foreground/60">{r.start}′ – {r.end}′</span>
                      </div>
                      <div className="text-xs text-foreground/60">{r.desc}</div>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <ComicButton variant="dark" size="sm" disabled={idx === 0} onClick={() => patch({ roundIdx: idx - 1 })}>◀ ΠΡΟΗΓΟΥΜΕΝΟΣ</ComicButton>
                    <ComicButton variant="yellow" size="sm" className="flex-1" disabled={idx >= night.program.length - 1} onClick={() => patch({ roundIdx: idx + 1 })}>ΕΠΟΜΕΝΟΣ ΓΥΡΟΣ ▶</ComicButton>
                  </div>
                  <ComicButton variant="red" size="md" className="w-full" onClick={fireTwist}>⚡ ΑΝΑΤΡΟΠΗ ΤΩΡΑ</ComicButton>
                  {night.twist && <div className="text-xs text-foreground/70">Τελευταία ανατροπή: {night.twist.text}</div>}
                </ComicPanel>

                <ComicPanel className="bg-card space-y-2">
                  <div className="font-heading text-lg text-primary">ΚΡΥΦΟΙ ΣΤΟΧΟΙ</div>
                  {Object.entries(night.agendas).map(([pid, a]) => (
                    <div key={pid} className="flex items-center gap-2 border-t border-border pt-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-heading text-sm">{nameOf(pid)}</div>
                        <div className="text-xs text-foreground/70">{a.text}</div>
                      </div>
                      <ComicButton variant={a.done === true ? 'yellow' : 'dark'} size="sm" onClick={() => setDone(pid, true)}>✓</ComicButton>
                      <ComicButton variant={a.done === false ? 'red' : 'dark'} size="sm" onClick={() => setDone(pid, false)}>✗</ComicButton>
                    </div>
                  ))}
                </ComicPanel>

                <div className="flex gap-2">
                  <ComicButton variant="purple" size="lg" className="flex-1" onClick={() => patch({ reveal: !night.reveal })}>
                    {night.reveal ? '⏹ ΚΛΕΙΣΙΜΟ ΑΠΟΚΑΛΥΨΗΣ' : '🎬 ΜΕΓΑΛΗ ΑΠΟΚΑΛΥΨΗ ΣΤΗΝ TV'}
                  </ComicButton>
                  <ComicButton variant="dark" size="lg" onClick={cancelNight}>ΑΚΥΡΩΣΗ</ComicButton>
                </div>
              </>
            )}
            <ComicButton variant="red" size="md" className="w-full" onClick={() => setOpen(false)}>✕ ΚΛΕΙΣΙΜΟ</ComicButton>
          </div>
        </div>
      )}
    </>
  );
}
