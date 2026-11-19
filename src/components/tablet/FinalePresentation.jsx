import React, { useState, useMemo } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import SpeakButton from '@/components/comic/VoiceReader';
import { calculateMostWanted } from '@/lib/gameLogic';

export default function FinalePresentation({ state, updateState, onEnd }) {
  const finale = state.finalePresentation || {};
  const [phase, setPhase] = useState(finale.phase || 'intro');
  const [recapIndex, setRecapIndex] = useState(0);
  const [awardIndex, setAwardIndex] = useState(0);

  const players = state.players || [];
  const history = state.history || [];

  // Calculate awards from game data
  const awards = useMemo(() => {
    const mostWanted = calculateMostWanted(players);
    const result = [];

    if (mostWanted) {
      result.push({
        title: '👑 Most Wanted',
        winner: mostWanted.name,
        icon: '👑',
        description: `${mostWanted.penaltyStep || 0} ποινές — Η πιο καταζητούμενη της βραδιάς`,
      });
    }

    // Most innocent (fewest penalties)
    const sorted = [...players].sort((a, b) => (a.penaltyStep || 0) - (b.penaltyStep || 0));
    if (sorted[0]) {
      result.push({
        title: '😇 Αθώα Πνεύμα',
        winner: sorted[0].name,
        icon: '😇',
        description: `${sorted[0].penaltyStep || 0} ποινές — Η πιο αθώα της βραδιάς`,
      });
    }

    // Most loot
    const richest = [...players].sort((a, b) => (b.loot || 0) - (a.loot || 0))[0];
    if (richest && (richest.loot || 0) > 0) {
      result.push({
        title: '💰 Big Spender',
        winner: richest.name,
        icon: '💰',
        description: `$${richest.loot || 0} — Η πιο πλούσια παίκτρια`,
      });
    }

    // Most betrayed (from mobile votes)
    const betrayalCounts = {};
    Object.values(state.mobileVotes || {}).forEach((tid) => { betrayalCounts[tid] = (betrayalCounts[tid] || 0) + 1; });
    const mostBetrayedId = Object.entries(betrayalCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (mostBetrayedId) {
      const p = players.find((pl) => pl.id === mostBetrayedId);
      if (p) {
        result.push({
          title: '🗡️ Μεγαλύτερη Προδοσία',
          winner: p.name,
          icon: '🗡️',
          description: `${betrayalCounts[mostBetrayedId]} ψήφοι θυσίας — Η πιο προδομένη`,
        });
      }
    }

    // Most dramatic (most history events)
    const eventCounts = {};
    history.forEach((e) => { if (e.player) eventCounts[e.player] = (eventCounts[e.player] || 0) + 1; });
    const mostActive = Object.entries(eventCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (mostActive) {
      result.push({
        title: '🎭 Πιο Δραματική Στιγμή',
        winner: mostActive,
        icon: '🎭',
        description: `${eventCounts[mostActive]} γεγονότα — Η πιο ενεργή παίκτρια`,
      });
    }

    return result;
  }, [players, state.mobileVotes, history]);

  // Key moments from history (filter significant events)
  const keyMoments = useMemo(() => {
    const significant = history.filter((e) =>
      ['bomb_defused', 'bomb_exploded', 'trial_verdict', 'breaking_news', 'finale_complete',
       'shoe_roulette', 'penalty_slots', 'last_wish', 'blind_oracle', 'crypt_solved',
       'midnight_pact', 'grand_jury_verdict', 'release', 'vault_unlocked'].includes(e.type)
    );
    return significant.slice(0, 10).reverse(); // Most recent 10, reversed for chronological
  }, [history]);

  async function startPresentation() {
    const newFinale = { active: true, phase: 'recap', awards, timestamp: Date.now() };
    setPhase('recap');
    setRecapIndex(0);
    await updateState({ finalePresentation: newFinale });
  }

  async function nextRecap() {
    if (recapIndex + 1 >= keyMoments.length) {
      setPhase('awards');
      setAwardIndex(0);
      await updateState({ finalePresentation: { ...finale, phase: 'awards', awardIndex: 0 } });
    } else {
      setRecapIndex(recapIndex + 1);
    }
  }

  async function nextAward() {
    if (awardIndex + 1 >= awards.length) {
      setPhase('stats');
      await updateState({ finalePresentation: { ...finale, phase: 'stats' } });
    } else {
      setAwardIndex(awardIndex + 1);
      await updateState({ finalePresentation: { ...finale, phase: 'awards', awardIndex: awardIndex + 1 } });
    }
  }

  async function finish() {
    setPhase('complete');
    await updateState({ finalePresentation: { ...finale, phase: 'complete' } });
  }

  async function reset() {
    setPhase('intro');
    setRecapIndex(0);
    setAwardIndex(0);
    await updateState({ finalePresentation: null });
  }

  // INTRO phase
  if (phase === 'intro') {
    return (
      <div className="min-h-screen comic-dots p-3 pb-24 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-3">
          <ComicPanel className="bg-tarot-crimson text-center py-6 comic-pop">
            <div className="text-6xl mb-2">🏆</div>
                       <div className="font-heading text-4xl comic-text-stroke text-tarot-gold">ΦΙΝΑΛΕ ΣΥΝΕΔΡΙΑΣ</div>
            <div className="text-sm font-bold text-foreground/80 font-body mt-2">Παρουσίαση αποτελεσμάτων & βραβείων</div>
          </ComicPanel>
          <ComicButton variant="yellow" size="lg" onClick={startPresentation} className="w-full">
            🎬 ΞΕΚΙΝΑ ΠΑΡΟΥΣΙΑΣΗ
          </ComicButton>
        </div>
      </div>
    );
  }

  // RECAP phase
  if (phase === 'recap') {
    if (keyMoments.length === 0) {
      return (
        <div className="min-h-screen comic-dots p-3 pb-24 flex items-center justify-center">
          <ComicPanel className="bg-card text-center py-8 max-w-lg">
            <div className="text-4xl mb-2">📜</div>
            <div className="font-heading text-2xl text-primary mb-2">Δεν καταγράφηκαν σημαντικές στιγμές</div>
            <ComicButton variant="yellow" size="lg" onClick={() => { setPhase('awards'); setAwardIndex(0); }} className="w-full mt-4">
              ⏭ ΠΡΟΣ ΒΡΑΒΕΙΑ
            </ComicButton>
          </ComicPanel>
        </div>
      );
    }
    const moment = keyMoments[recapIndex];
    return (
      <div className="min-h-screen comic-dots p-3 pb-24 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-3">
          <ComicPanel className="bg-tarot-royal text-center py-3">
            <div className="font-heading text-xl text-tarot-gold">📜 RECAP ΣΤΙΓΜΩΝ</div>
            <div className="text-xs text-foreground/60">{recapIndex + 1} / {keyMoments.length}</div>
          </ComicPanel>
          <ComicPanel className="bg-card comic-pop text-center py-8">
            <div className="text-5xl mb-3">{getEventIcon(moment.type)}</div>
            <div className="font-heading text-2xl text-primary mb-2">{getEventTitle(moment)}</div>
            <div className="text-sm text-foreground/70 font-body">{getEventDetail(moment)}</div>
            <div className="mt-4">
              <SpeakButton text={`${getEventTitle(moment)}. ${getEventDetail(moment)}`} label="🔊 ΕΚΦΩΝΗΣΗ" />
            </div>
          </ComicPanel>
          <div className="flex gap-2">
            <ComicButton variant="dark" size="lg" onClick={reset} className="flex-1">✕ ΕΞΟΔΟΣ</ComicButton>
            <ComicButton variant="yellow" size="lg" onClick={nextRecap} className="flex-1">
              {recapIndex + 1 >= keyMoments.length ? '⏭ ΒΡΑΒΕΙΑ' : '⏭ ΕΠΟΜΕΝΟ'}
            </ComicButton>
          </div>
        </div>
      </div>
    );
  }

  // AWARDS phase
  if (phase === 'awards') {
    if (awards.length === 0) {
      return (
        <div className="min-h-screen comic-dots p-3 pb-24 flex items-center justify-center">
          <ComicPanel className="bg-card text-center py-8 max-w-lg">
            <div className="text-4xl mb-2">🏅</div>
            <div className="font-heading text-2xl text-primary mb-2">Δεν υπάρχουν βραβεία</div>
            <ComicButton variant="yellow" size="lg" onClick={() => setPhase('stats')} className="w-full mt-4">
              ⏭ ΠΡΟΣ ΣΤΑΤΙΣΤΙΚΑ
            </ComicButton>
          </ComicPanel>
        </div>
      );
    }
    const award = awards[awardIndex];
    return (
      <div className="min-h-screen comic-dots p-3 pb-24 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-3">
          <ComicPanel className="bg-tarot-crimson text-center py-3">
            <div className="font-heading text-xl text-tarot-gold">🏅 ΤΕΛΕΤΗ ΒΡΑΒΕΩΝ</div>
            <div className="text-xs text-foreground/60">{awardIndex + 1} / {awards.length}</div>
          </ComicPanel>
          <ComicPanel className="bg-primary comic-pop text-center py-10">
            <div className="text-7xl mb-4 comic-pulse">{award.icon}</div>
            <div className="font-heading text-3xl text-tarot-dark comic-text-stroke mb-2">{award.title}</div>
            <div className="font-heading text-5xl text-tarot-dark mb-3">{award.winner}</div>
            <div className="text-sm text-tarot-dark/70 font-body">{award.description}</div>
            <div className="mt-4">
              <SpeakButton text={`Βραβείο: ${award.title}. Νικήτρια: ${award.winner}. ${award.description}`} label="🔊 ΕΚΦΩΝΗΣΗ" />
            </div>
          </ComicPanel>
          <div className="flex gap-2">
            <ComicButton variant="dark" size="lg" onClick={reset} className="flex-1">✕ ΕΞΟΔΟΣ</ComicButton>
            <ComicButton variant="yellow" size="lg" onClick={nextAward} className="flex-1">
              {awardIndex + 1 >= awards.length ? '⏭ ΣΤΑΤΙΣΤΙΚΑ' : '⏭ ΕΠΟΜΕΝΟ ΒΡΑΒΕΙΟ'}
            </ComicButton>
          </div>
        </div>
      </div>
    );
  }

  // STATS phase
  if (phase === 'stats') {
    const sorted = [...players].sort((a, b) => (b.penaltyStep || 0) - (a.penaltyStep || 0));
    return (
      <div className="min-h-screen comic-dots p-3 pb-24">
        <div className="max-w-3xl mx-auto space-y-3">
          <ComicPanel className="bg-tarot-forest text-center py-4">
            <div className="font-heading text-3xl comic-text-stroke text-tarot-gold">📊 ΣΥΝΟΨΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ</div>
          </ComicPanel>
          <ComicPanel className="bg-card">
            <div className="space-y-2">
              {sorted.map((p, i) => (
                <div key={p.id} className="comic-panel-sm p-3 bg-secondary flex items-center gap-3">
                  <div className="font-heading text-2xl text-primary w-8">{i + 1}.</div>
                  <div className="flex-1">
                    <div className="font-heading text-lg text-foreground">{p.name}</div>
                    <div className="text-xs text-foreground/60 font-body">
                      {p.penaltyStep || 0} ποινές · ${p.loot || 0} loot
                    </div>
                  </div>
                  <div className="text-2xl">{i === 0 ? '👑' : i === sorted.length - 1 ? '😇' : '🎭'}</div>
                </div>
              ))}
            </div>
          </ComicPanel>
          <ComicButton variant="green" size="lg" onClick={finish} className="w-full">
            ✅ ΟΛΟΚΛΗΡΩΣΗ ΠΑΡΟΥΣΙΑΣΗΣ
          </ComicButton>
        </div>
      </div>
    );
  }

  // COMPLETE phase
  return (
    <div className="min-h-screen comic-dots p-3 pb-24 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-3 text-center">
        <ComicPanel className="bg-tarot-forest comic-pop py-12">
          <div className="text-8xl mb-4">🥂</div>
          <div className="font-heading text-4xl comic-text-stroke text-tarot-gold mb-3">ΕΥΧΑΡΙΣΤΟΥΜΕ!</div>
          <div className="text-lg text-foreground font-body">Η βραδιά ολοκληρώθηκε.</div>
          <div className="text-sm text-foreground/60 font-body mt-2">Victory Shot για όλες! 🥃</div>
        </ComicPanel>
        <div className="flex gap-2">
          <ComicButton variant="dark" size="lg" onClick={reset} className="flex-1">🔄 ΕΠΑΝΑΛΗΨΗ</ComicButton>
          <ComicButton variant="green" size="lg" onClick={onEnd} className="flex-1">✅ ΤΕΛΟΣ ΣΥΝΕΔΡΙΑΣ</ComicButton>
        </div>
      </div>
    </div>
  );
}

function getEventIcon(type) {
  const map = { bomb_defused: '💣', bomb_exploded: '💥', trial_verdict: '⚖️', breaking_news: '📡',
    finale_complete: '🏆', shoe_roulette: '👟', penalty_slots: '🎰', last_wish: '🕯️',
    blind_oracle: '🔮', crypt_solved: '🗝️', midnight_pact: '🌙', grand_jury_verdict: '⚖️',
    release: '🔓', vault_unlocked: '🔓' };
  return map[type] || '🎭';
}

function getEventTitle(e) {
  const map = {
    bomb_defused: 'ΒΟΜΒΑ ΑΠΕΝΕΡΓΟΠΟΙΗΘΗΚΕ', bomb_exploded: 'ΒΟΜΒΑ ΕΚΡΗΓΝΥΓΗ', trial_verdict: 'ΔΙΚΗ',
    breaking_news: 'ΕΚΤΑΚΤΗ ΕΙΔΗΣΗ', finale_complete: 'ΦΙΝΑΛΕ', shoe_roulette: 'ΡΟΥΛΕΤΑ ΠΑΠΟΥΤΣΙΩΝ',
    penalty_slots: 'ΚΟΥΛΟΧΕΡΗΣ', last_wish: 'ΤΕΛΕΥΤΑΙΑ ΕΠΙΘΥΜΙΑ', blind_oracle: 'ΤΥΦΛΟ ΜΑΝΤΕΙΟ',
    crypt_solved: 'ΚΡΥΠΤΑ ΛΥΘΗΚΕ', midnight_pact: 'ΣΥΜΒΟΛΑΙΟ ΜΕΣΑΝΥΧΤΩΝ',
    grand_jury_verdict: 'GRAND JURY', release: 'ΑΠΕΛΕΥΘΕΡΩΣΗ', vault_unlocked: 'VAULT ΞΕΚΛΕΙΔΩΘΗΚΕ',
  };
  return map[e.type] || 'ΣΤΙΓΜΗ';
}

function getEventDetail(e) {
  if (e.player) return e.player;
  if (e.detail) return e.detail;
  return '';
}