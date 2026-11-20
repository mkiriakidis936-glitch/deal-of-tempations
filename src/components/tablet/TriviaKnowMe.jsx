import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { addHistory, applyPenaltyStep } from '@/lib/gameLogic';

const SHOE_LABEL = { boots: 'Μπότες', sneakers: 'Αθλητικά', sandals: 'Σανδάλια', barefoot: 'Ξυπόλητη' };
const INTENSITY_LABEL = { soft: 'Soft', medium: 'Medium', hardcore: 'Hardcore' };

const FIELDS = [
  { key: 'shoeSize', q: 'Τι νούμερο παπούτσι φοράει;', fallback: ['36', '37', '38', '39', '40', '41'] },
  { key: 'nailColor', q: 'Τι χρώμα νυχιών διάλεξε;', fallback: ['Κόκκινο', 'Ροζ', 'Λευκό', 'Μαύρο', 'Nude', 'Γαλλικό'] },
  { key: 'musicPreferences', q: 'Τι μουσική προτιμά;', fallback: ['Pop', 'Rock', 'House', 'R&B'] },
  { key: 'accommodation', q: 'Πού θα μείνει;', map: (v) => (v === 'house' ? 'Σπίτι / Villa' : 'Μόνο μία μέρα'), fallback: ['Σπίτι / Villa', 'Μόνο μία μέρα'] },
  { key: 'shoeType', q: 'Τι παπούτσια φοράει;', map: (v) => SHOE_LABEL[v] || v, fallback: ['Μπότες', 'Αθλητικά', 'Σανδάλια', 'Ξυπόλητη'] },
  { key: 'intensity', q: 'Τι ένταση δήλωσε;', map: (v) => INTENSITY_LABEL[v] || v, fallback: ['Soft', 'Medium', 'Hardcore'] },
  { key: 'dressCode', q: 'Τι dress code προτιμά;', fallback: ['Elegant', 'Casual', 'Θεματικό'] },
  { key: 'allergies', q: 'Τι αλλεργίες δήλωσε;', fallback: ['Καμία', 'Ξηροί καρποί', 'Γαλακτοκομικά'] },
];

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function formatValue(field, value) {
  return field.map ? field.map(value) : String(value);
}

function buildRounds(intakes) {
  const rounds = [];
  intakes.forEach((intake) => {
    const usable = FIELDS.filter((f) => {
      const v = intake[f.key];
      return v !== undefined && v !== null && String(v).trim() !== '' && String(v).length < 40;
    });
    if (!usable.length) return;
    const field = usable[Math.floor(Math.random() * usable.length)];
    const correct = formatValue(field, intake[field.key]);
    const others = intakes
      .filter((i) => i.name !== intake.name && i[field.key] !== undefined && String(i[field.key]).trim() !== '')
      .map((i) => formatValue(field, i[field.key]));
    const pool = [...new Set([...others, ...(field.fallback || [])])].filter((v) => v !== correct);
    const options = shuffle([correct, ...shuffle(pool).slice(0, 3)]);
    rounds.push({ id: `${intake.id}-${field.key}`, target: intake.name, question: field.q, correct, options });
  });
  return shuffle(rounds);
}

export default function TriviaKnowMe({ state, updateState, onClose }) {
  const [rounds, setRounds] = useState(null);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [awarded, setAwarded] = useState([]);

  const players = (state.players || []).filter((p) => p.name);
  const playersRef = useRef(state.players || []);

  useEffect(() => {
    playersRef.current = state.players || [];
  }, [state.players]);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.PlayerIntake.filter({}, { sort: '-created_date', limit: 50 });
        setRounds(buildRounds(items || []));
      } catch (e) {
        console.error('Trivia load error', e);
        setRounds([]);
      }
    })();
  }, []);

  const round = rounds?.[idx];
  const isCorrect = chosen && round && chosen === round.correct;

  async function award(players_, correct) {
    const ids = players_.map((p) => p.id);
    const updatedPlayers = playersRef.current.map((p) => {
      if (!ids.includes(p.id)) return p;
      return correct
        ? { ...p, tokens: (p.tokens || 0) + 1 }
        : applyPenaltyStep(p);
    });
    playersRef.current = updatedPlayers;
    const history = addHistory({ ...state, players: updatedPlayers }, {
      type: 'trivia',
      detail: `${round.target}: «${round.question}» → ${round.correct} (${correct ? 'σωστά' : 'λάθος'}: ${players_.map((p) => p.name).join(', ')})`,
    });
    await updateState({ players: updatedPlayers, history });
  }

  function awardPlayer(player) {
    if (awarded.includes(player.id)) return;
    setAwarded((prev) => [...prev, player.id]);
    award([player], isCorrect);
  }

  function next() {
    setChosen(null);
    setAwarded([]);
    setIdx(idx + 1);
  }

  return (
    <div className="fixed inset-0 z-[70] bg-background/70 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-w-md w-full max-h-[88vh] overflow-y-auto space-y-3">
        <ComicPanel className="bg-tarot-royal text-center py-4">
          <div className="text-4xl mb-1">🧠</div>
          <div className="font-heading text-2xl comic-text-stroke text-tarot-gold">ΠΟΣΟ ΚΑΛΑ ΜΕ ΞΕΡΕΙΣ;</div>
          <div className="text-xs font-bold text-foreground/70 font-body">Ερωτήσεις από τα ερωτηματολόγια</div>
        </ComicPanel>

        {rounds === null && <ComicPanel className="bg-card text-center py-6 font-heading text-lg text-primary comic-pulse">ΦΟΡΤΩΣΗ...</ComicPanel>}

        {rounds && rounds.length === 0 && (
          <ComicPanel className="bg-card text-center py-6">
            <div className="text-3xl mb-2">📋</div>
            <div className="font-body text-foreground/70 text-sm">Δεν υπάρχουν ερωτηματολόγια. Συμπλήρωσε πρώτα τη φόρμα στο /welcome.</div>
          </ComicPanel>
        )}

        {rounds && round && (
          <>
            <ComicPanel className="bg-card">
              <div className="font-heading text-xs text-foreground/60 mb-1">ΕΡΩΤΗΣΗ {idx + 1} / {rounds.length}</div>
              <div className="font-heading text-xl text-primary mb-1">{round.target}</div>
              <div className="font-body text-lg text-foreground">{round.question}</div>
            </ComicPanel>

            <ComicPanel className="bg-card">
              <div className="font-heading text-sm mb-2">ΤΙ ΑΠΑΝΤΗΣΕ ΤΟ ΤΡΑΠΕΖΙ;</div>
              <div className="space-y-2">
                {round.options.map((opt) => {
                  const picked = chosen === opt;
                  const showTruth = chosen && opt === round.correct;
                  return (
                    <button
                      key={opt}
                      onClick={() => !chosen && setChosen(opt)}
                      disabled={!!chosen}
                      className={`comic-panel-sm w-full p-2 text-left font-bold text-foreground ${
                        showTruth ? 'bg-tarot-forest' : picked ? 'bg-destructive' : 'bg-secondary'
                      }`}
                    >
                      {opt}
                      {showTruth && ' ✓'}
                      {picked && !showTruth && ' ✗'}
                    </button>
                  );
                })}
              </div>
            </ComicPanel>

            {chosen && (
              <ComicPanel className={`${isCorrect ? 'bg-tarot-forest' : 'bg-destructive'} text-center py-3 comic-pop`}>
                <div className="font-heading text-2xl">{isCorrect ? '✅ ΣΩΣΤΟ!' : '❌ ΛΑΘΟΣ'}</div>
                {!isCorrect && <div className="text-sm font-bold font-body mt-1">Σωστή απάντηση: {round.correct}</div>}
                <div className="text-xs font-bold text-foreground/70 font-body mt-1">
                  {isCorrect ? 'Ποια το βρήκε; +1 🎟️' : 'Ποια έπεσε έξω; +1 ⚠️ ποινή'}
                </div>
              </ComicPanel>
            )}

            {chosen && (
              <div className="grid grid-cols-2 gap-2">
                {players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => awardPlayer(p)}
                    disabled={awarded.includes(p.id)}
                    className={`comic-panel-sm p-2 text-left ${awarded.includes(p.id) ? 'bg-tarot-wine opacity-70' : 'bg-secondary'}`}
                  >
                    <span className="font-bold text-sm text-foreground">{awarded.includes(p.id) ? '✓ ' : ''}{p.name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <ComicButton variant="magenta" size="md" onClick={next} disabled={!chosen || idx >= rounds.length - 1}>➡️ ΕΠΟΜΕΝΗ</ComicButton>
              <ComicButton variant="red" size="md" onClick={onClose}>✕ ΚΛΕΙΣΙΜΟ</ComicButton>
            </div>
            {chosen && idx >= rounds.length - 1 && (
              <div className="text-center font-heading text-sm text-primary">ΤΕΛΟΣ ΕΡΩΤΗΣΕΩΝ</div>
            )}
          </>
        )}

        {rounds && rounds.length === 0 && (
          <ComicButton variant="red" size="md" className="w-full" onClick={onClose}>✕ ΚΛΕΙΣΙΜΟ</ComicButton>
        )}
      </div>
    </div>
  );
}