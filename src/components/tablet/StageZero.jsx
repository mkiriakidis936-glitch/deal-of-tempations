import React, { useEffect, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import SessionQRCode from '@/components/shared/SessionQRCode';
import { HIDDEN_ROLES } from '@/data/gameConfig';
import { addHistory } from '@/lib/gameLogic';
import { TimeCapsuleInput } from '@/components/tablet/TimeCapsulePanel';

export default function StageZero({ state, updateState }) {
  const [step, setStep] = useState('stop');
  const [revealIdx, setRevealIdx] = useState(null);
  const [stopTested, setStopTested] = useState(false);
  const [tutorialRemaining, setTutorialRemaining] = useState(60);
  const [tutorialActive, setTutorialActive] = useState(false);


  useEffect(() => {
    if (!tutorialActive) return undefined;
    const startedAt = Date.now();
    let lastPublishedStep = 0;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setTutorialRemaining(remaining);
      const tutorialStep = Math.min(3, Math.floor(elapsed / 15));
      if (tutorialStep !== lastPublishedStep) {
        lastPublishedStep = tutorialStep;
        updateState({ tutorialDemo: { active: true, step: tutorialStep, remaining, startedAt } });
      }
      if (remaining === 0) {
        clearInterval(interval);
        setTutorialActive(false);
        updateState({ tutorialDemo: null });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tutorialActive]);

  async function handleStopTest() {
    await updateState({ stopActive: true });
    setTimeout(() => updateState({ stopActive: false }), 3000);
    setStopTested(true);
    setStep('roles');
  }

  function roleOf(player) {
    return HIDDEN_ROLES.find((r) => r.id === player.role);
  }

  function teamInfo(player) {
    if (state.mode === 'marathon') {
      return player.team === 'alpha'
        ? { name: 'TEAM ALPHA', icon: '💖' }
        : { name: 'TEAM BETA', icon: '💎' };
    }
    if (state.mode === 'arrest_heist') {
      return {
        name: player.team === 'A' ? 'TEAM ALPHA' : 'TEAM BETA',
        icon: player.team === 'A' ? '💖' : '💎',
        isLeader: player.isLeader,
      };
    }
    return null;
  }

  async function handleStart() {
    const history = addHistory(state, { type: 'game_start', detail: 'ΕΝΑΡΞΗ ΠΑΙΧΝΙΔΙΟΥ' });
    await updateState({ stage: 1, history, tutorialDemo: null, countdownStartedAt: Date.now(), gameStartedAt: Date.now(), gamePausedMs: 0, gamePausedAt: null, gameTimeExpiredAt: null });
  }

  async function startTutorial() {
    setTutorialRemaining(60);
    setTutorialActive(true);
    await updateState({ tutorialDemo: { active: true, step: 0, remaining: 60, startedAt: Date.now() } });
  }

  async function stopTutorial() {
    setTutorialActive(false);
    await updateState({ tutorialDemo: null });
  }

  const isClassic = state.mode === 'classic';
  const modeLabel = isClassic ? 'CLASSIC' : state.mode === 'marathon' ? 'MEGA MARATHON' : 'ARREST & HEIST';
  const revealTitle = isClassic ? '🎭 ΚΡΥΦΟΙ ΡΟΛΟΙ' : '👥 ΟΜΑΔΕΣ';
  const revealDesc = isClassic
    ? 'Κάθε παίκτρια πατάει το όνομά της για να δει ιδιωτικά τον ρόλο της. 1 ειδική ικανότητα ανά παρτίδα.'
    : 'Κάθε παίκτρια πατάει το όνομά της για να δει ιδιωτικά την ομάδα της.';

  return (
    <div className="min-h-screen comic-dots p-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-4">
        <ComicPanel className="ds-sheen py-7 text-center">
          <div className="ds-eyebrow text-primary/80">Στάδιο 0 · Εκκίνηση · {modeLabel}</div>
          <h1 className="ds-title mt-2 text-4xl text-foreground">Deal of Temptation</h1>
          <div className="ds-rule mx-auto mt-4 w-24" />
        </ComicPanel>

        <SessionQRCode sessionCode={state.sessionCode} size={180} />
        {state.safetyProfile?.safeWord && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-center">
            <div className="text-xs font-bold tracking-wider text-destructive">ΚΟΙΝΗ ΛΕΞΗ ΑΣΦΑΛΕΙΑΣ</div>
            <div className="font-heading text-2xl text-foreground">{state.safetyProfile.safeWord}</div>
          </div>
        )}

        {step === 'stop' && (
          <ComicPanel className="bg-card text-center py-10 comic-pop">
            <div className="text-6xl mb-3">⏹</div>
            <div className="font-heading text-3xl mb-2 text-primary">ΔΟΚΙΜΗ ΣΤΟΠ</div>
            <p className="text-sm mb-5 max-w-md mx-auto text-foreground/70 font-body">Το κόκκινο κουμπί ΣΤΟΠ παγώνει τη ροή. Η κοινή λέξη ασφαλείας είναι «{state.safetyProfile?.safeWord || '—'}». Πάτησέ το τώρα για δοκιμή — θα ξαναρχίσει σε 3″.</p>
            <ComicButton variant="red" size="lg" onClick={handleStopTest} disabled={stopTested}>
              ⏹ ΔΟΚΙΜΑΣΤΙΚΟ ΣΤΟΠ
            </ComicButton>
            {stopTested && <div className="text-sm mt-3 font-bold text-tarot-forest">✓ ΣΤΟΠ λειτουργεί!</div>}
          </ComicPanel>
        )}

        {step === 'roles' && (
          <>
            <ComicPanel className="bg-card text-center py-6">
              <div className="ds-title mb-2 text-2xl text-primary">{revealTitle}</div>
              <p className="text-sm mb-4 max-w-md mx-auto text-foreground/70 font-body">{revealDesc}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {state.players.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setRevealIdx(revealIdx === i ? null : i)}
                    className={`comic-panel-sm p-2 ${revealIdx === i ? 'bg-background text-primary' : 'bg-secondary'}`}
                  >
                    <div className="font-heading text-lg text-foreground">{p.name}</div>
                    {revealIdx === i && (
                      <div className="text-sm mt-1 comic-pop">
                        {isClassic ? (
                          <>
                            <div className="text-xl">{roleOf(p)?.icon}</div>
                            <div className="font-bold text-primary">{roleOf(p)?.name}</div>
                            <div className="text-xs text-primary/80 font-body">{roleOf(p)?.desc}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-xl">{teamInfo(p)?.icon}</div>
                            <div className="font-bold text-primary">{teamInfo(p)?.name}</div>
                            {teamInfo(p)?.isLeader && <div className="text-xs text-tarot-gold font-bold">⭐ ΑΡΧΗΓΟΣ</div>}
                          </>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ComicPanel>
            <div className="text-center">
              <ComicButton variant="purple" size="lg" onClick={() => setStep('capsule')}>
                ⏳ ΧΡΟΝΟΚΑΨΟΥΛΑ
              </ComicButton>
            </div>
          </>
        )}

        {step === 'capsule' && (
          <TimeCapsuleInput
            state={state}
            updateState={updateState}
            onContinue={() => setStep('start')}
          />
        )}

        {step === 'start' && (
          <ComicPanel className="bg-tarot-forest text-center py-6 comic-pop space-y-3">
            <div className="ds-title mb-3 text-2xl text-primary">Έτοιμες;</div>
            {!tutorialActive ? (
              <ComicButton variant="purple" size="lg" onClick={startTutorial}>
                ▶ ΔΙΑΔΡΑΣΤΙΚΟ TUTORIAL · 60″
              </ComicButton>
            ) : (
              <div className="space-y-3">
                <div className="font-heading text-3xl text-primary">TUTORIAL · {tutorialRemaining}″</div>
                <p className="text-sm text-foreground/75">Ακολούθησε τα βήματα που εμφανίζονται στην TV. Δεν υπάρχουν ποινές ή πραγματική δέσμευση κατά την πρόβα.</p>
                <ComicButton variant="dark" onClick={stopTutorial}>ΤΕΛΟΣ ΠΡΟΒΑΣ</ComicButton>
              </div>
            )}
            <ComicButton variant="green" size="lg" onClick={handleStart} disabled={tutorialActive}>
              🎬 ΕΝΑΡΞΗ ΠΑΙΧΝΙΔΙΟΥ
            </ComicButton>
          </ComicPanel>
        )}
      </div>
    </div>
  );
}