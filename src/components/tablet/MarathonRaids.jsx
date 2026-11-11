import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import Timer from '@/components/comic/Timer';
import { MARATHON_GROUP_PENALTIES } from '@/data/gameContent';
import { addHistory } from '@/lib/gameLogic';
import SpeakButton from '@/components/comic/VoiceReader';

export default function MarathonRaids({ state, updateState, onAdvance }) {
  const [phase, setPhase] = useState('intro');
  const [picked, setPicked] = useState([]);

  const penaltyIndex = state.penaltyIndex || 0;
  const currentPenalty = MARATHON_GROUP_PENALTIES[penaltyIndex];
  const pickedPlayers = state.players.filter((p) => picked.includes(p.id));

  function toggle(id) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev));
  }

  async function handleResult(success) {
    const update = {
      history: addHistory(state, { type: success ? 'group_penalty_survived' : 'group_penalty_failed', penalty: currentPenalty?.name, players: pickedPlayers.map((p) => p.name).join(', ') }),
    };
    if (!success) {
      update.players = state.players.map((p) => (picked.includes(p.id) ? { ...p, penaltyStep: (p.penaltyStep || 0) + 1 } : p));
      ['alpha', 'beta'].forEach((team) => {
        const n = pickedPlayers.filter((p) => p.team === team).length;
        const key = team === 'alpha' ? 'teamAlpha' : 'teamBeta';
        if (n) update[key] = { ...state[key], stars: (state[key]?.stars || 0) + n };
      });
    }
    setPicked([]);
    if (penaltyIndex + 1 >= MARATHON_GROUP_PENALTIES.length) {
      await updateState(update);
      onAdvance();
      return;
    }
    await updateState({ ...update, penaltyIndex: penaltyIndex + 1 });
    setPhase('intro');
  }

  if (!currentPenalty) {
    return (
      <ComicPanel className="bg-card text-center py-8">
        <div className="font-heading text-2xl">Όλες οι ποινές ολοκληρώθηκαν!</div>
        <ComicButton variant="yellow" size="lg" onClick={onAdvance}>➡ ΣΤΑΔΙΟ 4</ComicButton>
      </ComicPanel>
    );
  }

  return (
    <div className="min-h-screen comic-dots p-3 pb-24">
      <div className="max-w-3xl mx-auto space-y-3">
        <ComicPanel className="bg-destructive text-foreground text-center py-4">
          <div className="font-heading text-2xl">🚨 ΣΤΑΔΙΟ 3: POLICE RAIDS</div>
          <div className="text-sm">3 Ομαδικές Ποινές (2-3 παίκτριες ταυτόχρονα) · Αποτυχία = +1⭐ ανά παίκτρια</div>
          <SpeakButton text="Στάδιο 3: Police Raids. 3 ομαδικές ποινές. 2 με 3 παίκτριες ταυτόχρονα. Αποτυχία: συν 1 Wanted Star ανά παίκτρια." label="🔊 AI VOICE" />
        </ComicPanel>

        <div className="grid grid-cols-2 gap-3">
          <ComicPanel className="bg-tarot-wine/30 p-3 text-center">
            <div className="font-heading text-lg">💖 ALPHA</div>
            <div className="text-sm">${state.teamAlpha?.loot || 0} · ⭐{state.teamAlpha?.stars || 0}</div>
          </ComicPanel>
          <ComicPanel className="bg-secondary p-3 text-center">
            <div className="font-heading text-lg">💎 BETA</div>
            <div className="text-sm">${state.teamBeta?.loot || 0} · ⭐{state.teamBeta?.stars || 0}</div>
          </ComicPanel>
        </div>

        <ComicPanel className="bg-primary text-center py-2">
          <div className="font-heading text-xl">ΟΜΑΔΙΚΗ ΠΟΙΝΗ {penaltyIndex + 1}/3</div>
        </ComicPanel>

        {phase === 'intro' && (
          <ComicPanel className="bg-card comic-pop">
            <div className="text-center mb-4">
              <div className="font-heading text-2xl">⛓️ {currentPenalty.name}</div>
              <div className="comic-panel-sm p-4 bg-destructive/20 mt-3">
                <p className="text-lg">{currentPenalty.desc}</p>
              </div>
            </div>
            <div className="font-bold text-sm mb-2 text-center">Διάλεξε 2-3 παίκτριες:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {state.players.map((p) => (
                <button key={p.id} onClick={() => toggle(p.id)} className={`comic-panel-sm p-2 ${picked.includes(p.id) ? 'bg-primary ring-2 ring-primary' : 'bg-card'}`}>
                  <div className="font-bold">{p.name}</div>
                  <div className="text-xs">{p.team === 'alpha' ? '💖 Alpha' : '💎 Beta'} · Ποινή {p.penaltyStep || 0}</div>
                </button>
              ))}
            </div>
            <div className="text-center">
              <ComicButton variant="red" size="lg" disabled={picked.length < 2} onClick={() => setPhase('active')}>▶ ΕΚΤΕΛΕΣΗ ΠΟΙΝΗΣ</ComicButton>
            </div>
          </ComicPanel>
        )}

        {phase === 'active' && (
          <ComicPanel className="bg-destructive text-foreground text-center comic-pulse">
            <div className="font-heading text-3xl mb-1">⏱ ΕΚΤΕΛΕΣΗ</div>
            <div className="text-sm mb-3">{pickedPlayers.map((p) => p.name).join(' · ')}</div>
            <Timer duration={currentPenalty.duration || 60} running={true} frozen={state.stopActive} onComplete={() => setPhase('judge')} label="ΟΜΑΔΙΚΗ ΠΟΙΝΗ" size="lg" />
            <div className="mt-4">
              <ComicButton variant="yellow" size="lg" onClick={() => setPhase('judge')}>⏹ ΤΕΛΟΣ</ComicButton>
            </div>
          </ComicPanel>
        )}

        {phase === 'judge' && (
          <ComicPanel className="bg-card text-center py-6">
            <div className="font-heading text-2xl mb-4">Άντεξαν μέχρι τέλους;</div>
            <div className="grid grid-cols-2 gap-3">
              <ComicButton variant="green" size="lg" onClick={() => handleResult(true)}>✅ ΑΝΤΕΞΑΝ</ComicButton>
              <ComicButton variant="red" size="lg" onClick={() => handleResult(false)}>❌ ΑΠΕΤΥΧΑΝ (+⭐)</ComicButton>
            </div>
          </ComicPanel>
        )}

        <ComicPanel className="bg-card">
          <div className="font-heading text-sm mb-2">ΠΡΟΟΔΟΣ ΠΟΙΝΩΝ:</div>
          <div className="flex gap-1">
            {MARATHON_GROUP_PENALTIES.map((p, i) => (
              <div key={p.id} className={`flex-1 h-8 rounded border-2 border-border text-center text-xs font-bold flex items-center justify-center ${i < penaltyIndex ? 'bg-destructive' : i === penaltyIndex ? 'bg-primary comic-pulse' : 'bg-card'}`}>
                {i + 1}
              </div>
            ))}
          </div>
          <div className="text-xs mt-2 text-center text-foreground/60">Όλες οι ποινές → Στάδιο 4 (Total Lockdown)</div>
        </ComicPanel>
      </div>
    </div>
  );
}