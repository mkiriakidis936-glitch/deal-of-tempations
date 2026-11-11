import React, { useState, useEffect } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import Timer from '@/components/comic/Timer';
import PlayerCard from '@/components/shared/PlayerCard';
import { ULTIMATE_TRUTHS } from '@/data/gameContent';
import SpeakButton from '@/components/comic/VoiceReader';
import { calculateMostWanted, addHistory } from '@/lib/gameLogic';
import { TimeCapsuleReveal } from '@/components/tablet/TimeCapsulePanel';

export default function FinaleScreen({ state, updateState, onEnd }) {
  const [truthIndex, setTruthIndex] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [done, setDone] = useState(false);
  const [showCapsule, setShowCapsule] = useState(false);

  const mostWanted = calculateMostWanted(state.players);
  const currentTruth = ULTIMATE_TRUTHS[truthIndex];

  function handleAnswer() {
    const next = truthIndex + 1;
    setTruthIndex(next);
    setTimerActive(false);
    if (next >= ULTIMATE_TRUTHS.length) {
      setDone(true);
    }
  }

  function handleRefuse() {
    setTimerActive(true);
  }

  function handleTimerComplete() {
    handleAnswer();
  }

  async function handleUnbind() {
    const history = addHistory(state, { type: 'finale_complete', player: mostWanted?.name });
    await updateState({ history, stage: 0 });
    onEnd();
  }

  return (
    <div className="min-h-screen comic-dots p-3 pb-24">
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="rounded-lg border border-primary/15 bg-surface-2/80 px-6 py-6 text-center animate-fade-up">
          <div className="ds-eyebrow text-primary/80">Στάδιο 03</div>
          <h1 className="ds-title mt-2 text-3xl sm:text-4xl">Φινάλε Δεσμού</h1>
          <p className="ds-lede mt-2 text-sm">Ο τελικός αρχηγός — η έσχατη ανάκριση</p>
        </div>

        <ComicPanel className="border-primary/30 bg-primary/[0.06]">
          <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-primary/10 pb-2">
            <span className="ds-eyebrow text-primary/85">Πιο Καταζητούμενη</span>
            <span className="ds-label text-foreground/50">Τελικός Αρχηγός</span>
          </div>
          <PlayerCard player={mostWanted} showRole />
          <p className="ds-lede mt-3 text-center text-sm">
            Hogtie Restraint: Χέρια πίσω από την πλάτη, ενωμένα με αστραγάλους/Toe Tie.
            Πέλματα & μασχάλες 100% ακινητοποιημένα & εκτεθειμένα.
          </p>
        </ComicPanel>

        <ComicPanel className="bg-card">
          <div className="flex justify-center gap-2.5">
            {ULTIMATE_TRUTHS.map((_, i) => (
              <div
                key={i}
                className={`flex h-10 w-10 items-center justify-center rounded-full border ds-value transition-colors duration-300 ease-lux ${
                  i < truthIndex
                    ? 'border-primary/40 bg-primary/15 text-primary'
                    : i === truthIndex && !done
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-primary/12 bg-surface-2/60 text-foreground/40'
                }`}
              >
                {i < truthIndex ? '✓' : i + 1}
              </div>
            ))}
          </div>
        </ComicPanel>

        {!done && !timerActive && currentTruth && (
          <ComicPanel className="bg-card comic-pop">
            <div className="mb-3 border-b border-primary/10 pb-2 text-center">
              <span className="ds-eyebrow text-primary/85">Ultimate Truth {truthIndex + 1} / 3</span>
            </div>
            <div className="ds-label mb-3 text-center text-foreground/50">{currentTruth.name}</div>
            <div className="mb-4 rounded-sm border border-primary/12 bg-surface-1/70 p-5">
              <p className="font-body text-lg leading-relaxed text-foreground/90">{currentTruth.text}</p>
            </div>
            <div className="mb-4 text-center">
              <SpeakButton text={currentTruth.text} label="🔊 Εκφώνηση" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ComicButton variant="green" size="lg" onClick={handleAnswer}>
                ✓ Απάντησε
              </ComicButton>
              <ComicButton variant="red" size="lg" onClick={handleRefuse}>
                ✗ Αρνείσαι
              </ComicButton>
            </div>
            <div className="mt-3 text-center font-body text-xs text-foreground/55">
              Άρνηση → 45″ Co-op Tickle Attack (2 παίκτριες: 1 πατούσες + 1 μασχάλες)
            </div>
          </ComicPanel>
        )}

        {timerActive && !done && (
          <ComicPanel className="border-destructive/35 bg-destructive/[0.12] py-8 text-center comic-pulse">
            <div className="ds-eyebrow text-destructive">Ποινή σε εξέλιξη</div>
            <h2 className="ds-title mt-2 mb-5 text-3xl">Ομαδική Επίθεση Γαργαλήματος</h2>
            <Timer
              duration={45}
              running={timerActive}
              frozen={state.stopActive}
              onComplete={handleTimerComplete}
              label="2 παίκτριες γαργαλούν ταυτόχρονα"
              variant="cyan"
              size="lg"
            />
          </ComicPanel>
        )}

        {done && (
          <ComicPanel className="border-primary/30 bg-primary/[0.07] py-10 text-center comic-pop">
            <div className="ds-eyebrow text-primary/80">Ολοκληρώθηκε</div>
            <h2 className="ds-title mt-3 text-4xl">Λύσιμο Δεσμών</h2>
            <p className="ds-lede mt-3 mb-2">Πράσινη οθόνη λήξης — άμεσο λύσιμο όλων των δεσμών.</p>
            <div className="ds-label mb-6 text-primary/70">Victory Shot για όλες 🥃</div>
            {!showCapsule && state.timeCapsule && Object.keys(state.timeCapsule).length > 0 && (
              <ComicButton variant="purple" size="md" onClick={() => setShowCapsule(true)} className="mb-3">
                ⏳ Άνοιγμα Χρονοκάψουλας
              </ComicButton>
            )}
            {showCapsule && (
              <div className="mb-4">
                <TimeCapsuleReveal state={state} updateState={updateState} onClose={() => setShowCapsule(false)} />
              </div>
            )}
            <ComicButton variant="green" size="lg" onClick={handleUnbind}>
              ✅ Πράσινο Λύσιμο — Τέλος
            </ComicButton>
          </ComicPanel>
        )}
      </div>
    </div>
  );
}