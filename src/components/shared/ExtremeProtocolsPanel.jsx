import React, { useState, useRef, useEffect } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import Timer from '@/components/comic/Timer';
import { EXTREME_PROTOCOLS } from '@/data/gameContent';
import DoubleHogtie from '@/components/tablet/DoubleHogtie';
import CurseOfSilence from '@/components/tablet/CurseOfSilence';
import TiptoeCounter from '@/components/tablet/TiptoeCounter';
import InterrogationCycle from '@/components/tablet/InterrogationCycle';
import ToolGauntlet from '@/components/tablet/ToolGauntlet';
import ElectricChair from '@/components/tablet/ElectricChair';
import SpreadEagleLive from '@/components/tablet/SpreadEagleLive';
import UnbrokenOath from '@/components/tablet/UnbrokenOath';
import TPoseRestraint from '@/components/tablet/TPoseRestraint';
import FrogTieBalance from '@/components/tablet/FrogTieBalance';

export default function ExtremeProtocolsPanel({ state, updateState }) {
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState(null);
  const [active, setActive] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [targetBId, setTargetBId] = useState(null);
  const lastEventCount = useRef(null);

  const isUltra = false;
  const eventCount = state?.history?.length || 0;

  useEffect(() => {
    if (lastEventCount.current === null) { lastEventCount.current = eventCount; return; }
    if (eventCount - lastEventCount.current < 2) return;
    lastEventCount.current = eventCount;
    if (show || selected) return;
    if (Math.random() > 0.22) return;
    const pick = EXTREME_PROTOCOLS[Math.floor(Math.random() * EXTREME_PROTOCOLS.length)];
    setSelected(pick);
    setShow(true);
  }, [eventCount]);
  const players = state?.players || [];
  const target = players.find((p) => p.id === targetId);
  const targetB = players.find((p) => p.id === targetBId);
  const isDoubleHogtie = selected?.id === 'EP-04';
  const isCurseOfSilence = selected?.id === 'EP-07';
  const isTiptoe = selected?.id === 'EP-02';
  const isInterrogation = selected?.id === 'EP-03';
  const isToolGauntlet = selected?.id === 'EP-05';
  const isElectricChair = selected?.id === 'EP-08';
  const isSpreadEagle = selected?.id === 'EP-09';
  const isUnbrokenOath = selected?.id === 'EP-10';
  const isTPose = selected?.id === 'EP-01';
  const isFrogTie = selected?.id === 'EP-06';
  const hasInteractive = isDoubleHogtie || isCurseOfSilence || isTiptoe || isInterrogation || isToolGauntlet || isElectricChair || isSpreadEagle || isUnbrokenOath || isTPose || isFrogTie;

  async function applyPenalty(amount) {
    if (!targetId) return;
    const updatedPlayers = players.map((p) =>
      p.id === targetId ? { ...p, penaltyStep: Math.max(0, (p.penaltyStep || 0) + amount) } : p
    );
    const history = [...(state?.history || []), { type: 'extreme_protocol', player: target?.name, detail: `${selected?.name} → ${amount > 0 ? '+' : ''}${amount} ποινή` }];
    await updateState({ players: updatedPlayers, history });
    setActive(false);
    setTargetId(null);
  }

  return (
    <>
      <ComicButton variant="red" size="sm" onClick={() => setShow(true)}>
        ⚡ PROTOCOLS ({EXTREME_PROTOCOLS.length})
      </ComicButton>

      {show && (
        <div
          className="fixed inset-0 z-50 bg-background/50 flex items-center justify-center p-4"
          onClick={() => { setShow(false); setSelected(null); setActive(false); }}
        >
          <ComicPanel
            className="bg-card max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selected ? (
              <div>
                <div className="text-center mb-3">
                  <div className="text-5xl">{selected.icon}</div>
                  <div className="font-heading text-2xl">{selected.name}</div>
                  {isUltra && (
                    <div className="inline-block bg-background text-destructive px-2 py-0.5 rounded text-xs font-bold mt-1">
                      🔴 ULTRA PROTOCOL
                    </div>
                  )}
                  <div className="font-heading text-lg text-destructive">
                    ⏱ {(isUltra ? selected.ultra?.duration : selected.duration) || selected.duration}″
                  </div>
                </div>
                <div className={`comic-panel-sm p-3 mb-4 ${isUltra ? 'bg-background text-destructive/80' : 'bg-destructive/20'}`}>
                  {isUltra && selected.ultra ? (
                    <>
                      <p className="text-sm font-bold mb-1">{selected.ultra.desc}</p>
                      <p className="text-xs text-foreground/50 mt-2">Βασικός κανόνας: {selected.desc}</p>
                    </>
                  ) : (
                    <p className="text-sm">{selected.desc}</p>
                  )}
                </div>
                {!active && (
                  <div className="mb-4">
                    <div className="text-xs font-bold mb-1">🎯 ΣΤΟΧΟΣ{isDoubleHogtie ? ' Α' : ''}:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {players.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setTargetId(p.id)}
                          className={`comic-panel-sm p-1.5 text-xs ${targetId === p.id ? 'bg-destructive ring-2 ring-primary' : 'bg-secondary'}`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                    {isDoubleHogtie && (
                      <>
                        <div className="text-xs font-bold mt-2 mb-1">🎯 ΣΤΟΧΟΣ Β:</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                          {players.filter((p) => p.id !== targetId).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setTargetBId(p.id)}
                              className={`comic-panel-sm p-1.5 text-xs ${targetBId === p.id ? 'bg-destructive ring-2 ring-primary' : 'bg-secondary'}`}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {active && isDoubleHogtie && target && targetB && (
                  <div className="mb-4">
                    <DoubleHogtie
                      playerA={target}
                      playerB={targetB}
                      duration={isUltra ? (selected.ultra?.duration || 90) : selected.duration}
                      frozen={state?.stopActive}
                      onResult={(res) => {
                        let players = state.players.map((p) => ({ ...p }));
                        if (res.bothSurvived) {
                          players = players.map((p) => (p.id === target.id || p.id === targetB.id) ? { ...p, penaltyStep: Math.max(0, p.penaltyStep - 1) } : p);
                        } else if (res.gaveUp) {
                          const survivorId = res.gaveUp === 'A' ? targetB.id : target.id;
                          players = players.map((p) => p.id === survivorId ? { ...p, immunity: true } : p);
                        }
                        updateState({ players });
                        setActive(false);
                      }}
                    />
                  </div>
                )}
                {active && isCurseOfSilence && target && (
                  <div className="mb-4">
                    <CurseOfSilence
                      duration={isUltra ? (selected.ultra?.duration || 60) : selected.duration}
                      frozen={state?.stopActive}
                      onComplete={(res) => {
                        if (res.violations > 0) applyPenalty(isUltra ? 2 : 1);
                        else setActive(false);
                      }}
                    />
                  </div>
                )}
                {active && isTiptoe && target && (
                  <div className="mb-4">
                    <TiptoeCounter
                      duration={isUltra ? (selected.ultra?.duration || 60) : selected.duration}
                      ultra={isUltra}
                      frozen={state?.stopActive}
                      onComplete={() => setActive(false)}
                    />
                  </div>
                )}
                {active && isInterrogation && target && (
                  <div className="mb-4">
                    <InterrogationCycle
                      duration={isUltra ? (selected.ultra?.duration || 120) : selected.duration}
                      ultra={isUltra}
                      frozen={state?.stopActive}
                      onComplete={() => setActive(false)}
                    />
                  </div>
                )}
                {active && isToolGauntlet && target && (
                  <div className="mb-4">
                    <ToolGauntlet
                      duration={isUltra ? (selected.ultra?.duration || 180) : selected.duration}
                      ultra={isUltra}
                      frozen={state?.stopActive}
                      onComplete={() => setActive(false)}
                    />
                  </div>
                )}
                {active && isElectricChair && target && (
                  <div className="mb-4">
                    <ElectricChair
                      duration={isUltra ? (selected.ultra?.duration || 90) : selected.duration}
                      ultra={isUltra}
                      frozen={state?.stopActive}
                      onComplete={() => setActive(false)}
                    />
                  </div>
                )}
                {active && isSpreadEagle && target && (
                  <div className="mb-4">
                    <SpreadEagleLive
                      duration={isUltra ? (selected.ultra?.duration || 120) : selected.duration}
                      ultra={isUltra}
                      frozen={state?.stopActive}
                      onComplete={() => setActive(false)}
                    />
                  </div>
                )}
                {active && isUnbrokenOath && target && (
                  <div className="mb-4">
                    <UnbrokenOath
                      duration={isUltra ? (selected.ultra?.duration || 45) : selected.duration}
                      ultra={isUltra}
                      frozen={state?.stopActive}
                      onComplete={() => setActive(false)}
                    />
                  </div>
                )}
                {active && isTPose && target && (
                  <div className="mb-4">
                    <TPoseRestraint
                      duration={isUltra ? (selected.ultra?.duration || 90) : selected.duration}
                      ultra={isUltra}
                      frozen={state?.stopActive}
                      onComplete={() => setActive(false)}
                    />
                  </div>
                )}
                {active && isFrogTie && target && (
                  <div className="mb-4">
                    <FrogTieBalance
                      duration={isUltra ? (selected.ultra?.duration || 45) : selected.duration}
                      ultra={isUltra}
                      frozen={state?.stopActive}
                      onComplete={() => setActive(false)}
                    />
                  </div>
                )}
                {active && !hasInteractive && (isUltra ? selected.ultra?.duration || selected.duration : selected.duration) && (
                  <div className="mb-4">
                    <Timer
                      duration={isUltra ? (selected.ultra?.duration || selected.duration) : selected.duration}
                      running={true}
                      frozen={state?.stopActive}
                      onComplete={() => setActive(false)}
                      label={isUltra ? 'ULTRA' : 'EXTREME'}
                      size="lg"
                    />
                  </div>
                )}
                <div className="flex gap-2 justify-center flex-wrap">
                  {!active && (
                    <ComicButton variant="red" size="sm" onClick={() => setActive(true)} disabled={!targetId || (isDoubleHogtie && !targetBId)}>
                      ▶ ΕΝΑΡΞΗ ({(isUltra ? selected.ultra?.duration || selected.duration : selected.duration)}″)
                    </ComicButton>
                  )}
                  {active && (
                    <>
                      <ComicButton variant="red" size="sm" onClick={() => applyPenalty(isUltra ? 2 : 1)}>
                        ❌ ΑΠΟΤΥΧΙΑ (+{isUltra ? 2 : 1})
                      </ComicButton>
                      <ComicButton variant="green" size="sm" onClick={() => applyPenalty(isUnbrokenOath ? (isUltra ? -2 : -1) : 0)}>
                        ✅ ΕΠΙΤΥΧΙΑ{isUnbrokenOath ? ` (${isUltra ? -2 : -1})` : ''}
                      </ComicButton>
                    </>
                  )}
                  <ComicButton
                    variant="green"
                    size="sm"
                    onClick={() => { setShow(false); setSelected(null); setActive(false); setTargetId(null); }}
                  >
                    ✅ ΟΛΟΚΛΗΡΩΘΗΚΕ
                  </ComicButton>
                  <ComicButton
                    variant="yellow"
                    size="sm"
                    onClick={() => { setSelected(null); setActive(false); setTargetId(null); }}
                  >
                    ← ΠΙΣΩ
                  </ComicButton>
                </div>
              </div>
            ) : (
              <div>
                <div className="font-heading text-xl mb-1 text-center">
                  ⚡ EXTREME PROTOCOLS ({EXTREME_PROTOCOLS.length})
                </div>
                <div className="text-xs text-center mb-3 text-foreground/60">
                  Εμφανίζονται τυχαία μέσα στο παιχνίδι — διάλεξε πρωτόκολλο για εκτέλεση.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXTREME_PROTOCOLS.map((p) => {
                    const dur = isUltra ? p.ultra?.duration || p.duration : p.duration;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelected(p)}
                        className={`comic-panel-sm p-2 text-left flex items-center gap-2 ${isUltra ? 'bg-background text-destructive/80 hover:bg-background/80' : 'bg-destructive/20 hover:bg-destructive/30'}`}
                      >
                        <span className="text-2xl">{p.icon}</span>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{p.name}</div>
                          <div className={`text-xs ${isUltra ? 'text-destructive' : 'text-foreground/60'}`}>⏱ {dur}″</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="text-center mt-3">
                  <ComicButton variant="dark" size="sm" onClick={() => setShow(false)}>
                    ΚΛΕΙΣΙΜΟ
                  </ComicButton>
                </div>
              </div>
            )}
          </ComicPanel>
        </div>
      )}
    </>
  );
}