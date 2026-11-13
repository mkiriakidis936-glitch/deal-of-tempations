import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import Timer from '@/components/comic/Timer';
import { CRYPT_RIDDLE_TEMPLATES } from '@/data/gameContent';
import { addHistory } from '@/lib/gameLogic';

const NAIL_LABELS = {
  red: 'κόκκινου', pink: 'ροζ', white: 'λευκού', black: 'μαύρου', nude: 'nude',
  french: 'γαλλικού', blue: 'γαλάζιου', purple: 'μωβ', green: 'πράσινου',
  orange: 'πορτοκαλί', gold: 'χρυσού', silver: 'ασημί', none: 'χωρίς',
};

function pickThreeDistinct(intakes) {
  const withColor = intakes.filter((i) => i.nailColor && i.nailColor !== 'none' && i.shoeSize);
  if (withColor.length < 3) return null;
  const shuffled = [...withColor].sort(() => Math.random() - 0.5);
  const picked = [];
  const usedColors = new Set();
  for (const p of shuffled) {
    if (!usedColors.has(p.nailColor)) {
      picked.push(p);
      usedColors.add(p.nailColor);
    }
    if (picked.length >= 3) break;
  }
  return picked.length >= 3 ? picked : null;
}

function buildRiddle(trio) {
  const template = CRYPT_RIDDLE_TEMPLATES[Math.floor(Math.random() * CRYPT_RIDDLE_TEMPLATES.length)];
  const [c1, c2, c3] = trio;
  return template
    .replace('{color1}', NAIL_LABELS[c1.nailColor] || c1.nailColor)
    .replace('{color2}', NAIL_LABELS[c2.nailColor] || c2.nailColor)
    .replace('{color3}', NAIL_LABELS[c3.nailColor] || c3.nailColor);
}

function buildCode(trio) {
  const d1 = trio[0].shoeSize % 10;
  const d2 = trio[1].shoeSize % 10;
  const d3 = trio[2].shoeSize % 10;
  const d4 = (d1 + d2 + d3) % 10;
  return `${d1}${d2}${d3}${d4}`;
}

export default function BarefootCrypt({ state, updateState, onClose }) {
  const [phase, setPhase] = useState('loading');
  const [riddle, setRiddle] = useState('');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [trio, setTrio] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { items } = await base44.entities.PlayerIntake.filter({}, { sort: '-created_date', limit: 50 });
        const trio = pickThreeDistinct(items || []);
        if (!trio) {
          setPhase('nodata');
          return;
        }
        const riddleText = buildRiddle(trio);
        const codeStr = buildCode(trio);
        setTrio(trio);
        setRiddle(riddleText);
        setCode(codeStr);
        setPhase('riddle');
        await updateState({ barefootCrypt: { active: true, riddle: riddleText } });
      } catch (e) {
        console.error('Crypt load error', e);
        setPhase('nodata');
      }
    }
    load();
  }, []);

  function handleSubmit() {
    if (input.trim() === code) {
      setPhase('success');
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  }

  async function handleSuccess() {
    const history = addHistory(state, { type: 'crypt_solved', detail: 'Ο Γρίφος της Κρύπτης λύθηκε!' });
    await updateState({ barefootCrypt: null, history });
    onClose();
  }

  async function handleFail() {
    const history = addHistory(state, { type: 'crypt_failed', detail: 'Ο Γρίφος της Κρύπτας απέτυχε — +1 ποινή σε όλες' });
    const players = (state.players || []).map((p) => ({ ...p, penaltyStep: Math.min((p.penaltyStep || 0) + 1, 7) }));
    await updateState({ barefootCrypt: null, players, history });
    onClose();
  }

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4">
        <div className="font-heading text-3xl text-foreground comic-pulse">ΦΟΡΤΩΣΗ ΓΡΙΦΟΥ...</div>
      </div>
    );
  }

  if (phase === 'nodata') {
    return (
      <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-3">
          <ComicPanel className="bg-card text-center py-6">
            <div className="text-4xl mb-2">📋</div>
            <div className="font-heading text-lg text-primary">Δεν υπάρχουν αρκετά ερωτηματολόγια</div>
            <div className="text-xs mt-2 text-foreground/60 font-body">
              Χρειάζονται τουλάχιστον 3 παίκτριες με διαφορετικό χρώμα νυχιών και νούμερο παπουτσιού στο /welcome.
            </div>
          </ComicPanel>
          <ComicButton variant="red" size="sm" onClick={onClose} className="w-full">✕ ΚΛΕΙΣΙΜΟ</ComicButton>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-3">
        <ComicPanel className="bg-background text-foreground text-center py-4 border-primary">
          <div className="font-heading text-3xl comic-text-stroke text-primary">🗝️ ΓΡΙΦΟΣ ΤΗΣ ΚΡΥΠΤΗΣ</div>
          <div className="text-sm font-bold text-primary font-body">Συνδυάστε τα φυσικά στοιχεία: χρώμα νυχιών + νούμερο παπουτσιού + QR σαγιονάρας</div>
        </ComicPanel>

        {phase === 'riddle' && (
          <>
            <ComicPanel className="bg-card comic-pop">
              <div className="text-xs font-bold uppercase text-foreground/60 mb-2 font-body">Αινιγματικός Γρίφος:</div>
              <p className="text-lg font-medium italic text-foreground font-body">{riddle}</p>
              <div className="text-xs mt-3 text-foreground/60 font-body">
                Ψηφίο = τελευταίος αριθμός του νούμερου παπουτσιού της κάτοχου του χρώματος. Το 4ο = άθροισμα των 3 (μόνο τελευταίο ψηφίο).
              </div>
            </ComicPanel>

            <ComicPanel className="bg-card">
              <Timer
                duration={120}
                running={true}
                frozen={state.stopActive}
                onComplete={() => setPhase('fail')}
                label="ΧΡΟΝΟΣ ΚΡΥΠΤΗΣ"
                size="lg"
                variant="red"
              />
            </ComicPanel>

            <ComicPanel className={`bg-card ${error ? 'comic-strobe' : ''}`}>
              <div className="font-heading text-lg mb-2 text-center text-primary">ΠΛΗΚΤΡΟΛΟΓΗΣΕ ΚΩΔΙΚΟ (4 ψηφία)</div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="????"
                className={`w-full text-center text-4xl font-heading tracking-widest border-4 border-border rounded-lg py-3 bg-background text-foreground focus:outline-none focus:ring-4 ring-primary ${error ? 'bg-destructive/60' : ''}`}
                autoFocus
              />
              <ComicButton variant="green" size="lg" onClick={handleSubmit} className="w-full mt-3" disabled={input.length < 4}>
                🔓 ΞΕΚΛΕΙΔΩΣΕ
              </ComicButton>
            </ComicPanel>

            <ComicButton variant="red" size="sm" onClick={() => setPhase('fail')} className="w-full">⏱ ΧΡΟΝΟΣ ΕΛΗΞΕ / ΑΠΟΤΥΧΙΑ</ComicButton>
          </>
        )}

        {phase === 'success' && (
          <ComicPanel className="bg-tarot-forest text-center py-8 comic-pop">
            <div className="text-7xl mb-3">🔓</div>
            <div className="font-heading text-4xl comic-text-stroke text-tarot-gold">ΚΡΥΠΤΑ ΞΕΚΛΕΙΔΩΘΗΚΕ!</div>
            <div className="text-sm mt-2 text-foreground font-body">Η παρέα έλυσε τον γρίφο!</div>
            <ComicButton variant="green" size="lg" onClick={handleSuccess} className="w-full mt-4">✅ ΣΥΝΕΧΕΙΑ</ComicButton>
          </ComicPanel>
        )}

        {phase === 'fail' && (
          <ComicPanel className="bg-destructive text-foreground text-center py-8 comic-pop">
            <div className="text-7xl mb-3">💥</div>
            <div className="font-heading text-4xl comic-text-stroke text-tarot-gold">Η ΚΡΥΠΤΑ ΑΠΟΚΛΕΙΣΤΗΚΕ</div>
            <div className="text-sm mt-2 text-foreground/80 font-body">Ο χρόνος έληξε — +1 ποινή σε όλες τις παίκτριες</div>
            <ComicButton variant="red" size="lg" onClick={handleFail} className="w-full mt-4">⚠️ ΕΦΑΡΜΟΓΗ ΠΟΙΝΗΣ</ComicButton>
          </ComicPanel>
        )}
      </div>
    </div>
  );
}