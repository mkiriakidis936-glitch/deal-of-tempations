import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { MARATHON_TRIALS } from '@/data/gameContent';
import { addHistory } from '@/lib/gameLogic';
import VaultTrialChallenge from '@/components/tablet/VaultTrialChallenge';
import SpeakButton from '@/components/comic/VoiceReader';
import { canAssignVipActivity, isVipActivityAllowed } from '@/lib/playerIntelligence';

export default function MarathonVault({ state, updateState, onAdvance, playerProfiles = [], playerProfilesReady = true }) {
  const [phase, setPhase] = useState('intro');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [result, setResult] = useState(null);
  const vipCtx = { playerProfiles, playerProfilesReady };

  const trialIndex = state.trialIndex || 0;
  const currentTrial = MARATHON_TRIALS[trialIndex];
  const currentTeam = trialIndex % 2 === 0 ? 'alpha' : 'beta';
  const teamKey = currentTeam === 'alpha' ? 'teamAlpha' : 'teamBeta';
  const teamPlayers = state.players.filter((p) => p.team === currentTeam);
  const eligibleTeamPlayers = teamPlayers.filter((p) => isVipActivityAllowed(vipCtx, p, currentTrial?.id === 'MT-03' ? 'questions' : null));
  const teamLoot = state[teamKey]?.loot || 0;
  const teamStars = state[teamKey]?.stars || 0;
  const selectedPlayer = state.players.find((p) => p.id === selectedPlayerId);

  async function skipTrial() {
    const history = addHistory(state, { type: 'trial_skipped', trial: currentTrial?.name, team: currentTeam, reason: 'No eligible VIP participant' });
    if (trialIndex + 1 >= MARATHON_TRIALS.length) {
      await updateState({ history });
      onAdvance();
      return;
    }
    await updateState({ history, trialIndex: trialIndex + 1 });
    setSelectedPlayerId(null);
    setPhase('intro');
  }

  async function handleTrialResult(success) {
    const lootGain = success ? 10000 : 0;
    const starGain = success ? 0 : 1;
    const teamUpdate = {
      [teamKey]: {
        ...state[teamKey],
        loot: teamLoot + lootGain,
        stars: teamStars + starGain,
      },
    };
    if (!success) {
      teamUpdate.players = state.players.map((p) => (p.id === selectedPlayerId ? { ...p, penaltyStep: (p.penaltyStep || 0) + 1 } : p));
    }
    const history = addHistory(state, {
      type: success ? 'trial_success' : 'trial_fail',
      trial: currentTrial?.name,
      team: currentTeam,
      player: selectedPlayer?.name,
    });

    if (trialIndex + 1 >= MARATHON_TRIALS.length) {
      await updateState({ ...teamUpdate, history });
      onAdvance();
      return;
    }
    await updateState({ ...teamUpdate, history, trialIndex: trialIndex + 1 });
    setSelectedPlayerId(null);
    setPhase('intro');
  }

  if (!currentTrial) {
    return (
      <ComicPanel className="bg-card text-center py-8">
        <div className="font-heading text-2xl">Όλες οι δοκιμασίες ολοκληρώθηκαν!</div>
        <ComicButton variant="yellow" size="lg" onClick={onAdvance}>➡ ΣΤΑΔΙΟ 3</ComicButton>
      </ComicPanel>
    );
  }

  return (
    <div className="min-h-screen comic-dots p-3 pb-24">
      <div className="max-w-3xl mx-auto space-y-3">
        <ComicPanel className="bg-tarot-royal text-foreground text-center py-4">
          <div className="font-heading text-2xl">🏦 ΣΤΑΔΙΟ 2: THE VAULT</div>
          <div className="text-sm">5 Ατομικές Δοκιμασίες Ξυπόλυτων · Διπλάσιο Loot ($10.000)</div>
          <SpeakButton text="Στάδιο 2: The Vault. 5 ατομικές δοκιμασίες ξυπόλυτων. Διπλάσιο Loot, 10 χιλιάδες ανά επιτυχία." label="🔊 AI VOICE" />
        </ComicPanel>

        <div className="grid grid-cols-2 gap-3">
          <ComicPanel className={`p-3 ${currentTeam === 'alpha' ? 'bg-tarot-wine/60 ring-2 ring-primary' : 'bg-tarot-wine/30'}`}>
            <div className="font-heading text-lg">💖 TEAM ALPHA</div>
            <div className="text-sm">${state.teamAlpha?.loot || 0} · ⭐{state.teamAlpha?.stars || 0}</div>
          </ComicPanel>
          <ComicPanel className={`p-3 ${currentTeam === 'beta' ? 'bg-tarot-teal ring-2 ring-primary' : 'bg-secondary'}`}>
            <div className="font-heading text-lg">💎 TEAM BETA</div>
            <div className="text-sm">${state.teamBeta?.loot || 0} · ⭐{state.teamBeta?.stars || 0}</div>
          </ComicPanel>
        </div>

        <ComicPanel className="bg-primary text-center py-2">
          <div className="font-heading text-xl">ΔΟΚΙΜΑΣΙΑ {trialIndex + 1}/5 — Team {currentTeam === 'alpha' ? 'Alpha' : 'Beta'}</div>
        </ComicPanel>

        {phase === 'intro' && (
          <ComicPanel className="bg-card">
            <div className="text-center mb-4">
              <div className="font-heading text-2xl">🦶 {currentTrial.name}</div>
              <p className="text-sm mt-2">{currentTrial.desc}</p>
            </div>
            <div className="font-bold text-sm mb-2 text-center">Διάλεξε παίκτρια από Team {currentTeam === 'alpha' ? 'Alpha' : 'Beta'}:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {eligibleTeamPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { if (canAssignVipActivity(vipCtx, p, { activityType: currentTrial.id === 'MT-03' ? 'questions' : null, activityLabel: currentTrial.id === 'MT-03' ? 'Speed Trivia' : 'ατομική δοκιμασία Vault' })) setSelectedPlayerId(p.id); }}
                  disabled={!isVipActivityAllowed(vipCtx, p, currentTrial.id === 'MT-03' ? 'questions' : null)}
                  className={`comic-panel-sm p-2 ${selectedPlayerId === p.id ? 'bg-primary ring-2 ring-primary' : 'bg-card'}`}
                >
                  <div className="font-bold">{p.name}</div>
                  <div className="text-xs">Ποινή: {p.penaltyStep || 0}</div>
                </button>
              ))}
            </div>
            {playerProfilesReady && eligibleTeamPlayers.length === 0 && (
              <div className="text-center rounded border border-amber-500/30 p-3 space-y-2">
                <div className="text-sm">Δεν υπάρχει διαθέσιμη συμμετοχή σε αυτή την ομάδα. Η δοκιμασία παραλείπεται χωρίς ποινή.</div>
                <ComicButton variant="white" size="md" onClick={skipTrial}>ΠΑΡΑΛΕΙΨΗ ΔΟΚΙΜΑΣΙΑΣ</ComicButton>
              </div>
            )}
            {!playerProfilesReady && <div className="text-center text-sm opacity-70">Φόρτωση ιδιωτικών προτιμήσεων…</div>}
            <div className="text-center mt-4">
              <ComicButton
                variant="green"
                size="lg"
                onClick={() => setPhase('trial')}
                disabled={!selectedPlayerId || !playerProfilesReady || eligibleTeamPlayers.length === 0}
              >
                ▶ ΕΚΤΕΛΕΣΗ ΔΟΚΙΜΑΣΙΑΣ
              </ComicButton>
            </div>
          </ComicPanel>
        )}

        {phase === 'trial' && selectedPlayer && (
          <ComicPanel className="bg-card comic-pop">
            <div className="text-center mb-3">
              <div className="font-heading text-2xl">🦶 {currentTrial.name}</div>
              <div className="text-sm font-bold">{selectedPlayer.name} — Team {currentTeam === 'alpha' ? 'Alpha' : 'Beta'}</div>
            </div>
            <div className="comic-panel-sm p-3 bg-secondary mb-4">
              <p className="text-sm">{currentTrial.desc}</p>
            </div>
            <VaultTrialChallenge trial={currentTrial} state={state} onResult={(ok) => { setResult(ok); setPhase('result'); }} />
          </ComicPanel>
        )}

        {phase === 'result' && (
          <ComicPanel className={`text-center py-6 comic-pop ${result ? 'bg-tarot-forest' : 'bg-destructive'}`}>
            <div className="font-heading text-3xl">{result ? '✅ ΕΠΙΤΥΧΙΑ! +$10.000' : '❌ ΑΠΟΤΥΧΙΑ! +1⭐ + Δέσιμο'}</div>
            <div className="text-sm mb-4">{selectedPlayer?.name}</div>
            <ComicButton variant="yellow" size="lg" onClick={() => handleTrialResult(result)}>➡ ΣΥΝΕΧΕΙΑ</ComicButton>
          </ComicPanel>
        )}

        <ComicPanel className="bg-card">
          <div className="font-heading text-sm mb-2">ΠΡΟΟΔΟΣ ΔΟΚΙΜΑΣΙΩΝ:</div>
          <div className="flex gap-1">
            {MARATHON_TRIALS.map((t, i) => (
              <div
                key={t.id}
                className={`flex-1 h-8 rounded border-2 border-border text-center text-xs font-bold flex items-center justify-center ${
                  i < trialIndex ? 'bg-tarot-forest' : i === trialIndex ? 'bg-primary comic-pulse' : 'bg-card'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="text-xs mt-2 text-center text-foreground/60">Όλες οι δοκιμασίες → Στάδιο 3 (Police Raids)</div>
        </ComicPanel>
      </div>
    </div>
  );
}