import React, { useState, useEffect } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import Timer from '@/components/comic/Timer';
import PlayerCard from '@/components/shared/PlayerCard';
import SpeakButton from '@/components/comic/VoiceReader';
import DecibelMeter from '@/components/comic/DecibelMeter';
import { drawCard, isFullyRestrained, getCurrentPenalty, addHistory, calculateMostWanted, applyPenaltyStep, reducePenaltyStep } from '@/lib/gameLogic';
import MugshotScreen from '@/components/tablet/MugshotScreen';
import PrisonBreak from '@/components/tablet/PrisonBreak';

function SectionHeader({ children, aside }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-primary/10 pb-2">
      <span className="ds-eyebrow text-primary/85">{children}</span>
      {aside && <span className="ds-label text-foreground/50">{aside}</span>}
    </div>
  );
}

export default function InterrogationScreen({ state, updateState, onRelease, onGoToFinale }) {
  const [question, setQuestion] = useState(null);
  const [truths, setTruths] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [confessed, setConfessed] = useState(false);
  const [released, setReleased] = useState(false);
  const [blindfold, setBlindfold] = useState(false);
  const [iceTickle, setIceTickle] = useState(false);
  const [showMugshot, setShowMugshot] = useState(true);
  const [showPrisonBreak, setShowPrisonBreak] = useState(false);

  const tiedPlayer = state.players.find((p) => isFullyRestrained(p)) || state.players[state.currentPlayerIndex];
  const timerDuration = confessed ? 10 : iceTickle ? 60 : 30;

  useEffect(() => {
    setQuestion(drawCard('hardcore'));
  }, []);

  function handleTruthful() {
    const newTruths = truths + 1;
    setTruths(newTruths);
    setConfessed(false);
    if (newTruths >= 3) {
      setReleased(true);
    } else {
      setQuestion(drawCard('hardcore'));
    }
  }

  function handleRefuse() {
    setTimerActive(true);
  }

  function handleTimerComplete() {
    setTimerActive(false);
    setConfessed(false);
    const newRounds = rounds + 1;
    setRounds(newRounds);
    if (newRounds >= 3) {
      setReleased(true);
    } else {
      setQuestion(drawCard('hardcore'));
    }
  }

  function handleConfess() {
    setConfessed(true);
  }

  async function handleRelease() {
    const isMostWanted = calculateMostWanted(state.players)?.id === tiedPlayer?.id;
    const updatedPlayers = state.players.map((p) =>
      p.id === tiedPlayer?.id ? { ...p, penaltyStep: Math.max(0, p.penaltyStep - 2) } : p
    );
    const history = addHistory({ ...state, players: updatedPlayers }, { type: 'release', player: tiedPlayer?.name });
    await updateState({ players: updatedPlayers, history });

    if (isMostWanted) {
      onGoToFinale();
    } else {
      onRelease();
    }
  }

  async function handleLaughPenalty() {
    const updatedPlayers = state.players.map((p) =>
      p.id === tiedPlayer?.id ? { ...p, laughShots: (p.laughShots || 0) + 1 } : p
    );
    const history = addHistory({ ...state, players: updatedPlayers }, { type: 'laugh_penalty', player: tiedPlayer?.name, detail: '+1 Shot από γέλιο' });
    await updateState({ players: updatedPlayers, history });
  }

  async function handlePrisonBreakResult(escaped) {
    let updatedPlayers = state.players.map((p) => ({ ...p }));
    const history = addHistory(state, { type: 'prison_break', player: tiedPlayer?.name, result: escaped ? 'απόδραση' : 'αποτυχία' });
    if (escaped) {
      updatedPlayers = updatedPlayers.map((p) => p.id === tiedPlayer?.id ? reducePenaltyStep(p, 1) : p);
    } else {
      updatedPlayers = updatedPlayers.map((p) => p.id === tiedPlayer?.id ? applyPenaltyStep(p) : p);
    }
    await updateState({ players: updatedPlayers, history });
    setShowPrisonBreak(false);
  }

  if (showMugshot && tiedPlayer) {
    return <MugshotScreen player={tiedPlayer} onContinue={() => setShowMugshot(false)} />;
  }

  return (
    <div className="min-h-screen comic-dots p-3 pb-24">
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="rounded-lg border border-primary/15 bg-surface-2/80 px-6 py-6 text-center animate-fade-up">
          <div className="ds-eyebrow text-primary/80">Στάδιο 02</div>
          <h1 className="ds-title mt-2 text-3xl sm:text-4xl">Ανάκριση</h1>
          <p className="ds-lede mt-2 text-sm">Ζώνη Δεσίματος Μυτών — Interrogation</p>
        </div>

        <ComicPanel className="border-destructive/25 bg-destructive/[0.07]">
          <SectionHeader aside={`${getCurrentPenalty(tiedPlayer)?.label || ''}`}>Δεμένη Παίκτρια</SectionHeader>
          <PlayerCard player={tiedPlayer} showRole compact />
          <div className="mt-3 flex gap-2 flex-wrap">
            <ComicButton variant="dark" size="sm" onClick={() => setShowMugshot(true)}>📸 Mugshot</ComicButton>
            <ComicButton variant="dark" size="sm" onClick={() => setShowPrisonBreak(true)}>🔓 Prison Break</ComicButton>
          </div>
        </ComicPanel>

        {showPrisonBreak && (
          <ComicPanel className="bg-card comic-pop">
            <PrisonBreak player={tiedPlayer} onComplete={handlePrisonBreakResult} />
          </ComicPanel>
        )}

        <ComicPanel className="bg-card">
          <SectionHeader aside="Ενεργά εφέ">Ρυθμίσεις Ανάκρισης</SectionHeader>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setBlindfold(!blindfold)}
              className={`rounded-sm border px-3 py-1.5 ds-label transition-colors duration-300 ease-lux ${
                blindfold
                  ? 'border-primary/45 bg-primary/[0.10] text-primary'
                  : 'border-primary/12 bg-surface-2/60 text-foreground/60'
              }`}
            >
              🙈 Μαντήλι · {blindfold ? 'Ενεργό' : 'Ανενεργό'}
            </button>
            <button
              onClick={() => setIceTickle(!iceTickle)}
              className={`rounded-sm border px-3 py-1.5 ds-label transition-colors duration-300 ease-lux ${
                iceTickle
                  ? 'border-primary/45 bg-primary/[0.10] text-primary'
                  : 'border-primary/12 bg-surface-2/60 text-foreground/60'
              }`}
            >
              🧊 Ice & Tickle · {iceTickle ? '60″' : '30″'}
            </button>
          </div>
        </ComicPanel>

        <ComicPanel className="bg-card">
          <div className="grid grid-cols-2 divide-x divide-primary/10 text-center">
            <div className="px-2">
              <div className="ds-label">Ειλικρινείς Απαντήσεις</div>
              <div className="ds-value mt-2 text-3xl text-primary">{truths}<span className="text-foreground/30">/3</span></div>
              <div className="ds-label mt-1 text-foreground/40">→ Απελευθέρωση</div>
            </div>
            <div className="px-2">
              <div className="ds-label">Γύροι Επιβίωσης</div>
              <div className="ds-value mt-2 text-3xl text-primary">{rounds}<span className="text-foreground/30">/3</span></div>
              <div className="ds-label mt-1 text-foreground/40">→ Απελευθέρωση</div>
            </div>
          </div>
        </ComicPanel>

        {!released && !timerActive && question && (
          <ComicPanel className="bg-card comic-pop">
            <SectionHeader aside={question.name}>Σκληρή Αλήθεια</SectionHeader>
            <div className="mb-4 rounded-sm border border-primary/12 bg-surface-1/70 p-5">
              <p className="font-body text-lg leading-relaxed text-foreground/90">{question.text}</p>
            </div>
            <div className="mb-4 text-center">
              <SpeakButton text={question.text} label="🔊 Εκφώνηση" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ComicButton variant="green" size="lg" onClick={handleTruthful}>
                ✓ Απάντησα Ειλικρινά
              </ComicButton>
              <ComicButton variant="red" size="lg" onClick={handleRefuse}>
                ✗ Αρνούμαι / Ψέμα
              </ComicButton>
            </div>
            <div className="mt-3 text-center">
              <ComicButton variant="purple" size="sm" onClick={handleConfess}>
                🤐 Confess · Timer 30″ → 10″
              </ComicButton>
              {confessed && <div className="ds-label mt-2 text-primary">Confess ενεργό · Timer μειωμένο</div>}
            </div>
          </ComicPanel>
        )}

        {timerActive && !released && (
          <ComicPanel className="border-destructive/35 bg-destructive/[0.12] py-8 text-center comic-pulse">
            <div className="ds-eyebrow text-destructive">Ποινή σε εξέλιξη</div>
            <h2 className="ds-title mt-2 mb-5 text-3xl">Γαργάλημα</h2>
            <Timer
              duration={timerDuration}
              running={timerActive}
              frozen={state.stopActive}
              onComplete={handleTimerComplete}
              label="Γαργάλημα Πατουσών/Μασχάλων"
              variant="cyan"
              size="lg"
            />
            <div className="mt-4 font-body text-sm text-foreground/70">
              {blindfold && '🙈 Με μαντήλι · '}
              {confessed && '🤐 Confess (10″) · '}
              Laugh Penalty: Αν γελάσει → +1 Shot (ταΐζεται από άλλη παίκτρια)
            </div>
            <div className="mt-4">
              <DecibelMeter label="LAUGH METER — Αν γελάσει → +1 Shot" size="md" onThreshold={handleLaughPenalty} />
            </div>
          </ComicPanel>
        )}

        {released && (
          <ComicPanel className="border-primary/30 bg-primary/[0.07] py-8 text-center comic-pop">
            <div className="ds-eyebrow text-primary/80">Ολοκληρώθηκε</div>
            <h2 className="ds-title mt-2 text-3xl">Απελευθέρωση</h2>
            <p className="ds-lede mt-2 mb-5 text-sm">
              {truths >= 3 ? '3 ειλικρινείς απαντήσεις' : '3 γύροι επιβίωσης'}
            </p>
            <ComicButton variant="green" size="lg" onClick={handleRelease}>
              ✅ Επιστροφή στο Παιχνίδι
            </ComicButton>
          </ComicPanel>
        )}
      </div>
    </div>
  );
}