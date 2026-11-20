import React, { useState, useEffect, useRef } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { HIDDEN_ROLES, FOOTWEAR_LEVELS, TOENAIL_PERKS, getPenaltyLadder } from '@/data/gameConfig';

export default function AdminPlayers({ sessions, selectedSession, onSelect, onUpdate }) {
  const [edits, setEdits] = useState({});
  const dirtyFields = useRef({});

  // Κάθε νεότερο SSE snapshot περνά στο Admin χωρίς να σβήνει τις τοπικές,
  // μη αποθηκευμένες αλλαγές του χρήστη.
  useEffect(() => {
    if (!selectedSession) return;
    const incoming = selectedSession.state?.players || [];
    setEdits((current) => {
      const next = {};
      for (const player of incoming) {
        const dirty = dirtyFields.current[player.id] || new Set();
        next[player.id] = { ...player };
        for (const field of dirty) {
          if (current[player.id] && field in current[player.id]) next[player.id][field] = current[player.id][field];
        }
      }
      return next;
    });
    dirtyFields.current = Object.fromEntries(
      Object.entries(dirtyFields.current).filter(([id]) => incoming.some((player) => player.id === id))
    );
  }, [selectedSession?.id, selectedSession?.state, selectedSession?.updated_date]);

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
    dirtyFields.current[playerId] ||= new Set();
    dirtyFields.current[playerId].add(field);
    setEdits((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }));
  }

  async function savePlayerChanges(playerIds = players.map((player) => player.id)) {
    const updates = [];
    for (const playerId of playerIds) {
      const dirty = dirtyFields.current[playerId];
      if (!dirty?.size) continue;
      const fields = {};
      for (const field of dirty) fields[field] = edits[playerId]?.[field];
      if (Object.keys(fields).length) updates.push({ id: playerId, ...fields });
    }
    if (!updates.length) return;
    const saved = await onUpdate(selectedSession.id, { players: updates });
    if (!saved) return;
    for (const player of updates) delete dirtyFields.current[player.id];
  }

  async function saveAll() { await savePlayerChanges(); }
  async function savePlayer(playerId) { await savePlayerChanges([playerId]); }

  async function forceStage(newStage) { await onUpdate(selectedSession.id, { stage: newStage }); }
  async function toggleStop() { await onUpdate(selectedSession.id, { stopActive: !state.stopActive }); }
  async function clearBomb() { await onUpdate(selectedSession.id, { bombEvent: null }); }

  async function resetAllPenalties() {
    await onUpdate(selectedSession.id, { players: players.map((p) => ({ id: p.id, penaltyStep: 0, immunity: false })) });
    players.forEach((p) => { if (dirtyFields.current[p.id]) { dirtyFields.current[p.id].delete('penaltyStep'); dirtyFields.current[p.id].delete('immunity'); } });
  }

  async function giveAllImmunity() {
    await onUpdate(selectedSession.id, { players: players.map((p) => ({ id: p.id, immunity: true })) });
    players.forEach((p) => dirtyFields.current[p.id]?.delete('immunity'));
  }

  async function setPajamaSaboteur(playerId) {
    await onUpdate(selectedSession.id, { pajama: { saboteurId: playerId || null } });
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
                {mode === 'classic' && edit.isChief && <span className="bg-tarot-teal text-foreground text-xs px-2 py-0.5 rounded font-bold">🚔 Αστυνόμος</span>}
                {mode === 'pajama' && state.pajama?.saboteurId === p.id && <span className="bg-destructive/30 text-foreground text-xs px-2 py-0.5 rounded font-bold">🎭 Saboteur</span>}
                {isArrestHeist && edit.isLeader && <span className="bg-tarot-teal text-foreground text-xs px-2 py-0.5 rounded font-bold">👑 Αρχηγός</span>}
                {edit.immunity && <span className="bg-tarot-forest text-foreground text-xs px-2 py-0.5 rounded font-bold">🛡️ Ασυλία</span>}
                {edit.team && <span className={`text-xs px-2 py-0.5 rounded font-bold ${edit.team === 'alpha' || edit.team === 'A' ? 'bg-destructive/40' : 'bg-tarot-teal/30'}`}>Ομάδα {edit.team}</span>}
              </div>
              {p.vipProfile?.answerLabels && (
                <details className="mb-3 rounded-lg border border-[#b99a45]/35 bg-black/30 p-3">
                  <summary className="cursor-pointer text-xs font-bold text-[#E8C26B]">✦ VIP ΠΡΟΦΙΛ ΣΥΜΜΕΤΕΧΟΥΣΑΣ</summary>
                  <div className="mt-2 space-y-1 text-xs text-foreground/75">
                    {Object.entries(p.vipProfile.answerLabels).filter(([, value]) => String(value || '').trim()).map(([label, value]) => (
                      <div key={label}><span className="text-[#E8C26B]">{label}:</span> {String(value)}</div>
                    ))}
                  </div>
                </details>
              )}

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

                {/* Μάρκες */}
                <div>
                  <label className="font-bold block mb-1">🎟️ Μάρκες</label>
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

                {/* Οι κρυφοί ρόλοι ανήκουν στο Classic. */}
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
                  <label className="font-bold block mb-1">💅 Προνόμιο</label>
                  <select
                    value={edit.toenailPerk || ''}
                    onChange={(e) => editField(p.id, 'toenailPerk', e.target.value || null)}
                    className="w-full border-2 border-border rounded px-1 py-1"
                  >
                    <option value="">— Κανένα —</option>
                    {TOENAIL_PERKS.map((pk) => <option key={pk.id} value={pk.id}>{pk.icon} {pk.name}</option>)}
                  </select>
                </div>

                {/* Ομάδες Marathon / Arrest & Heist */}
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
                        ? [<option key="alpha" value="alpha">Άλφα</option>, <option key="beta" value="beta">Βήτα</option>]
                        : [<option key="A" value="A">Ομάδα Άλφα</option>, <option key="B" value="B">Ομάδα Βήτα</option>]}
                    </select>
                  </div>
                )}
              </div>

              {mode === 'pajama' && (
                <div className="mb-3">
                  <label className="font-bold block mb-1 text-xs">🎭 Ρόλος Pajama · Saboteur</label>
                  <select
                    value={state.pajama?.saboteurId || ''}
                    onChange={(e) => setPajamaSaboteur(e.target.value)}
                    className="w-full max-w-sm border-2 border-border rounded px-2 py-1 text-xs"
                  >
                    <option value="">— Χωρίς ανάθεση —</option>
                    {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                  </select>
                </div>
              )}

              {/* Mode-specific roles and status */}
              <div className="flex gap-2 flex-wrap mt-3">
                {mode === 'classic' && (
                  <>
                    <button
                      onClick={() => editField(p.id, 'isChief', !edit.isChief)}
                      className={`text-xs px-2 py-1 rounded border-2 border-border font-bold ${edit.isChief ? 'bg-tarot-teal text-foreground' : 'bg-card'}`}
                    >
                      🚔 Αστυνόμος
                    </button>
                    <button
                      onClick={() => editField(p.id, 'abilityUsed', !edit.abilityUsed)}
                      className={`text-xs px-2 py-1 rounded border-2 border-border font-bold ${edit.abilityUsed ? 'bg-secondary text-foreground' : 'bg-card'}`}
                    >
                      {edit.abilityUsed ? '✅ Ικανότητα Χρησιμοποιήθηκε' : '⚡ Ικανότητα Διαθέσιμη'}
                    </button>
                  </>
                )}
                {isArrestHeist && (
                  <button
                    onClick={() => editField(p.id, 'isLeader', !edit.isLeader)}
                    className={`text-xs px-2 py-1 rounded border-2 border-border font-bold ${edit.isLeader ? 'bg-tarot-teal text-foreground' : 'bg-card'}`}
                  >
                    👑 Αρχηγός ομάδας
                  </button>
                )}
                <button
                  onClick={() => editField(p.id, 'immunity', !edit.immunity)}
                  className={`text-xs px-2 py-1 rounded border-2 border-border font-bold ${edit.immunity ? 'bg-tarot-forest text-foreground' : 'bg-card'}`}
                >
                  🛡️ Ασυλία
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