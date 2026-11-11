import React, { useState, useEffect } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import Timer from '@/components/comic/Timer';
import { MARATHON_LOCKDOWN } from '@/data/gameContent';
import LockdownCommands from '@/components/tablet/LockdownCommands';
import SpeakButton from '@/components/comic/VoiceReader';

export default function MarathonLockdown({ state, updateState, onEnd }) {
  const [phase, setPhase] = useState('intro');

  const lootA = state.teamAlpha?.loot || 0;
  const lootB = state.teamBeta?.loot || 0;
  const starsA = state.teamAlpha?.stars || 0;
  const starsB = state.teamBeta?.stars || 0;

  const winner = lootA > lootB ? 'alpha' : lootB > lootA ? 'beta' : starsA < starsB ? 'alpha' : 'beta';
  const loser = winner === 'alpha' ? 'beta' : 'alpha';
  const winnerName = winner === 'alpha' ? '💖 TEAM ALPHA' : '💎 TEAM BETA';
  const loserName = loser === 'alpha' ? '💖 TEAM ALPHA' : '💎 TEAM BETA';
  const loserPlayers = state.players.filter((p) => p.team === loser);

  useEffect(() => {
    updateState({ marathonStage: 4, winner, gameOver: false });
  }, []);

  return (
    <div className="min-h-screen comic-dots p-3 pb-24">
      <div className="max-w-3xl mx-auto space-y-3">
        {phase === 'intro' && (
          <>
            <ComicPanel className="bg-background text-foreground text-center py-6 comic-pulse">
              <div className="text-6xl mb-2">🔒</div>
              <div className="font-heading text-4xl comic-text-stroke">Ολικός Αποκλεισμός</div>
              <div className="text-sm mt-2">Στάδιο 4 — Τελική Εκτέλεση</div>
              <SpeakButton text="Στάδιο 4: Total Lockdown. Η ηττημένη ομάδα ακινητοποιείται. 120 δευτερόλεπτα τελικής εκτέλεσης." label="🔊 AI VOICE" />
            </ComicPanel>

            <div className="grid grid-cols-2 gap-3">
              <ComicPanel className={`p-3 text-center ${winner === 'alpha' ? 'bg-tarot-forest ring-2 ring-primary' : 'bg-destructive/60'}`}>
                <div className="font-heading text-lg">💖 ALPHA</div>
                <div className="text-sm">${lootA} · ⭐{starsA}</div>
                <div className="text-xs font-bold mt-1">{winner === 'alpha' ? '🏆 ΝΙΚΗ' : '💀 ΗΤΤΑ'}</div>
              </ComicPanel>
              <ComicPanel className={`p-3 text-center ${winner === 'beta' ? 'bg-tarot-forest ring-2 ring-primary' : 'bg-destructive/60'}`}>
                <div className="font-heading text-lg">💎 BETA</div>
                <div className="text-sm">${lootB} · ⭐{starsB}</div>
                <div className="text-xs font-bold mt-1">{winner === 'beta' ? '🏆 ΝΙΚΗ' : '💀 ΗΤΤΑ'}</div>
              </ComicPanel>
            </div>

            <ComicPanel className="bg-destructive text-foreground">
              <div className="font-heading text-xl mb-2 text-center">😈 ΗΤΤΗΜΕΝΗ ΟΜΑΔΑ: {loserName}</div>
              <div className="text-sm text-center mb-3">Ακινητοποιείται στις παρακάτω θέσεις:</div>
              <div className="space-y-2">
                {MARATHON_LOCKDOWN.map((pos, i) => (
                  <div key={i} className="comic-panel-sm p-2 bg-card/20">
                    <div className="font-bold text-sm">{pos.role}: {pos.name}</div>
                    <div className="text-xs font-bold text-primary">👉 {(i === 0 ? loserPlayers.slice(0, 1) : i === 1 ? loserPlayers.slice(1, 3) : i === 2 ? loserPlayers.slice(3, 5) : loserPlayers).map((p) => p.name).join(', ') || '—'}</div>
                    <div className="text-xs">{pos.desc}</div>
                  </div>
                ))}
              </div>
            </ComicPanel>

            <div className="text-center">
              <ComicButton variant="red" size="lg" onClick={() => setPhase('execution')}>▶ ΕΝΑΡΞΗ ΤΕΛΙΚΗΣ ΕΚΤΕΛΕΣΗΣ (120″)</ComicButton>
            </div>
          </>
        )}

        {phase === 'execution' && (
          <ComicPanel className="bg-destructive text-foreground text-center comic-pulse">
            <div className="font-heading text-3xl mb-4">⏱ 120″ ΤΕΛΙΚΗ ΕΚΤΕΛΕΣΗ</div>
            <Timer duration={120} running={true} frozen={state.stopActive} onComplete={() => setPhase('victory')} label="LOCKDOWN" size="lg" />
            <div className="mt-4 text-sm">
              Ηττημένη ομάδα: {loserName} ({loserPlayers.map((p) => p.name).join(', ')})
            </div>
            <LockdownCommands players={loserPlayers} />
            <div className="mt-4">
              <ComicButton variant="green" size="lg" onClick={() => setPhase('victory')}>✅ ΛΗΞΗ</ComicButton>
            </div>
          </ComicPanel>
        )}

        {phase === 'victory' && (
          <ComicPanel className="bg-tarot-forest text-center py-8 comic-pop">
            <div className="text-7xl mb-2">🎉</div>
            <div className="font-heading text-5xl comic-text-stroke">Νίκη</div>
            <div className="font-heading text-3xl mt-2">{winnerName}</div>
            <div className="text-lg mt-4 comic-panel-sm p-3 bg-card inline-block">
              🏆 ΤΕΛΙΚΟ ΣΚΟΡ: ${winner === 'alpha' ? lootA : lootB} · ⭐{winner === 'alpha' ? starsA : starsB}
            </div>
            <div className="text-sm mt-4 text-foreground/70">
              Ηττημένη ομάδα ({loserName}) απελευθερώθηκε μετά την εκτέλεση.
            </div>
            <div className="mt-6">
              <ComicButton variant="magenta" size="lg" onClick={() => { updateState({ winner, gameOver: true }); onEnd(); }}>🔄 ΝΕΟ ΠΑΙΧΝΙΔΙ</ComicButton>
            </div>
          </ComicPanel>
        )}
      </div>
    </div>
  );
}