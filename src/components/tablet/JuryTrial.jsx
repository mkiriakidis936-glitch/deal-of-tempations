import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { addHistory, applyPenaltyStep, reducePenaltyStep } from '@/lib/gameLogic';

const CHARGES = [
  'Κλοπή Loot από την παρέα',
  'Προδοσία ομάδας',
  'Ψευδή καταθετική',
  'Συνωμοσία εναντίον Most Wanted',
  'Παράβαση κανονισμού',
];

export default function JuryTrial({ state, updateState, onClose }) {
  const trial = state.juryTrial;
  const [defense, setDefense] = useState(trial?.defenseText || '');

  async function startTrial(defendantId, charge) {
    await updateState({ juryTrial: { defendantId, charge, defenseText: '', phase: 'defense', votes: {} } });
  }

  async function submitDefense() {
    await updateState({ juryTrial: { ...trial, defenseText: defense, phase: 'voting' } });
  }

  async function renderVerdict() {
    const votes = trial.votes || {};
    const guilty = Object.values(votes).filter((v) => v === 'guilty').length;
    const innocent = Object.values(votes).filter((v) => v === 'innocent').length;
    const verdict = guilty > innocent ? 'guilty' : 'innocent';
    const players = state.players.map((p) =>
      p.id === trial.defendantId
        ? verdict === 'guilty' ? applyPenaltyStep(p) : reducePenaltyStep(p, 1)
        : p
    );
    const defendant = state.players.find((p) => p.id === trial.defendantId);
    const history = addHistory({ ...state, players }, { type: 'trial_verdict', player: defendant?.name, verdict, guilty, innocent });
    await updateState({ players, history, juryTrial: { ...trial, phase: 'verdict', verdict, guilty, innocent } });
  }

  async function close() {
    await updateState({ juryTrial: null });
    onClose();
  }

  if (!trial) {
    return (
      <div className="fixed inset-0 z-[70] bg-background/70 flex items-center justify-center p-4" onClick={close}>
        <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-3">
          <ComicPanel className="text-center py-5">
            <div className="ds-eyebrow text-primary/80">Δίκη</div>
            <div className="ds-title mt-2 text-3xl">Δίκη με Ενόρκους</div>
            <div className="ds-label mt-2">Διάλεξε κατηγορούμενη</div>
          </ComicPanel>
          <div className="grid grid-cols-2 gap-2">
            {state.players.map((p) => (
              <ComicButton key={p.id} variant="white" size="sm" onClick={() => startTrial(p.id, CHARGES[0])}>
                {p.name}
              </ComicButton>
            ))}
          </div>
          <ComicButton variant="red" size="sm" onClick={close} className="w-full">✕ ΚΛΕΙΣΙΜΟ</ComicButton>
        </div>
      </div>
    );
  }

  const defendant = state.players.find((p) => p.id === trial.defendantId);

  if (trial.phase === 'defense') {
    return (
      <div className="fixed inset-0 z-[70] bg-background/70 flex items-center justify-center p-4" onClick={close}>
        <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-3">
          <ComicPanel className="text-center py-5">
            <div className="ds-eyebrow text-primary/80">Δίκη</div>
            <div className="ds-title mt-2 text-2xl">{defendant?.name}</div>
            <div className="ds-label mt-2">{trial.charge}</div>
          </ComicPanel>
          <ComicPanel>
            <div className="ds-label text-primary/80">Απολογία · 60″</div>
            <div className="ds-label mt-2 leading-relaxed text-foreground/45">Η κατηγορούμενη γράφει την απολογία της στο κινητό της, ή γράψτε εδώ:</div>
            <textarea
              value={defense}
              onChange={(e) => setDefense(e.target.value)}
              className="w-full rounded-md border border-border/60 bg-surface-1 p-3 text-sm h-24 text-foreground font-body"
              placeholder="Γράψε την απολογία σου..."
            />
            <ComicButton variant="green" size="md" onClick={submitDefense} className="w-full mt-2" disabled={!defense.trim()}>
              ▶ ΠΡΟΧΩΡΑ ΣΕ ΨΗΦΟΦΟΡΙΑ
            </ComicButton>
          </ComicPanel>
          <ComicButton variant="red" size="sm" onClick={close} className="w-full">✕ ΑΚΥΡΩΣΗ</ComicButton>
        </div>
      </div>
    );
  }

  if (trial.phase === 'voting') {
    const votes = trial.votes || {};
    const votedCount = Object.keys(votes).length;
    const eligibleVoters = state.players.filter((p) => p.id !== trial.defendantId).length;
    return (
      <div className="fixed inset-0 z-[70] bg-background/70 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-3">
          <ComicPanel className="text-center py-5">
            <div className="ds-eyebrow text-primary/80">Ψηφοφορία ενόρκων</div>
            <div className="ds-title mt-2 text-2xl">{defendant?.name}</div>
            <div className="ds-label mt-2">{trial.charge}</div>
            {trial.defenseText && (
              <div className="mt-3 rounded-sm border border-border/50 bg-surface-1 px-3 py-2 text-left font-body text-sm text-foreground/75">{trial.defenseText}</div>
            )}
          </ComicPanel>
          <ComicPanel className="text-center">
            <div className="ds-value text-3xl text-primary">{votedCount}/{eligibleVoters}</div>
            <div className="ds-label mt-1">ψήφοι ελήφθησαν από τα κινητά</div>
          </ComicPanel>
          <ComicButton variant="magenta" size="lg" onClick={renderVerdict} className="w-full" disabled={votedCount === 0}>
            ⚖️ ΕΚΔΟΣΗ ΕΤΥΜΗΓΟΡΙΑΣ
          </ComicButton>
          <ComicButton variant="red" size="sm" onClick={close} className="w-full">✕ ΑΚΥΡΩΣΗ</ComicButton>
        </div>
      </div>
    );
  }

  const verdict = trial.verdict;
  return (
    <div className="fixed inset-0 z-[70] bg-background/70 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-3">
        <ComicPanel className={`text-center py-8 comic-pop ${verdict === 'guilty' ? 'border-destructive/50' : 'border-primary/40'}`}>
          <div className={`ds-eyebrow ${verdict === 'guilty' ? 'text-destructive' : 'text-primary/80'}`}>Ετυμηγορία</div>
          <div className={`ds-title mt-3 text-4xl ${verdict === 'guilty' ? 'text-destructive' : 'text-primary'}`}>{verdict === 'guilty' ? 'Ένοχη' : 'Αθώα'}</div>
          <div className="ds-value mt-3 text-lg text-foreground">{defendant?.name}</div>
          <div className="ds-label mt-2">Ένοχες {trial.guilty} · Αθώες {trial.innocent}</div>
          <div className="ds-label mt-3 text-foreground/60">
            {verdict === 'guilty' ? '+2 βήματα ποινής' : '-1 βήμα ποινής'}
          </div>
        </ComicPanel>
        <ComicButton variant="dark" size="lg" onClick={close} className="w-full">✅ ΕΠΙΣΤΡΟΦΗ</ComicButton>
      </div>
    </div>
  );
}