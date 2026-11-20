import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import Timer from '@/components/comic/Timer';
import {
  BOMB_TYPING_TYPES, BOMB_RIDDLES_ALPHA, BOMB_RIDDLES_BETA,
  BOMB_PASO_TRIALS, getPenaltyLadder,
} from '@/data/gameConfig';
import { addHistory } from '@/lib/gameLogic';
import WireCutGame from '@/components/tablet/WireCutGame';
import TiptoeSuspense from '@/components/tablet/TiptoeSuspense';
import SpeakButton from '@/components/comic/VoiceReader';

// Phases: intro → riddles → code → defused | explosion → paso_select → paso_trial → freed | restrained
export default function BombEventScreen({ state, updateState, onExit, onGoToStage2 }) {
  const [phase, setPhase] = useState('intro');
  const [riddleSet, setRiddleSet] = useState('alpha');
  const [riddleIdx, setRiddleIdx] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [solvedAnswers, setSolvedAnswers] = useState([]);
  const [codeInput, setCodeInput] = useState('');
  const [selectedTyping, setSelectedTyping] = useState(null);
  const [selectedPaso, setSelectedPaso] = useState(null);

  const target = state.players.find((p) => p.id === state.bombEvent?.targetId) || state.players[0];
  const riddles = riddleSet === 'alpha' ? BOMB_RIDDLES_ALPHA : BOMB_RIDDLES_BETA;
  const bombCode = riddles[0].code;
  const currentRiddle = riddles[riddleIdx];

  function handleRiddleResult(solved) {
    if (solved) {
      setSolvedCount((c) => c + 1);
      setSolvedAnswers((a) => [...a, currentRiddle]);
    }
    if (riddleIdx < riddles.length - 1) {
      setRiddleIdx((i) => i + 1);
    } else {
      setPhase('wirecut');
    }
  }

  async function handleWireCut(success) {
    if (success) {
      setPhase('code');
    } else {
      const history = addHistory(state, { type: 'bomb_exploded', player: target.name });
      await updateState({ history });
      setPhase('explosion');
    }
  }

  async function handleCodeSubmit() {
    if (codeInput.trim().toLowerCase() === bombCode.toLowerCase()) {
      const history = addHistory(state, { type: 'bomb_defused', player: target.name });
      const updatedPlayers = state.players.map((p) =>
        p.id === target.id ? { ...p, bounty: (p.bounty || 0) + 2000 } : p
      );
      await updateState({ history, players: updatedPlayers });
      setPhase('defused');
    } else {
      const history = addHistory(state, { type: 'bomb_exploded', player: target.name });
      await updateState({ history });
      setPhase('explosion');
    }
  }

  async function handleTimerExpire() {
    const history = addHistory(state, { type: 'bomb_timeout', player: target.name });
    await updateState({ history });
    setPhase('explosion');
  }

  function handleTypingSelect(typing) {
    setSelectedTyping(typing);
    if (typing.id === 'tiptoe') {
      setPhase('tiptoe');
    } else {
      setPhase('paso_select');
    }
  }

  async function handleTiptoeResult(_result) {
    // Tiptoe survived → freed
    const history = addHistory(state, { type: 'bomb_paso', paso: 'Tiptoe Suspense', success: true, player: target.name });
    await updateState({ history });
    setPhase('freed');
  }

  function handlePasoSelect(paso) {
    setSelectedPaso(paso);
    setPhase('paso_trial');
  }

  async function handlePasoResult(success) {
    const history = addHistory(state, {
      type: 'bomb_paso',
      paso: selectedPaso?.name,
      success,
      player: target.name,
    });
    if (success) {
      await updateState({ history });
      setPhase('freed');
    } else {
      const updatedPlayers = state.players.map((p) => {
        if (p.id === target.id) {
          const ladder = getPenaltyLadder(p.footwearLevel);
          return { ...p, penaltyStep: ladder.length };
        }
        return p;
      });
      await updateState({ history, players: updatedPlayers });
      setPhase('restrained');
    }
  }

  // ===== INTRO =====
  if (phase === 'intro') {
    return (
      <div className="min-h-screen comic-dots-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <ComicPanel className="border-destructive/35 bg-destructive/[0.10] py-10 text-center">
            <div className="text-5xl opacity-75">💣</div>
            <div className="ds-eyebrow mt-3 text-destructive">Βόμβα</div>
            <h1 className="ds-title mt-2 text-4xl">Στόχος {target.name}</h1>
          </ComicPanel>

          <ComicPanel className="bg-card">
            <div className="mb-3 border-b border-primary/10 pb-2 text-center">
              <span className="ds-eyebrow text-primary/85">Επιλογή Γρίφων</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRiddleSet('alpha')}
                className={`rounded-sm border p-4 text-center transition-colors duration-300 ease-lux ${
                  riddleSet === 'alpha' ? 'border-primary/45 bg-primary/[0.08]' : 'border-primary/12 bg-surface-1/60'
                }`}
              >
                <div className={`ds-value text-base ${riddleSet === 'alpha' ? 'text-primary' : 'text-foreground/65'}`}>ΑΛΦΑ</div>
                <div className="ds-label mt-1 text-foreground/45">Κωδικός 4 ψηφίων</div>
              </button>
              <button
                onClick={() => setRiddleSet('beta')}
                className={`rounded-sm border p-4 text-center transition-colors duration-300 ease-lux ${
                  riddleSet === 'beta' ? 'border-primary/45 bg-primary/[0.08]' : 'border-primary/12 bg-surface-1/60'
                }`}
              >
                <div className={`ds-value text-base ${riddleSet === 'beta' ? 'text-primary' : 'text-foreground/65'}`}>ΒΗΤΑ</div>
                <div className="ds-label mt-1 text-foreground/45">Κωδικός 3 ψηφίων</div>
              </button>
            </div>
          </ComicPanel>

          <div className="text-center space-y-2">
            <SpeakButton text={`Bomb Event. Στόχος: ${target.name}. Ξεκινήστε την αποσυμπίεση.`} label="🔊 ΕΚΦΩΝΗΣΗ" />
            <div>
              <ComicButton variant="red" size="lg" onClick={() => setPhase('riddles')}>
                ⚡ ΕΚΚΙΝΗΣΗ ΒΟΜΒΑΣ
              </ComicButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== RIDDLES =====
  if (phase === 'riddles') {
    return (
      <div className="min-h-screen comic-dots-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <ComicPanel className="bg-card">
            <div className="flex items-baseline justify-between gap-3">
              <span className="ds-eyebrow text-primary/85">Γρίφος {riddleIdx + 1} / 6</span>
              <span className="ds-label text-foreground/50">
                Λύθηκαν <span className="ds-value ml-1 text-foreground/80">{solvedCount}</span>
              </span>
            </div>
          </ComicPanel>

          <ComicPanel className="bg-card comic-pop" key={riddleIdx}>
            <div className="text-center mb-4">
              <div className="text-sm font-bold text-foreground/60">Σετ: {riddleSet.toUpperCase()}</div>
              <div className="font-heading text-lg">ΓΡΙΦΟΣ #{currentRiddle.id}</div>
            </div>
            <div className="comic-panel-sm p-4 bg-secondary mb-4">
              <p className="text-lg font-medium">{currentRiddle.question}</p>
            </div>
            {currentRiddle.logic && (
              <div className="text-xs text-foreground/50 mb-3">💡 Λογική: {currentRiddle.logic}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <ComicButton variant="green" size="lg" onClick={() => handleRiddleResult(true)}>
                ✅ ΛΥΘΗΚΕ
              </ComicButton>
              <ComicButton variant="red" size="lg" onClick={() => handleRiddleResult(false)}>
                ❌ ΑΠΟΤΥΧΙΑ
              </ComicButton>
            </div>
            <div className="text-center mt-3">
              <SpeakButton text={currentRiddle.question} label="🔊 ΕΚΦΩΝΗΣΗ ΓΡΙΦΟΥ" />
            </div>
          </ComicPanel>

          <div className="flex justify-center gap-1">
            {riddles.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-6 rounded-full transition-colors duration-300 ease-lux ${
                  i < riddleIdx ? 'bg-primary/45' : i === riddleIdx ? 'bg-primary' : 'bg-primary/12'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== WIRE CUT =====
  if (phase === 'wirecut') {
    return (
      <div className="min-h-screen comic-dots-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <ComicPanel className="border-destructive/30 bg-destructive/[0.08] text-center">
            <div className="ds-eyebrow text-destructive">Αποκοπή Καλωδίων</div>
            <div className="ds-lede mt-2 text-sm">Λύθηκαν {solvedCount}/6 γρίφοι — απόκοψε τα καλώδια στη σωστή σειρά.</div>
          </ComicPanel>
          <ComicPanel className="bg-card">
            <WireCutGame onComplete={handleWireCut} />
          </ComicPanel>
        </div>
      </div>
    );
  }

  // ===== CODE ENTRY =====
  if (phase === 'code') {
    return (
      <div className="min-h-screen comic-dots-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <ComicPanel className="border-destructive/30 bg-destructive/[0.08] text-center">
            <div className="ds-eyebrow text-destructive">Αποσυμπίεση Κωδικού</div>
            <div className="ds-lede mt-2 text-sm">Λύθηκαν {solvedCount}/6 γρίφοι</div>
          </ComicPanel>

          {solvedAnswers.length > 0 && (
            <ComicPanel className="bg-card">
              <div className="ds-label mb-2 text-primary/80">Συλλεγμένα στοιχεία</div>
              <div className="flex flex-wrap gap-2">
                {solvedAnswers.map((a, i) => (
                  <span key={i} className="ds-value rounded-sm border border-primary/25 bg-primary/[0.08] px-2.5 py-1 text-sm text-primary">
                    {a.code}
                  </span>
                ))}
              </div>
            </ComicPanel>
          )}

          <ComicPanel className="bg-card text-center">
            <Timer duration={60} running={true} frozen={state.stopActive} onComplete={handleTimerExpire} label="ΧΡΟΝΟΣ" size="lg" variant="cyan" />
            <div className="ds-label mt-4 mb-2 text-primary/80">Εισαγωγή κωδικού</div>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && codeInput.trim() && handleCodeSubmit()}
              className="ds-value mx-auto w-full max-w-xs rounded-sm border border-primary/20 bg-surface-1/80 px-4 py-3 text-center text-2xl tracking-[0.3em] text-foreground placeholder:text-foreground/20 focus:border-primary/50 focus:outline-none"
              placeholder="????"
              autoFocus
            />
            <div className="mt-4">
              <ComicButton variant="green" size="lg" onClick={handleCodeSubmit} disabled={!codeInput.trim()}>
                ✅ ΑΠΟΣΥΜΠΛΗΣΗ
              </ComicButton>
            </div>
          </ComicPanel>
        </div>
      </div>
    );
  }

  // ===== DEFUSED =====
  if (phase === 'defused') {
    return (
      <div className="min-h-screen comic-dots flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-4">
          <ComicPanel className="border-primary/30 bg-primary/[0.07] py-12 comic-pop">
            <div className="text-5xl opacity-75">🎉</div>
            <div className="ds-eyebrow mt-3 text-primary/80">Ολοκληρώθηκε</div>
            <h1 className="ds-title mt-2 text-4xl">Η βόμβα εξουδετερώθηκε</h1>
            <p className="ds-lede mt-2">Η {target.name} αποφεύγει τη σύλληψη.</p>
            <div className="ds-label mt-3 text-primary/70">+$2.000 Bounty</div>
          </ComicPanel>
          <ComicButton variant="green" size="lg" onClick={onExit}>
            ➡ ΣΥΝΕΧΕΙΑ ΠΑΙΧΝΙΔΙΟΥ
          </ComicButton>
        </div>
      </div>
    );
  }

  // ===== EXPLOSION =====
  if (phase === 'explosion') {
    return (
      <div className="min-h-screen comic-dots-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <ComicPanel className="border-destructive/45 bg-destructive/[0.16] py-10 text-center">
            <div className="text-5xl">💥</div>
            <div className="ds-eyebrow mt-3 text-destructive">Έκρηξη</div>
            <h1 className="ds-title mt-2 text-4xl">Η βόμβα έσκασε</h1>
            <p className="ds-lede mt-2 text-sm">Η {target.name} συλλαμβάνεται.</p>
          </ComicPanel>

          <ComicPanel className="bg-card">
            <div className="mb-3 border-b border-primary/10 pb-2 text-center">
              <span className="ds-eyebrow text-primary/85">Επιλογή Δεσίματος</span>
            </div>
            <div className="space-y-2">
              {BOMB_TYPING_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTypingSelect(t)}
                  className="flex w-full items-center gap-3 rounded-sm border border-primary/12 bg-surface-1/60 p-3 text-left transition-colors duration-300 ease-lux hover:border-primary/40 hover:bg-primary/[0.05]"
                >
                  <span className="text-2xl opacity-80">{t.icon}</span>
                  <div>
                    <div className="font-heading text-base text-foreground">{t.name}</div>
                    <div className="ds-label mt-1 text-foreground/45">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </ComicPanel>
        </div>
      </div>
    );
  }

  // ===== TIPTOE SUSPENSE =====
  if (phase === 'tiptoe') {
    return (
      <div className="min-h-screen comic-dots-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <ComicPanel className="bg-card py-6 text-center">
            <div className="text-4xl opacity-80">🩰</div>
            <h2 className="ds-title mt-3 text-2xl">{selectedTyping?.name}</h2>
            <p className="ds-lede mt-1 text-sm">{selectedTyping?.desc}</p>
          </ComicPanel>
          <ComicPanel className="bg-card">
            <TiptoeSuspense duration={30} frozen={state.stopActive} onComplete={handleTiptoeResult} />
            <div className="mt-4 text-center">
              <ComicButton variant="red" size="lg" onClick={async () => {
                const history = addHistory(state, { type: 'bomb_paso', paso: 'Tiptoe Suspense', success: false, player: target.name });
                const updatedPlayers = state.players.map((p) => {
                  if (p.id === target.id) {
                    const ladder = getPenaltyLadder(p.footwearLevel);
                    return { ...p, penaltyStep: ladder.length };
                  }
                  return p;
                });
                await updateState({ history, players: updatedPlayers });
                setPhase('restrained');
              }}>
                ❌ ΑΠΟΤΥΧΙΑ — ΣΥΛΛΗΨΗ
              </ComicButton>
            </div>
          </ComicPanel>
        </div>
      </div>
    );
  }

  // ===== PASO SELECT =====
  if (phase === 'paso_select') {
    return (
      <div className="min-h-screen comic-dots-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <ComicPanel className="bg-card py-6 text-center">
            <div className="text-4xl opacity-80">{selectedTyping?.icon}</div>
            <h2 className="ds-title mt-3 text-3xl">{selectedTyping?.name}</h2>
            <p className="ds-lede mt-1 text-sm">{selectedTyping?.desc}</p>
          </ComicPanel>

          <ComicPanel className="bg-card">
            <div className="mb-3 border-b border-primary/10 pb-2 text-center">
              <span className="ds-eyebrow text-primary/85">P.A.S.O. · Δοκιμασία Απόδοσης</span>
            </div>
            <p className="ds-lede mb-4 text-center text-sm">
              Η {target.name} πρέπει να διαλέξει μία ακραία δοκιμασία για την απελευθέρωσή της.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {BOMB_PASO_TRIALS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePasoSelect(p)}
                  className="rounded-sm border border-primary/12 bg-surface-1/60 p-4 text-left transition-colors duration-300 ease-lux hover:border-primary/40 hover:bg-primary/[0.05]"
                >
                  <div className="font-heading text-base text-foreground">{p.name}</div>
                  <div className="ds-lede mt-1 text-sm">{p.desc}</div>
                </button>
              ))}
            </div>
          </ComicPanel>
        </div>
      </div>
    );
  }

  // ===== PASO TRIAL =====
  if (phase === 'paso_trial') {
    return (
      <div className="min-h-screen comic-dots-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <ComicPanel className="bg-card py-5 text-center">
            <div className="ds-eyebrow text-primary/80">Δοκιμασία</div>
            <h2 className="ds-title mt-2 text-2xl">{selectedPaso?.name}</h2>
          </ComicPanel>

          <ComicPanel className="bg-card comic-pop">
            <div className="mb-4 rounded-sm border border-primary/12 bg-surface-1/70 p-5">
              <p className="font-body text-lg leading-relaxed text-foreground/90">{selectedPaso?.desc}</p>
            </div>
            <div className="mb-4 rounded-sm border border-primary/12 bg-surface-2/60 p-3">
              <div className="ds-label mb-1 text-primary/80">Κριτήριο επιτυχίας</div>
              <div className="font-body text-sm text-foreground/80">{selectedPaso?.success}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ComicButton variant="green" size="lg" onClick={() => handlePasoResult(true)}>
                ✅ ΕΠΙΤΥΧΙΑ
              </ComicButton>
              <ComicButton variant="red" size="lg" onClick={() => handlePasoResult(false)}>
                ❌ ΑΠΟΤΥΧΙΑ
              </ComicButton>
            </div>
          </ComicPanel>
        </div>
      </div>
    );
  }

  // ===== FREED =====
  if (phase === 'freed') {
    return (
      <div className="min-h-screen comic-dots flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-4">
          <ComicPanel className="border-primary/30 bg-primary/[0.07] py-12 comic-pop">
            <div className="text-5xl opacity-75">🔓</div>
            <div className="ds-eyebrow mt-3 text-primary/80">Ολοκληρώθηκε</div>
            <h1 className="ds-title mt-2 text-4xl">Απελευθερώθηκε</h1>
            <p className="ds-lede mt-2">{target.name} · η δοκιμασία P.A.S.O. πέρασε επιτυχώς.</p>
          </ComicPanel>
          <ComicButton variant="green" size="lg" onClick={onExit}>
            ➡ ΣΥΝΕΧΕΙΑ ΠΑΙΧΝΙΔΙΟΥ
          </ComicButton>
        </div>
      </div>
    );
  }

  // ===== RESTRAINED =====
  if (phase === 'restrained') {
    return (
      <div className="min-h-screen comic-dots-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-4">
          <ComicPanel className="border-destructive/40 bg-destructive/[0.12] py-12">
            <div className="text-5xl text-center">⛓️</div>
            <div className="ds-eyebrow mt-3 text-center text-destructive">Δεσμεύτηκε</div>
            <h1 className="ds-title mt-2 text-center text-4xl">Πλήρως δεσμευμένη</h1>
            <p className="ds-lede mt-2 text-center">{target.name} · η δοκιμασία απέτυχε, οδηγείται σε Ανάκριση.</p>
          </ComicPanel>
          <ComicButton variant="red" size="lg" onClick={onGoToStage2}>
            ⚡ ΠΡΟΣ ΑΝΑΚΡΙΣΗ
          </ComicButton>
        </div>
      </div>
    );
  }

  return null;
}