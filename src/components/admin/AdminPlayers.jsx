import React, { useState, useEffect } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { HIDDEN_ROLES, FOOTWEAR_LEVELS, TOENAIL_PERKS, getPenaltyLadder } from '@/data/gameConfig';

export default function AdminPlayers({ sessions, selectedSession, onSelect, onUpdate }) {
  const [edits, setEdits] = useState({});

  useEffect(() => {
    if (selectedSession) {
      const players = selectedSession.state?.players || [];
      const initial = {};
      players.forEach((p) => { initial[p.id] = { ...p }; });
      setEdits(initial);
    }
  }, [selectedSession?.id]);

  if (!selectedSession) {
    return (
      <ComicPanel className="bg-card text-center py-8">
        <div className="text-4xl mb-2">👈</div>
        <div className="font-heading text-xl">Επίλεξε συνεδρία</div>
        <div className="text-sm text-foreground/60 mt-1">Πήγαινε στο tab «Συνεδρίες» και πάτησε «ΕΠΕΞΕΡΓΑΣΙΑ ΠΑΙΚΤΡΙΩΝ»</div>
      </ComicPanel>
    );
  }

  const state = selectedSession.state || {};
  const players = state.players || [];
  const mode = state.mode || selectedSession.mode;
  const isMarathon = mode === 'marathon';
  const isArrestHeist = mode === 'arrest_heist';

  function editField(playerId, field, value) {
    setEdits((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }));
  }

  async function saveAll() {
    const updatedPlayers = players.map((p) => edits[p.id] || p);
    const newState = { ...state, players: updatedPlayers };
    await onUpdate(selectedSession.id, newState);
  }

  async function savePlayer(playerId) {
    const updatedPlayers = players.map((p) => p.id === playerId ? edits[playerId] : p);
    const newState = { ...state, players: updatedPlayers };
    await onUpdate(selectedSession.id, newState);
  }

  async function forceStage(newStage) {
    const newState = { ...state, stage: newStage };
    await onUpdate(selectedSession.id, newState);
  }

  async function toggleStop() {
    const newState = { ...state, stopActive: !state.stopActive };
    await onUpdate(selectedSession.id, newState);
  }

  async function clearBomb() {
    const newState = { ...state, bombEvent: null };
    await onUpdate(selectedSession.id, newState);
  }

  async function resetAllPenalties() {
    const updatedPlayers = players.map((p) => ({ ...p, penaltyStep: 0, immunity: false }));
    const newState = { ...state, players: updatedPlayers };
    await onUpdate(selectedSession.id, newState);
    setEdits((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => { next[id] = { ...next[id], penaltyStep: 0, immunity: false }; });
      return next;
    });
  }

  async function giveAllImmunity() {
    const updatedPlayers = players.map((p) => ({ ...p, immunity: true }));
    const newState = { ...state, players: updatedPlayers };
    await onUpdate(selectedSession.id, newState);
    setEdits((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => { next[id] = { ...next[id], immunity: true }; });
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Session header */}
      <ComicPanel className="bg-primary">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="font-heading text-xl">{selectedSession.sessionCode}</div>
            <div className="text-xs font-bold">{mode} · Στάδιο {state.stage} · {players.length} παίκτριες</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ComicButton variant="green" size="sm" onClick={saveAll}>💾 ΑΠΟΘΗΚΕΥΣΗ ΟΛΩΝ</ComicButton>
          </div>
        </div>
      </ComicPanel>

      {/* Game controls */}
      <ComicPanel className="bg-card">
        <div className="font-heading text-lg mb-2">⚙️ Έλεγχος Παιχνιδιού</div>
        <div className="flex gap-2 flex-wrap">
          <ComicButton variant={state.stopActive ? 'green' : 'red'} size="sm" onClick={toggleStop}>
            {state.stopActive ? '▶️ ΣΥΝΕΧΙΣΗ' : '⏸ ΠΑΥΣΗ'}
          </ComicButton>
          {state.bombEvent && (
            <ComicButton variant="red" size="sm" onClick={clearBomb}>💣 ΑΚΥΡΩΣΗ BOMB</ComicButton>
          )}
          <ComicButton variant="dark" size="sm" onClick={resetAllPenalties}>🔄 ΜΗΔΕΝΙΣΜΟΣ ΠΟΙΝΩΝ</ComicButton>
          <ComicButton variant="cyan" size="sm" onClick={giveAllImmunity}>🛡️ ΑΣΥΛΙΑ ΟΛΩΝ</ComicButton>
        </div>
        <div className="mt-3">
          <div className="text-xs font-bold mb-1">📍 Αλλαγή Σταδίου:</div>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3].map((st) => (
              <ComicButton
                key={st}
                variant={state.stage === st ? 'magenta' : 'white'}
                size="sm"
                onClick={() => forceStage(st)}
              >
                Στάδιο {st}
              </ComicButton>
            ))}
          </div>
        </div>
      </ComicPanel>

      {/* Player editors */}
      <div className="space-y-2">
        {players.map((p) => {
          const edit = edits[p.id] || p;
          const ladder = getPenaltyLadder(p.footwearLevel);
          return (
            <ComicPanel key={p.id} className="bg-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="font-heading text-lg flex-1">{p.name}</div>
                {edit.isChief && <span className="bg-tarot-teal text-foreground text-xs px-2 py-0.5 rounded font-bold">🚔 Αστυνόμος</span>}
                {edit.immunity && <span className="bg-tarot-forest text-foreground text-xs px-2 py-0.5 rounded font-bold">🛡️ Ασυλία</span>}
                {edit.team && <span className={`text-xs px-2 py-0.5 rounded font-bold ${edit.team === 'alpha' || edit.team === 'A' ? 'bg-destructive/40' : 'bg-tarot-teal/30'}`}>Ομάδα {edit.team}</span>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Penalty step */}
                <div>
                  <label className="font-bold block mb-1">Ποινή (0-{ladder.length})</label>
                  <input
                    type="number"
                    min={0}
                    max={ladder.length}
                    value={edit.penaltyStep || 0}
                    onChange={(e) => editField(p.id, 'penaltyStep', Math.max(0, Math.min(ladder.length, parseInt(e.target.value) || 0)))}
                    className="w-full border-2 border-border rounded px-2 py-1"
                  />
                </div>

                {/* Bounty */}
                <div>
                  <label className="font-bold block mb-1">Επικήρυξη $</label>
                  <input
                    type="number"
                    min={0}
                    value={edit.bounty || 0}
                    onChange={(e) => editField(p.id, 'bounty', parseInt(e.target.value) || 0)}
                    className="w-full border-2 border-border rounded px-2 py-1"
                  />
                </div>

                {/* Tokens */}
                <div>
                  <label className="font-bold block mb-1">🎟️ Tokens</label>
                  <input
                    type="number"
                    min={0}
                    value={edit.tokens || 0}
                    onChange={(e) => editField(p.id, 'tokens', Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full border-2 border-border rounded px-2 py-1"
                  />
                </div>

                {/* Position */}
                {!isArrestHeist && (
                  <div>
                    <label className="font-bold block mb-1">📍 Θέση</label>
                    <input
                      type="number"
                      min={0}
                      max={43}
                      value={edit.position || 0}
                      onChange={(e) => editField(p.id, 'position', Math.max(0, Math.min(43, parseInt(e.target.value) || 0)))}
                      className="w-full border-2 border-border rounded px-2 py-1"
                    />
                  </div>
                )}

                {/* Role (classic only) */}
                {mode === 'classic' && (
                  <div>
                    <label className="font-bold block mb-1">🎭 Ρόλος</label>
                    <select
                      value={edit.role || ''}
                      onChange={(e) => editField(p.id, 'role', e.target.value || null)}
                      className="w-full border-2 border-border rounded px-1 py-1"
                    >
                      <option value="">— Κανένας —</option>
                      {HIDDEN_ROLES.map((r) => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Footwear */}
                <div>
                  <label className="font-bold block mb-1">👢 Υπόδηση</label>
                  <select
                    value={edit.footwearLevel ?? 2}
                    onChange={(e) => editField(p.id, 'footwearLevel', parseInt(e.target.value))}
                    className="w-full border-2 border-border rounded px-1 py-1"
                  >
                    {FOOTWEAR_LEVELS.map((f) => <option key={f.level} value={f.level}>{f.icon} {f.label}</option>)}
                  </select>
                </div>

                {/* Toenail perk */}
                <div>
                  <label className="font-bold block mb-1">💅 Perk</label>
                  <select
                    value={edit.toenailPerk || ''}
                    onChange={(e) => editField(p.id, 'toenailPerk', e.target.value || null)}
                    className="w-full border-2 border-border rounded px-1 py-1"
                  >
                    <option value="">— Κανένα —</option>
                    {TOENAIL_PERKS.map((pk) => <option key={pk.id} value={pk.id}>{pk.icon} {pk.name}</option>)}
                  </select>
                </div>

                {/* Team (marathon/arrest) */}
                {(isMarathon || isArrestHeist) && (
                  <div>
                    <label className="font-bold block mb-1">👥 Ομάδα</label>
                    <select
                      value={edit.team || ''}
                      onChange={(e) => editField(p.id, 'team', e.target.value || null)}
                      className="w-full border-2 border-border rounded px-1 py-1"
                    >
                      <option value="">—</option>
                      {isMarathon
                        ? [<option key="alpha" value="alpha">Alpha</option>, <option key="beta" value="beta">Beta</option>]
                        : [<option key="A" value="A">Team Alpha</option>, <option key="B" value="B">Team Beta</option>]}
                    </select>
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex gap-2 flex-wrap mt-3">
                <button
                  onClick={() => editField(p.id, 'isChief', !edit.isChief)}
                  className={`text-xs px-2 py-1 rounded border-2 border-border font-bold ${edit.isChief ? 'bg-tarot-teal text-foreground' : 'bg-card'}`}
                >
                  🚔 Αστυνόμος
                </button>
                <button
                  onClick={() => editField(p.id, 'immunity', !edit.immunity)}
                  className={`text-xs px-2 py-1 rounded border-2 border-border font-bold ${edit.immunity ? 'bg-tarot-forest text-foreground' : 'bg-card'}`}
                >
                  🛡️ Ασυλία
                </button>
                <button
                  onClick={() => editField(p.id, 'abilityUsed', !edit.abilityUsed)}
                  className={`text-xs px-2 py-1 rounded border-2 border-border font-bold ${edit.abilityUsed ? 'bg-secondary text-foreground' : 'bg-card'}`}
                >
                  {edit.abilityUsed ? '✅ Ικανότητα Χρησιμοποιήθηκε' : '⚡ Ικανότητα Διαθέσιμη'}
                </button>
                <ComicButton variant="green" size="sm" onClick={() => savePlayer(p.id)}>💾 ΑΠΟΘΗΚΕΥΣΗ</ComicButton>
              </div>
            </ComicPanel>
          );
        })}
      </div>
    </div>
  );
}