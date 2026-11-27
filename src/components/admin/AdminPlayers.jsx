import React, { useState, useEffect, useRef } from 'react';
import { appApi, request } from '@/api/apiClient';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { HIDDEN_ROLES, FOOTWEAR_LEVELS, TOENAIL_PERKS, getPenaltyLadder } from '@/data/gameConfig';

export default function AdminPlayers({ sessions, selectedSession, onSelect, onUpdate }) {
  const [edits, setEdits] = useState({});
  const [presence, setPresence] = useState({});
  const dirtyFields = useRef({});

  useEffect(() => {
    const sessionCode = selectedSession?.sessionCode;
    if (!sessionCode) { setPresence({}); return undefined; }
    let alive = true;
    const refresh = () => request('GET', `/api/entities/player-presence/${encodeURIComponent(sessionCode)}`)
      .then((data) => {
        if (!alive) return;
        setPresence(Object.fromEntries((data.players || []).map((item) => [item.playerId, item.lastSeenAt])));
      })
      .catch(() => {});
    refresh();
    const unsubscribe = appApi.entities.PlayerPresence.subscribe((event) => {
      if (!alive || event?.data?.sessionCode !== sessionCode || !event.data.playerId) return;
      setPresence((current) => ({ ...current, [event.data.playerId]: Number(event.data.lastSeenAt) || Date.now() }));
    });
    const expiryTimer = window.setInterval(() => {
      setPresence((current) => Object.fromEntries(
        Object.entries(current).filter(([, lastSeenAt]) => Date.now() - Number(lastSeenAt) <= 45000)
      ));
    }, 5000);
    return () => {
      alive = false;
      unsubscribe?.();
      window.clearInterval(expiryTimer);
    };
  }, [selectedSession?.sessionCode]);

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
  const currentPlayer = players[state.currentPlayerIndex ?? 0];
  const lastActivity = state.history?.[0];
  const activityLabel = lastActivity?.description || lastActivity?.detail || lastActivity?.text || lastActivity?.type || 'Δεν υπάρχει πρόσφατη ενέργεια';

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

  async function setPajamaSaboteur(playerId) {
    await onUpdate(selectedSession.id, { pajama: { saboteurId: playerId || null } });
  }

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-primary">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="font-heading text-xl">{selectedSession.sessionCode}</div>
            <div className="text-xs font-bold">{mode} · Γύρος {state.round ?? 1} · Στάδιο {state.stage ?? 0} · {players.length} δηλωμένες · {players.filter((player) => presence[player.id] && Date.now() - Number(presence[player.id]) <= 45000).length} συνδεδεμένες</div>
            <div className="mt-1 text-[11px] text-foreground/70">Σειρά: {currentPlayer?.name || '—'} · Τελευταία ενέργεια: {String(activityLabel).replace(/[_-]/g, ' ')}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ComicButton variant="green" size="sm" onClick={saveAll}>💾 Αποθήκευση όλων</ComicButton>
          </div>
        </div>
      </ComicPanel>

      <div className="space-y-2">
        {players.map((p) => {
          const edit = edits[p.id] || p;
          const ladder = getPenaltyLadder(p.footwearLevel);
          return (
            <ComicPanel key={p.id} className="bg-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="font-heading text-lg flex-1">{p.name}</div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${presence[p.id] && Date.now() - Number(presence[p.id]) <= 45000 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-secondary text-foreground/45'}`}>{presence[p.id] && Date.now() - Number(presence[p.id]) <= 45000 ? '● Συνδεδεμένη' : '○ Εκτός σύνδεσης'}</span>
                {mode === 'classic' && edit.isChief && <span className="bg-tarot-teal text-foreground text-xs px-2 py-0.5 rounded font-bold">🚔 Αστυνόμος</span>}
                {mode === 'pajama' && state.pajama?.saboteurId === p.id && <span className="bg-destructive/30 text-foreground text-xs px-2 py-0.5 rounded font-bold">🎭 Saboteur</span>}
                {isArrestHeist && edit.isLeader && <span className="bg-tarot-teal text-foreground text-xs px-2 py-0.5 rounded font-bold">👑 Αρχηγός</span>}
                {edit.immunity && <span className="bg-tarot-forest text-foreground text-xs px-2 py-0.5 rounded font-bold">🛡️ Ασυλία</span>}
                {edit.team && <span className={`text-xs px-2 py-0.5 rounded font-bold ${edit.team === 'alpha' || edit.team === 'A' ? 'bg-destructive/40' : 'bg-tarot-teal/30'}`}>Ομάδα {edit.team}</span>}
              </div>
              {p.vipProfile?.answerLabels && (
                <details className="mb-3 rounded-lg border border-[#b99a45]/35 bg-black/30 p-3">
                  <summary className="cursor-pointer text-xs font-bold text-[#E8C26B]">✦ VIP προφίλ συμμετέχουσας</summary>
                  <div className="mt-2 space-y-1 text-xs text-foreground/75">
                    {Object.entries(p.vipProfile.answerLabels).filter(([, value]) => String(value || '').trim()).map(([label, value]) => (
                      <div key={label}><span className="text-[#E8C26B]">{label}:</span> {String(value)}</div>
                    ))}
                  </div>
                </details>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
                <ComicButton variant="green" size="sm" onClick={() => savePlayer(p.id)}>💾 Αποθήκευση</ComicButton>
              </div>
            </ComicPanel>
          );
        })}
      </div>
    </div>
  );
}