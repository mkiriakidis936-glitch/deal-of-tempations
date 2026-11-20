import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

export default function TimeCapsuleMobile({ state, selectedPlayerId, updateState }) {
  const capsule = state.timeCapsule || {};
  const myPred = capsule[selectedPlayerId] || {};
  const [form, setForm] = useState(myPred);

  if (state.stage !== 0 || myPred.submitted) return null;

  async function submit() {
    const updated = { ...capsule, [selectedPlayerId]: { ...form, submitted: true } };
    await updateState({ timeCapsule: updated });
  }

  return (
    <ComicPanel className="bg-tarot-royal/30">
      <div className="font-heading text-lg mb-1 text-primary">⏳ ΧΡΟΝΟΚΑΨΟΥΛΑ</div>
      <div className="text-xs mb-3 text-foreground/70 font-body">Γράψε τις προβλέψεις σου — αποκαλύπτονται στο Φινάλε!</div>
      <div className="space-y-2">
        <div>
          <label className="text-xs font-bold text-foreground font-body">Ποια θα πιαστεί ΠΡΩΤΗ;</label>
          <select
            value={form.firstArrest || ''}
            onChange={(e) => setForm({ ...form, firstArrest: e.target.value })}
            className="w-full border-2 border-border rounded p-1.5 text-sm bg-background text-foreground font-body"
          >
            <option value="">— Διάλεξε —</option>
            {state.players.filter((p) => p.id !== selectedPlayerId).map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-foreground font-body">Ποια θα φτάσει στο ΦΙΝΑΛΕ;</label>
          <select
            value={form.finalist || ''}
            onChange={(e) => setForm({ ...form, finalist: e.target.value })}
            className="w-full border-2 border-border rounded p-1.5 text-sm bg-background text-foreground font-body"
          >
            <option value="">— Διάλεξε —</option>
            {state.players.filter((p) => p.id !== selectedPlayerId).map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-foreground font-body">Ποια θα ΠΡΟΔΩΣΕΙ;</label>
          <select
            value={form.traitor || ''}
            onChange={(e) => setForm({ ...form, traitor: e.target.value })}
            className="w-full border-2 border-border rounded p-1.5 text-sm bg-background text-foreground font-body"
          >
            <option value="">— Διάλεξε —</option>
            {state.players.filter((p) => p.id !== selectedPlayerId).map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      <ComicButton variant="magenta" size="md" onClick={submit} className="w-full mt-3" disabled={!form.firstArrest || !form.finalist}>
        ✅ ΥΠΟΒΟΛΗ
      </ComicButton>
    </ComicPanel>
  );
}