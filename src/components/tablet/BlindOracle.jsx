import React, { useState, useMemo } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import SpeakButton from '@/components/comic/VoiceReader';
import { ORACLE_DILEMMAS, ORACLE_FATE_LABELS } from '@/data/gameContent';
import { isFullyRestrained, addHistory } from '@/lib/gameLogic';

const LETTERS = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ'];

export default function BlindOracle({ state, updateState, onClose }) {
  const [phase, setPhase] = useState('select');
  const [oracleId, setOracleId] = useState(null);
  const [dilemmaIdx, setDilemmaIdx] = useState(0);
  const [decisions, setDecisions] = useState([]);
  const [shuffledFree, setShuffledFree] = useState([]);

  const restrainedPlayers = useMemo(
    () => (state.players || []).filter((p) => isFullyRestrained(p)),
    [state.players]
  );

  const freePlayers = useMemo(
    () => (state.players || []).filter((p) => !isFullyRestrained(p) && p.id !== oracleId),
    [state.players, oracleId]
  );

  function handleSelectOracle(id) {
    setOracleId(id);
    const free = (state.players || []).filter((p) => !isFullyRestrained(p) && p.id !== id);
    const shuffled = [...free].sort(() => Math.random() - 0.5);
    setShuffledFree(shuffled);
    setPhase('dilemmas');
  }

  function handleChoose(letterIdx) {
    const dilemma = ORACLE_DILEMMAS[dilemmaIdx];
    const target = shuffledFree[letterIdx];
    if (!target) return;
    const newDecisions = [...decisions, { dilemmaId: dilemma.id, fate: dilemma.fate, targetId: target.id, letter: LETTERS[letterIdx] }];
    setDecisions(newDecisions);

    if (dilemmaIdx + 1 >= ORACLE_DILEMMAS.length) {
      setPhase('done');
    } else {
      setDilemmaIdx(dilemmaIdx + 1);
    }
  }

  async function handleSeal() {
    const fates = {};
    decisions.forEach((d) => { fates[d.targetId] = d.fate; });
    const oracleName = state.players.find((p) => p.id === oracleId)?.name || 'Oracle';
    const history = addHistory(state, { type: 'blind_oracle', player: oracleName, detail: `${decisions.length} μοίρες σφραγίστηκαν` });
    await updateState({
      blindOracle: { phase: 'sealed', oracleId, fates, decisions, timestamp: Date.now() },
      history,
    });
    onClose();
  }

  if (phase === 'select') {
    return (
      <div className="fixed inset-0 z-[70] bg-background/80 flex items-center justify-center p-4" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-3">
          <ComicPanel className="bg-tarot-royal text-foreground text-center py-4">
            <div className="font-heading text-3xl comic-text-stroke text-tarot-gold">🔮 ΤΥΦΛΟ ΜΑΝΤΕΙΟ</div>
            <div className="text-sm font-bold text-foreground/80 font-body">Διάλεξε ποια δεμένη παίκτρια γίνεται το Μαντείο</div>
            <div className="text-xs mt-1 text-primary font-body">Πρέπει να είναι δεμένη + με μάσκα στα μάτια</div>
          </ComicPanel>
          {restrainedPlayers.length === 0 ? (
            <ComicPanel className="bg-card text-center py-6">
              <div className="text-3xl mb-2">🔗</div>
              <div className="font-heading text-lg text-primary">Δεν υπάρχουν δεμένες παίκτριες</div>
              <div className="text-xs mt-1 text-foreground/60 font-body">Το Μαντείο ενεργοποιείται μόνο όταν μια παίκτρια είναι πλήρως δεμένη (Time-Lock).</div>
            </ComicPanel>
          ) : (
            <div className="space-y-2">
              {restrainedPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectOracle(p.id)}
                  className="comic-panel-sm p-3 w-full bg-card text-left hover:bg-tarot-royal/20 transition-colors flex items-center gap-3 text-foreground"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-border bg-tarot-royal text-foreground flex items-center justify-center font-heading text-xl">
                    {p.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-heading text-lg">{p.name}</div>
                    <div className="text-xs text-foreground/60 font-body">Ποινή {p.penaltyStep} · {isFullyRestrained(p) ? 'Πλήρως δεμένη' : 'Δεμένη'}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <ComicButton variant="red" size="sm" onClick={onClose} className="w-full">✕ ΚΛΕΙΣΙΜΟ</ComicButton>
        </div>
      </div>
    );
  }

  if (phase === 'dilemmas') {
    const dilemma = ORACLE_DILEMMAS[dilemmaIdx];
    const oracle = state.players.find((p) => p.id === oracleId);
    return (
      <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-3">
          <ComicPanel className="bg-tarot-royal text-foreground text-center py-3">
            <div className="font-heading text-2xl comic-text-stroke text-tarot-gold">🔮 ΜΑΝΤΕΙΟ — ΔΙΛΗΜΜΑ {dilemmaIdx + 1}/3</div>
            <div className="text-xs text-foreground/80 font-body">Oracle: {oracle?.name} · 🙈 Με μάσκα</div>
          </ComicPanel>
          <ComicPanel className="bg-card">
            <div className="text-center mb-3">
              <div className="text-4xl mb-2">{dilemma.icon}</div>
              <p className="text-lg font-medium text-foreground font-body">{dilemma.text}</p>
            </div>
            <div className="text-center mb-3">
              <SpeakButton text={dilemma.text} label="🔊 ΕΚΦΩΝΗΣΗ ΣΤΗΝ ORACLE" className="w-full" />
            </div>
            <div className="text-xs text-center text-foreground/60 mb-3 font-body">
              {freePlayers.length} ελεύθερες παίκτριες · Η Oracle ακούει και διαλέγει γράμμα — δεν ξέρει ποια είναι ποια.
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {freePlayers.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleChoose(i)}
                  className="comic-boom font-heading text-2xl py-4 bg-primary text-tarot-dark"
                >
                  {LETTERS[i]}
                </button>
              ))}
            </div>
          </ComicPanel>
          <div className="text-center text-foreground text-xs font-body">
            Ήδη απάντησε: {decisions.length}/3
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-3">
          <ComicPanel className="bg-tarot-royal text-foreground text-center py-4">
            <div className="font-heading text-3xl comic-text-stroke text-tarot-gold">🔮 ΜΟΙΡΕΣ ΣΦΡΑΓΙΣΤΗΚΑΝ</div>
            <div className="text-sm text-foreground/80 font-body">Η Oracle πήρε 3 αποφάσεις χωρίς να βλέπει</div>
          </ComicPanel>
          <ComicPanel className="bg-card">
            <div className="text-xs font-bold mb-2 text-center text-primary font-body">Κρυφές μοίρες (μόνο ο GM βλέπει):</div>
            <div className="space-y-1">
              {decisions.map((d, i) => {
                const target = state.players.find((p) => p.id === d.targetId);
                return (
                  <div key={i} className="text-sm flex items-center justify-between comic-panel-sm p-2 bg-secondary text-foreground">
                    <span className="font-bold">{LETTERS[i]} → {target?.name}</span>
                    <span className="text-primary">{ORACLE_FATE_LABELS[d.fate]}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-xs mt-2 text-foreground/60 text-center font-body">
              Οι ελεύθερες δεν ξέρουν τι ερωτήθηκαν. Η TV θα δείξει "ΜΑΝΤΕΙΟ" — αποκάλυψη όταν θες.
            </div>
          </ComicPanel>
          <ComicButton variant="magenta" size="lg" onClick={handleSeal} className="w-full">
            🔏 ΣΦΡΑΓΙΣΕ ΜΟΙΡΕΣ
          </ComicButton>
        </div>
      </div>
    );
  }

  return null;
}