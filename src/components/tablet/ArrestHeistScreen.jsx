import React, { useState, useEffect } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import Timer from '@/components/comic/Timer';
import WheelOfMisfortune from '@/components/comic/WheelOfMisfortune';
import SpeakButton from '@/components/comic/VoiceReader';
import { base44 } from '@/api/base44Client';
import { ARREST_HEIST_LADDER, BOARD } from '@/data/gameConfig';
import MonopolyBoard from '@/components/tv/MonopolyBoard';
import { ARREST_HEIST_DARES, ARREST_HEIST_TRUTHS, MINI_GAMES, PLOT_TWISTS, ULTIMATE_TRUTHS } from '@/data/gameContent';
import { addHistory, drawHeistCard } from '@/lib/gameLogic';
import { buildSecretTruths } from '@/lib/intakeContent';
import GmTools from '@/components/tablet/GmTools';
import TemptationSlots from '@/components/tablet/TemptationSlots';

export default function ArrestHeistScreen({ state, updateState, onEnd }) {
  const [phase, setPhase] = useState('round_intro');
  const [heistPhase, setHeistPhase] = useState('qr');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [showMiniGames, setShowMiniGames] = useState(false);
  const [selectedMiniGame, setSelectedMiniGame] = useState(null);
  const [showPlotTwist, setShowPlotTwist] = useState(null);
  const [showWheel, setShowWheel] = useState(false);
  const [showGmTools, setShowGmTools] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const [codeRevealed, setCodeRevealed] = useState(false);
  const [tickleImmunity, setTickleImmunity] = useState(false);
  const [redeemTruth, setRedeemTruth] = useState(null);
  const [intake, setIntake] = useState(null);

  const REDEMPTION_COST = 3;

  async function loadIntake() {
    if (!state.sessionCode) return;
    const { items } = await base44.entities.BacheloretteIntake.filter({ sessionCode: state.sessionCode }, { sort: '-created_date', limit: 1 });
    setIntake(items?.[0] || null);
  }

  useEffect(() => { loadIntake(); }, [state.sessionCode]);

  // === STAGE 1 VARS ===
  const currentTeam = state.currentTeam || 'A';
  const teamKey = currentTeam === 'A' ? 'teamA' : 'teamB';
  const oppTeamKey = currentTeam === 'A' ? 'teamB' : 'teamA';
  const allPlayers = state.players || [];
  const teamPlayers = allPlayers.filter((p) => p.team === currentTeam);
  const leader = teamPlayers.find((p) => p.isLeader) || teamPlayers[0];
  const oppTeam = currentTeam === 'A' ? 'B' : 'A';
  const oppPlayers = allPlayers.filter((p) => p.team === oppTeam);
  const oppLeader = oppPlayers.find((p) => p.isLeader) || oppPlayers[0];
  const penaltyStep = leader?.penaltyStep || 0;
  const dare = ARREST_HEIST_DARES[penaltyStep] || ARREST_HEIST_DARES[ARREST_HEIST_DARES.length - 1];
  const truth = ARREST_HEIST_TRUTHS[penaltyStep] || ARREST_HEIST_TRUTHS[ARREST_HEIST_TRUTHS.length - 1];
  const leaderA = allPlayers.find((p) => p.team === 'A' && p.isLeader);
  const leaderB = allPlayers.find((p) => p.team === 'B' && p.isLeader);
  const pointsA = state.teamA?.points || 0;
  const pointsB = state.teamB?.points || 0;
  const maxSteps = intake?.intensity === 'soft' ? 4 : intake?.intensity === 'medium' ? 5 : 6;
  const secretTruths = buildSecretTruths(intake);
  const truthText = secretTruths.length ? secretTruths[((state.round || 1) - 1) % secretTruths.length] : truth.text;

  // === STAGE 2 VARS ===
  const vaultCode = state.grandHeist?.code || '0000';
  const firstTeam = pointsA > pointsB ? 'A' : pointsB > pointsA ? 'B' : (leaderA?.penaltyStep || 0) <= (leaderB?.penaltyStep || 0) ? 'A' : 'B';

  // === STAGE 3 VARS ===
  const winner = state.grandHeist?.winner || 'A';
  const winnerName = winner === 'A' ? 'Team Alpha' : 'Team Beta';
  const loserLeader = winner === 'A' ? leaderB : leaderA;

  // === HANDLERS ===
  function handleChoose(choice) {
    setPhase(choice === 'dare' ? 'dare' : 'truth');
  }

  async function handleDareResult(success) {
    if (success) {
      const history = addHistory(state, { type: 'dare_success', player: leader?.name, team: currentTeam });
      await updateState({ history });
      setPhase('dare_truth');
    } else {
      await applyPenalty(leader, { type: 'dare_fail', player: leader?.name, team: currentTeam });
    }
  }

  async function handleDareTruthResult(answered) {
    if (answered) {
      const history = addHistory(state, { type: 'truth_answered', player: oppLeader?.name, team: oppTeam });
      await updateState({ history, [oppTeamKey]: { ...state[oppTeamKey], points: (state[oppTeamKey]?.points || 0) + 1 } });
      setPhase('round_result');
    } else {
      await applyPenalty(oppLeader, { type: 'truth_refused', player: oppLeader?.name, team: oppTeam });
    }
  }

  async function handleTruthResult(answered) {
    if (answered) {
      const history = addHistory(state, { type: 'truth_answered', player: leader?.name, team: currentTeam });
      await updateState({ history, [teamKey]: { ...state[teamKey], points: (state[teamKey]?.points || 0) + 1 } });
      setPhase('round_result');
    } else {
      await applyPenalty(leader, { type: 'truth_refused', player: leader?.name, team: currentTeam });
    }
  }

  async function applyPenalty(target, failEvent = null) {
    const newStep = Math.min((target?.penaltyStep || 0) + 1, maxSteps);
    const updatedPlayers = allPlayers.map((p) => (p.id === target?.id ? { ...p, penaltyStep: newStep } : p));
    let history = state.history;
    if (failEvent) {
      history = addHistory(state, failEvent);
    }
    history = addHistory({ ...state, history }, { type: 'penalty', player: target?.name, step: newStep, team: target?.team });
    await updateState({ players: updatedPlayers, history });
    setPhase('penalty');
  }

  async function handleNextRound() {
    const nextRound = state.round + 1;
    const nextTeam = currentTeam === 'A' ? 'B' : 'A';
    if (nextRound > 6 || (leaderA?.penaltyStep >= maxSteps) || (leaderB?.penaltyStep >= maxSteps)) {
      const code = String(Math.floor(1000 + Math.random() * 9000));
      await updateState({ stage: 2, grandHeist: { code, phase: 'qr' } });
      return;
    }
    await updateState({ round: nextRound, currentTeam: nextTeam });
    setPhase('round_intro');
  }

  // === REDEMPTION: Buy down 1 step on the Arrest Ladder ===
  async function handleRedeemPoints() {
    const teamPoints = state[teamKey]?.points || 0;
    if (teamPoints < REDEMPTION_COST) return;
    const newStep = Math.max((leader?.penaltyStep || 0) - 1, 0);
    const updatedPlayers = allPlayers.map((p) => (p.id === leader?.id ? { ...p, penaltyStep: newStep } : p));
    const history = addHistory(state, { type: 'redeem_points', player: leader?.name, team: currentTeam, cost: REDEMPTION_COST });
    await updateState({
      players: updatedPlayers,
      history,
      [teamKey]: { ...state[teamKey], points: teamPoints - REDEMPTION_COST },
    });
    setPhase('round_result');
  }

  async function handleRedeemTruthResult(answered) {
    if (answered) {
      const newStep = Math.max((leader?.penaltyStep || 0) - 1, 0);
      const updatedPlayers = allPlayers.map((p) => (p.id === leader?.id ? { ...p, penaltyStep: newStep } : p));
      const history = addHistory(state, { type: 'redeem_truth', player: leader?.name, team: currentTeam });
      await updateState({ players: updatedPlayers, history });
    }
    setRedeemTruth(null);
    setPhase('round_result');
  }

  async function handleHeistSubmit() {
    if (codeInput.trim() === vaultCode) {
      const history = addHistory(state, { type: 'vault_unlocked', team: firstTeam });
      await updateState({ history, stage: 3, grandHeist: { ...state.grandHeist, winner: firstTeam } });
    } else {
      setCodeError(true);
    }
  }

  async function handleHeistTimeout() {
    const win = firstTeam === 'A' ? 'B' : 'A';
    const history = addHistory(state, { type: 'vault_timeout', winner: win });
    await updateState({ history, stage: 3, grandHeist: { ...state.grandHeist, winner: win } });
  }

  // ===== STAGE 1: MAIN GAME =====
  if (state.stage === 1) {
    return (
      <div className="min-h-screen comic-dots p-3 pb-24">
        <div className="max-w-4xl mx-auto space-y-3">
          <ComicPanel className="bg-destructive text-foreground flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="font-heading text-2xl">🚨 ARREST &amp; HEIST — ΓΥΡΟΣ {state.round}/6</div>
            <div className="flex gap-2">
              <ComicButton variant="dark" size="sm" onClick={() => setShowMiniGames(true)}>🎮 MINI-GAMES</ComicButton>
              <ComicButton variant="dark" size="sm" onClick={() => setShowWheel(true)}>🎡 WHEEL</ComicButton>
              <ComicButton variant="dark" size="sm" onClick={() => { const pt = PLOT_TWISTS[Math.floor(Math.random() * PLOT_TWISTS.length)]; setShowPlotTwist(pt); updateState({ activePlotTwist: pt }); }}>🎭 PLOT TWIST</ComicButton>
              <ComicButton variant="dark" size="sm" onClick={() => setShowGmTools(true)}>🧪 GM TOOLS</ComicButton>
              <ComicButton variant="purple" size="sm" onClick={() => setShowSlots(true)}>🎰 SLOTS</ComicButton>
            </div>
          </ComicPanel>

          <div className="grid grid-cols-2 gap-3">
            <ComicPanel className={`p-3 ${currentTeam === 'A' ? 'bg-tarot-wine/60 ring-2 ring-primary' : 'bg-tarot-wine/30'}`}>
              <div className="font-heading text-lg">💖 TEAM ALPHA</div>
              <div className="text-sm">Αρχηγός: {leaderA?.name || '—'}</div>
              <div className="text-sm">Ποινή: {leaderA?.penaltyStep || 0}/{maxSteps} · Πόντοι: {pointsA}</div>
            </ComicPanel>
            <ComicPanel className={`p-3 ${currentTeam === 'B' ? 'bg-tarot-teal ring-2 ring-primary' : 'bg-tarot-teal/30'}`}>
              <div className="font-heading text-lg">💎 TEAM BETA</div>
              <div className="text-sm">Αρχηγός: {leaderB?.name || '—'}</div>
              <div className="text-sm">Ποινή: {leaderB?.penaltyStep || 0}/{maxSteps} · Πόντοι: {pointsB}</div>
            </ComicPanel>
          </div>

          <HeistBoardPanel state={state} updateState={updateState} />

          {intake ? (
            <ComicPanel className="bg-tarot-wine/30 p-2 text-sm">
              <div className="font-heading text-sm">⭐ ΑΡΧΗΓΟΣ ALPHA: {intake.leaderName}</div>
              <div className="text-xs">ΑΡΧΗΓΟΣ BETA: {intake.opponentName || '—'} · Safe Word: {intake.safeWordConfirmed ? '✓' : '✗'} · Ένταση: {intake.intensity} · 🤫 {secretTruths.length} μυστικά{intake.musicPreferences ? ` · 🎤 ${intake.musicPreferences}` : ''}</div>
            </ComicPanel>
          ) : (
            <ComicPanel className="bg-tarot-wine/30 p-2 text-sm flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs">📝 Δεν υπάρχει φόρμα intake για τον κωδικό <b>{state.sessionCode}</b>. Άνοιξε: <b>{window.location.origin}/intake?code={state.sessionCode}</b></div>
              <ComicButton variant="white" size="sm" onClick={loadIntake}>🔄 ΕΛΕΓΧΟΣ</ComicButton>
            </ComicPanel>
          )}

          {phase === 'round_intro' && (
            <ComicPanel className="bg-primary text-center py-8">
              <div className="font-heading text-3xl">ΓΥΡΟΣ {state.round}</div>
              <div className="text-lg mb-4">Σειρά: Team {currentTeam} — {leader?.name}</div>
              <div className="mb-4">
                <SpeakButton text={`Γύρος ${state.round}. Σειρά: Team ${currentTeam}, ${leader?.name}. Επιλέξτε Θάρρος ή Αλήθεια.`} label="🔊 AI VOICE" />
              </div>
              <ComicButton variant="yellow" size="lg" onClick={() => setPhase('choose')}>▶ ΕΠΙΛΟΓΗ</ComicButton>
            </ComicPanel>
          )}

          {phase === 'choose' && (
            <ComicPanel className="bg-card text-center py-6">
              <div className="font-heading text-2xl mb-2">{leader?.name} — Team {currentTeam}</div>
              <div className="text-sm mb-4">Επίπεδο Ποινής: {penaltyStep}/{maxSteps} — Διάλεξε:</div>
              <div className="grid grid-cols-2 gap-3">
                <ComicButton variant="magenta" size="lg" onClick={() => handleChoose('dare')}>🔥 ΘΑΡΡΟΣ</ComicButton>
                <ComicButton variant="cyan" size="lg" onClick={() => handleChoose('truth')}>💬 ΑΛΗΘΕΙΑ</ComicButton>
              </div>
            </ComicPanel>
          )}

          {phase === 'dare' && (
            <ComicPanel className="bg-card comic-pop">
              <div className="text-center mb-3">
                <div className="font-heading text-2xl">🔥 ΘΑΡΡΟΣ — Στάδιο {dare.step}</div>
                <div className="text-sm font-bold">{dare.name}</div>
              </div>
              <div className="comic-panel-sm p-4 bg-tarot-wine/30 mb-4">
                <p className="text-lg">{dare.text}</p>
              </div>
              <div className="text-center mb-3">
                <SpeakButton text={dare.text} label="🔊 ΕΚΦΩΝΗΣΗ" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ComicButton variant="green" size="lg" onClick={() => handleDareResult(true)}>✅ ΕΠΙΤΥΧΙΑ</ComicButton>
                <ComicButton variant="red" size="lg" onClick={() => handleDareResult(false)}>❌ ΑΠΟΤΥΧΙΑ</ComicButton>
              </div>
              <div className="text-xs text-center mt-2 text-foreground/60">Επιτυχία → Αλήθεια για αντίπαλο · Αποτυχία → +1 ποινή + 30″ γαργάλημα</div>
            </ComicPanel>
          )}

          {phase === 'dare_truth' && (
            <ComicPanel className="bg-card comic-pop">
              <div className="text-center mb-3">
                <div className="font-heading text-2xl">💬 ΑΛΗΘΕΙΑ ΓΙΑ {oppLeader?.name}</div>
                <div className="text-sm font-bold">Team {oppTeam} — Στάδιο {truth.step}</div>
              </div>
              <div className="comic-panel-sm p-4 bg-tarot-teal/30 mb-4">
                <p className="text-lg">{truthText}</p>
              </div>
              <div className="text-center mb-3">
                <SpeakButton text={truthText} label="🔊 ΕΚΦΩΝΗΣΗ" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ComicButton variant="green" size="lg" onClick={() => handleDareTruthResult(true)}>✅ ΑΠΑΝΤΗΣΕ</ComicButton>
                <ComicButton variant="red" size="lg" onClick={() => handleDareTruthResult(false)}>❌ ΑΡΝΗΣΗ</ComicButton>
              </div>
              <div className="text-xs text-center mt-2 text-foreground/60">Απάντηση → +1 πόντος · Άρνηση → +1 ποινή + 30″ γαργάλημα</div>
            </ComicPanel>
          )}

          {phase === 'truth' && (
            <ComicPanel className="bg-card comic-pop">
              <div className="text-center mb-3">
                <div className="font-heading text-2xl">💬 ΑΛΗΘΕΙΑ — Στάδιο {truth.step}</div>
                <div className="text-sm font-bold">{truth.name}</div>
              </div>
              <div className="comic-panel-sm p-4 bg-tarot-teal/30 mb-4">
                <p className="text-lg">{truthText}</p>
              </div>
              <div className="text-center mb-3">
                <SpeakButton text={truthText} label="🔊 ΕΚΦΩΝΗΣΗ" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ComicButton variant="green" size="lg" onClick={() => handleTruthResult(true)}>✅ ΑΠΑΝΤΗΣΕ</ComicButton>
                <ComicButton variant="red" size="lg" onClick={() => handleTruthResult(false)}>❌ ΑΡΝΗΣΗ</ComicButton>
              </div>
              <div className="text-xs text-center mt-2 text-foreground/60">Απάντηση → +1 πόντος · Άρνηση → +1 ποινή + 30″ γαργάλημα</div>
            </ComicPanel>
          )}

          {phase === 'penalty' && penaltyStep > 0 && (
            <ComicPanel className="bg-destructive/30 comic-pop">
              <div className="text-center mb-3">
                <div className="font-heading text-2xl">⚠️ ΠΟΙΝΗ — Στάδιο {penaltyStep}/{maxSteps}</div>
                <div className="text-4xl">{ARREST_HEIST_LADDER[penaltyStep - 1]?.icon}</div>
                <div className="font-heading text-lg">{ARREST_HEIST_LADDER[penaltyStep - 1]?.label}</div>
              </div>
              <div className="comic-panel-sm p-3 bg-destructive/20 mb-4 text-center">
                <p>{ARREST_HEIST_LADDER[penaltyStep - 1]?.detail}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ComicButton variant="red" size="lg" onClick={() => setPhase('tickle')}>⏱ 30″ ΓΑΡΓΑΛΗΜΑ</ComicButton>
                <ComicButton variant="green" size="lg" onClick={() => setPhase('redeem_choose')}>💰 ΕΚΤΟΝΩΣΗ (-1)</ComicButton>
              </div>
              <div className="text-xs text-center mt-2 text-foreground/60">Εκτόνωση: θυσίασε {REDEMPTION_COST} πόντους ή απάντησε Σκληρή Αλήθεια για -1 βήμα</div>
            </ComicPanel>
          )}

          {phase === 'redeem_choose' && (
            <ComicPanel className="bg-tarot-forest/30 comic-pop">
              <div className="text-center mb-3">
                <div className="font-heading text-2xl">💰 ΕΚΤΟΝΩΣΗ ΑΠΟ ΣΚΑΛΑ</div>
                <div className="text-sm">Αρχηγός: {leader?.name} — Τρέχον Βήμα: {penaltyStep}/{maxSteps}</div>
                <div className="text-xs mt-1 text-foreground/60">Θυσίασε για να πέσεις 1 βήμα στη Σκάλα Σύλληψης</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ComicButton variant="green" size="lg" onClick={handleRedeemPoints} disabled={(state[teamKey]?.points || 0) < REDEMPTION_COST}>
                  💰 {REDEMPTION_COST} ΠΟΝΤΟΙ
                </ComicButton>
                <ComicButton variant="magenta" size="lg" onClick={() => { setRedeemTruth(ULTIMATE_TRUTHS[Math.floor(Math.random() * ULTIMATE_TRUTHS.length)]); setPhase('redeem_truth'); }}>
                  💬 ΣΚΛΗΡΗ ΑΛΗΘΕΙΑ
                </ComicButton>
              </div>
              <div className="text-xs text-center mt-2 text-foreground/60">
                Πόντοι ομάδας: {state[teamKey]?.points || 0}{(state[teamKey]?.points || 0) < REDEMPTION_COST ? ' — Δεν επαρκούν πόντοι!' : ''}
              </div>
              <div className="text-center mt-2">
                <ComicButton variant="white" size="sm" onClick={() => setPhase('penalty')}>← ΠΙΣΩ</ComicButton>
              </div>
            </ComicPanel>
          )}

          {phase === 'redeem_truth' && redeemTruth && (
            <ComicPanel className="bg-card comic-pop">
              <div className="text-center mb-3">
                <div className="font-heading text-2xl">💬 ΣΚΛΗΡΗ ΑΛΗΘΕΙΑ — ΕΚΤΟΝΩΣΗ</div>
                <div className="text-sm font-bold">{redeemTruth.name}</div>
              </div>
              <div className="comic-panel-sm p-4 bg-destructive/20 mb-4">
                <p className="text-lg">{redeemTruth.text}</p>
              </div>
              <div className="text-center mb-3">
                <SpeakButton text={redeemTruth.text} label="🔊 ΕΚΦΩΝΗΣΗ" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ComicButton variant="green" size="lg" onClick={() => handleRedeemTruthResult(true)}>✅ ΑΠΑΝΤΗΣΕ (-1 ΒΗΜΑ)</ComicButton>
                <ComicButton variant="red" size="lg" onClick={() => handleRedeemTruthResult(false)}>❌ ΑΡΝΗΣΗ</ComicButton>
              </div>
              <div className="text-xs text-center mt-2 text-foreground/60">Απάντηση → -1 βήμα στη σκάλα · Άρνηση → καμία αλλαγή</div>
            </ComicPanel>
          )}

          {phase === 'tickle' && (
            <ComicPanel className="bg-destructive text-foreground text-center comic-pulse">
              <div className="font-heading text-3xl mb-4">⏱ 30″ ΓΑΡΓΑΛΗΜΑ</div>
              <Timer duration={30} running={true} frozen={state.stopActive} onComplete={() => setPhase('round_result')} label="ΓΑΡΓΑΛΗΜΑ" size="lg" />
              {intake?.musicPreferences && <div className="text-sm mt-3">🎤 Κατά τη διάρκεια: καραόκε σε {intake.musicPreferences} — αν σταματήσει να τραγουδά, +10″</div>}
              <div className="mt-4">
                <ComicButton variant="green" size="lg" onClick={() => setPhase('round_result')}>✅ ΣΥΝΕΧΕΙΑ</ComicButton>
              </div>
            </ComicPanel>
          )}

          {phase === 'round_result' && (
            <ComicPanel className="bg-card text-center py-6">
              <div className="font-heading text-2xl mb-4">ΟΛΟΚΛΗΡΩΘΗΚΕ ΓΥΡΟΣ {state.round}</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="comic-panel-sm p-2 bg-tarot-wine/30">Alpha: {pointsA} πόντοι</div>
                <div className="comic-panel-sm p-2 bg-tarot-teal/30">Beta: {pointsB} πόντοι</div>
              </div>
              {penaltyStep > 0 && (
                <div className="mb-3">
                  <ComicButton variant="green" size="sm" onClick={() => setPhase('redeem_choose')}>💰 ΕΚΤΟΝΩΣΗ (-1 ΒΗΜΑ)</ComicButton>
                </div>
              )}
              <ComicButton variant="yellow" size="lg" onClick={handleNextRound}>➡ ΕΠΟΜΕΝΟΣ ΓΥΡΟΣ</ComicButton>
              {((leaderA?.penaltyStep >= maxSteps) || (leaderB?.penaltyStep >= maxSteps)) && (
                <div className="text-xs mt-2 text-destructive font-bold comic-pulse">⚠️ ΟΜΑΔΑ ΣΤΟ MAX LOCKDOWN → GRAND HEIST ΞΕΚΙΝΑΕΙ!</div>
              )}
            </ComicPanel>
          )}

          <ComicPanel className="bg-card">
            <div className="font-heading text-lg mb-2">🪢 Σκάλα Ποινών — Team {currentTeam} ({leader?.name})</div>
            <div className="space-y-1">
              {ARREST_HEIST_LADDER.slice(0, maxSteps).map((s, i) => (
                <div key={s.step} className={`flex items-center gap-2 p-1.5 rounded border-2 border-border ${i < penaltyStep ? 'bg-destructive/60' : i === penaltyStep ? 'bg-primary comic-pulse' : 'bg-card'}`}>
                  <span className="text-lg">{s.icon}</span>
                  <span className="font-bold text-sm">{s.step}. {s.label}</span>
                </div>
              ))}
            </div>
          </ComicPanel>

          {showMiniGames && (
            <div className="fixed inset-0 z-50 bg-background/50 flex items-center justify-center p-4" onClick={() => { setShowMiniGames(false); setSelectedMiniGame(null); }}>
              <ComicPanel className="bg-card max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {selectedMiniGame ? (
                  <div>
                    <div className="text-center mb-3">
                      <div className="text-4xl">{selectedMiniGame.icon}</div>
                      <div className="font-heading text-2xl">{selectedMiniGame.name}</div>
                    </div>
                    <div className="comic-panel-sm p-3 bg-secondary mb-3">
                      <div className="font-bold text-sm mb-1">ΣΤΗΣΙΜΟ:</div>
                      <p className="text-sm">{selectedMiniGame.setup}</p>
                    </div>
                    <div className="comic-panel-sm p-3 bg-tarot-wine/30 mb-4">
                      <div className="font-bold text-sm mb-1">ΔΡΑΣΗ:</div>
                      <p className="text-sm">{selectedMiniGame.action}</p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <ComicButton variant="green" size="sm" onClick={() => { setShowMiniGames(false); setSelectedMiniGame(null); updateState({ activeMiniGame: null }); }}>✅ ΟΛΟΚΛΗΡΩΘΗΚΕ</ComicButton>
                      <ComicButton variant="yellow" size="sm" onClick={() => setSelectedMiniGame(null)}>← ΠΙΣΩ</ComicButton>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-heading text-xl mb-3 text-center">🎮 MINI-GAMES (11)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {MINI_GAMES.map((g) => (
                        <button key={g.id} onClick={() => { setSelectedMiniGame(g); updateState({ activeMiniGame: g, miniGameVolunteers: null, miniGameVotes: null, miniGameRatings: null }); }} className="comic-panel-sm p-2 text-left bg-secondary hover:bg-secondary">
                          <div className="font-bold text-sm">{g.icon} {g.name}</div>
                        </button>
                      ))}
                    </div>
                    <div className="text-center mt-3">
                      <ComicButton variant="dark" size="sm" onClick={() => setShowMiniGames(false)}>ΚΛΕΙΣΙΜΟ</ComicButton>
                    </div>
                  </div>
                )}
              </ComicPanel>
            </div>
          )}

          {showPlotTwist && (
            <div className="fixed inset-0 z-50 bg-background/50 flex items-center justify-center p-4" onClick={() => setShowPlotTwist(null)}>
              <ComicPanel className="bg-tarot-royal text-foreground max-w-lg w-full text-center" onClick={(e) => e.stopPropagation()}>
                <div className="text-5xl mb-2">🎭</div>
                <div className="font-heading text-2xl mb-2">Ανατροπή</div>
                <div className="font-heading text-lg mb-2">{showPlotTwist.name}</div>
                <div className="text-sm bg-card/20 p-2 rounded mb-3">Trigger: {showPlotTwist.trigger}</div>
                <p className="text-sm mb-4">{showPlotTwist.desc}</p>
                <ComicButton variant="yellow" size="sm" onClick={() => { setShowPlotTwist(null); updateState({ activePlotTwist: null }); }}>ΟΚ</ComicButton>
              </ComicPanel>
            </div>
          )}

          {showWheel && (
            <div className="fixed inset-0 z-50 bg-background/50 flex items-center justify-center p-4" onClick={() => setShowWheel(false)}>
              <div onClick={(e) => e.stopPropagation()} className="max-w-sm w-full">
                <WheelOfMisfortune onResult={(res) => updateState({ wheelResult: res })} />
                <div className="text-center mt-2">
                  <ComicButton variant="dark" size="sm" onClick={() => setShowWheel(false)}>ΚΛΕΙΣΙΜΟ</ComicButton>
                </div>
              </div>
            </div>
          )}

          {showGmTools && <GmTools state={state} onClose={() => setShowGmTools(false)} />}
          {showSlots && <TemptationSlots state={state} updateState={updateState} onClose={() => setShowSlots(false)} />}
        </div>
      </div>
    );
  }

  // ===== STAGE 2: GRAND HEIST =====
  if (state.stage === 2) {
    return (
      <div className="min-h-screen comic-dots-dark p-4 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-4">
          <ComicPanel className="bg-destructive text-foreground text-center py-6 comic-pulse">
            <div className="text-6xl mb-2">💰</div>
            <div className="font-heading text-4xl comic-text-stroke">Μεγάλη Απόδραση</div>
            <div className="text-sm mt-2">Πρώτη ομάδα: Team {firstTeam}</div>
          </ComicPanel>

          {heistPhase === 'qr' && (
            <ComicPanel className="bg-card text-center py-8">
              <div className="text-6xl mb-3">📱</div>
              <div className="font-heading text-xl mb-2">Φάση Α — QR Code Scan</div>
              {tickleImmunity ? (
                <>
                  <div className="text-sm mb-4 text-tarot-forest font-bold">🛡️ IMMUNITY: Η πατούσα έχει ασυλία — το γαργάλημα σταμάτησε. Σκανάρετε άνετα!</div>
                  <div className="comic-panel-sm p-4 bg-card mb-4 inline-block">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VAULT-${vaultCode}`} alt="QR Code" className="w-48 h-48" />
                    <div className="text-xs text-center mt-1 font-bold">Σκάναρε με κινητό</div>
                  </div>
                  <div>
                    <ComicButton variant="green" size="lg" onClick={() => setHeistPhase('code')}>📸 ΣΚΑΝΑΡΙΣΤΗΚΕ</ComicButton>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm mb-2 text-foreground/70">Η αντίπαλη ομάδα γαργαλάει την πατούσα! Μέγιστο 30″ γαργαλήματος πριν το σκανάρισμα.</div>
                  <div className="comic-panel-sm p-4 bg-destructive/20 mb-4 inline-block">
                    <Timer duration={30} running={true} frozen={state.stopActive} onComplete={() => setTickleImmunity(true)} label="ΓΑΡΓΑΛΗΜΑ → IMMUNITY" size="md" variant="red" />
                  </div>
                  <div className="text-xs mb-3 text-foreground/60">Όταν πατήσετε ΣΚΑΝΑΡΙΣΤΗΚΕ, η πατούσα παίρνει αυτόματη ασυλία.</div>
                  <div>
                    <ComicButton variant="green" size="lg" onClick={() => { setTickleImmunity(true); setHeistPhase('code'); }}>📸 ΣΚΑΝΑΡΙΣΤΗΚΕ → IMMUNITY</ComicButton>
                  </div>
                </>
              )}
            </ComicPanel>
          )}

          {heistPhase === 'code' && (
            <ComicPanel className="bg-card text-center">
              <div className="font-heading text-xl mb-2">Φάση Β — Ψηφιακός Κωδικός (180″)</div>
              <Timer duration={180} running={true} frozen={state.stopActive} onComplete={handleHeistTimeout} label="ΑΝΤΙΣΤΡΟΦΗ ΜΕΤΡΗΣΗ" size="lg" variant="cyan" />
              <div className="mt-4 mb-3">
                {codeRevealed ? (
                  <div className="comic-panel-sm p-2 bg-background text-primary inline-block">
                    <div className="text-xs">GM Κωδικός:</div>
                    <div className="font-heading text-2xl tracking-widest">{vaultCode}</div>
                    <div className="mt-1">
                      <ComicButton variant="dark" size="sm" onClick={() => setCodeRevealed(false)}>🙈 ΚΡΥΨΙΜΟ</ComicButton>
                    </div>
                  </div>
                ) : (
                  <ComicButton variant="dark" size="sm" onClick={() => setCodeRevealed(true)}>👁 ΠΡΟΒΟΛΗ ΚΩΔΙΚΟΥ GM</ComicButton>
                )}
              </div>
              <div className="mb-2 font-heading text-lg">ΕΙΣΑΓΕΓΕ ΚΩΔΙΚΟ:</div>
              <input
                type="text"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value); setCodeError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && codeInput.trim() && handleHeistSubmit()}
                className="comic-panel-sm w-full max-w-xs mx-auto px-4 py-3 text-2xl font-heading text-center bg-secondary tracking-widest"
                placeholder="????"
                autoFocus
              />
              {codeError && <div className="text-destructive font-bold mt-2">❌ Λάθος κωδικός!</div>}
              <div className="mt-4">
                <ComicButton variant="green" size="lg" onClick={handleHeistSubmit} disabled={!codeInput.trim()}>🔓 ΞΕΚΛΕΙΔΩΜΑ</ComicButton>
              </div>
            </ComicPanel>
          )}
        </div>
      </div>
    );
  }

  // ===== STAGE 3: VICTORY =====
  if (state.stage === 3) {
    return (
      <div className="min-h-screen comic-dots p-4 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-4 text-center">
          <ComicPanel className="bg-tarot-forest py-8 comic-pop">
            <div className="text-7xl mb-2">🎉</div>
            <div className="font-heading text-5xl comic-text-stroke">Νίκη</div>
            <div className="font-heading text-3xl mt-2">{winnerName}</div>
            {intake && <div className="text-sm font-bold mt-1">⭐ {intake.leaderName} {intake.opponentName ? `vs ${intake.opponentName}` : ''}</div>}
            <div className="text-lg mt-4 comic-panel-sm p-3 bg-card inline-block">
              🎁 ΜΕΓΑΛΟ ΔΩΡΟ: 1 Συνεδρία Spa + 1 Φιάλη Σαμπάνιας
            </div>
          </ComicPanel>

          <ComicPanel className="bg-destructive text-foreground py-6">
            <div className="font-heading text-2xl mb-2">😈 ΤΕΛΙΚΗ ΠΟΙΝΗ</div>
            <div className="text-sm mb-3">Η ηττημένη αρχηγός ({loserLeader?.name || '—'}) παραμένει σε Full Hogtie.</div>
            <div className="font-heading text-xl mb-3">60″ Ultimate Tickle Gauntlet</div>
            <Timer duration={60} running={true} frozen={state.stopActive} onComplete={() => {}} label="TICKLE GAUNTLET" size="lg" />
          </ComicPanel>

          <ComicButton variant="magenta" size="lg" onClick={onEnd}>🔄 ΝΕΟ ΠΑΙΧΝΙΔΙ</ComicButton>
        </div>
      </div>
    );
  }

  return null;
}

function HeistBoardPanel({ state, updateState }) {
  const positions = state.heistPositions || {};
  const activeCard = state.heistBoardCard || null;
  const players = (state.players || []).map((p) => ({ ...p, position: positions[p.id] || 0 }));
  const currentIndex = (state.currentPlayerIndex || 0) % Math.max(1, players.length);
  const current = players[currentIndex];

  async function roll() {
    if (!current || state.stopActive || activeCard) return;
    const dice = 1 + Math.floor(Math.random() * 6);
    const next = Math.min(43, (positions[current.id] || 0) + dice);
    const square = BOARD[next];
    let card = null;
    if (square.type === 'street') {
      const kind = Math.random() < 0.5 ? 'street_truth' : 'street_dare';
      const drawn = drawHeistCard(kind);
      card = drawn ? { kind, name: drawn.name, text: drawn.text } : null;
    } else if (square.type === 'warrant') {
      const drawn = drawHeistCard('warrant');
      card = drawn ? { kind: 'warrant', name: drawn.name, text: drawn.desc } : null;
    } else if (square.type === 'glitch') {
      const drawn = drawHeistCard('glitch');
      card = drawn ? { kind: 'glitch', name: drawn.name, text: drawn.desc } : null;
    } else {
      const details = {
        police: ['POLICE HQ', 'Ενεργοποιείται η διαδικασία Absolute Interrogation.'],
        safehouse: ['SAFEHOUSE', 'Ασυλία μέχρι τον επόμενο γύρο.'],
        blackmarket: ['BLACK MARKET', 'Immunity Pass · Perk Recharge · Bribe.'],
      };
      const entry = details[square.type];
      if (entry) card = { kind: square.type, name: entry[0], text: entry[1] };
    }
    await updateState({
      heistPositions: { ...positions, [current.id]: next },
      currentPlayerIndex: (currentIndex + 1) % players.length,
      heistLastRoll: { playerId: current.id, dice, position: next },
      heistBoardCard: card,
    });
  }

  return (
    <ComicPanel className="bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="font-heading text-lg">🗺️ HEIST &amp; ARREST — 44 BASES</div>
        <ComicButton variant="yellow" size="sm" onClick={roll} disabled={!!state.stopActive || !!activeCard || !players.length}>🎲 ΡΙΞΕ ΖΑΡΙ</ComicButton>
      </div>
      <MonopolyBoard players={players} board={BOARD} />
      {state.heistLastRoll && <div className="text-xs text-foreground/70">{players.find((p) => p.id === state.heistLastRoll.playerId)?.name} · 🎲 {state.heistLastRoll.dice} · Base {String(state.heistLastRoll.position + 1).padStart(2,'0')}</div>}
      {activeCard && (
        <div className="rounded-lg border border-primary/50 bg-background/70 p-3 space-y-2">
          <div className="font-heading text-xl">{activeCard.name}</div>
          <p className="text-sm">{activeCard.text}</p>
          <ComicButton variant="green" size="sm" onClick={() => updateState({ heistBoardCard: null })}>ΟΛΟΚΛΗΡΩΘΗΚΕ</ComicButton>
        </div>
      )}
    </ComicPanel>
  );
}

