import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { GAME_MODES, INTENSITY_LEVELS } from '@/data/gameConfig';
import { calculateMostWanted } from '@/lib/gameLogic';

const MODE_NAMES = Object.fromEntries(GAME_MODES.map((m) => [m.id, m.name]));
const INT_NAMES = Object.fromEntries(INTENSITY_LEVELS.map((i) => [i.id, `${i.icon} ${i.name}`]));
const STAGE_NAMES = { 0: 'Stage 0', 1: 'Stage 1', 2: 'Stage 2', 3: 'Stage 3' };

export default function AdminSessions({ sessions, loading, onSelect, onDelete, onRestart, onRefresh }) {
  const [expanded, setExpanded] = useState(null);

  function handleRestart(s) {
    if (!confirm(`Ολικό restart συνεδρίας ${s.sessionCode}; Θα μηδενιστούν ποινές, θέσεις, ιστορικό και ενεργή κάρτα (οι παίκτριες και η ρύθμιση παραμένουν).`)) return;
    onRestart && onRestart(s);
  }

  function handleDeleteCurrent() {
    if (sessions.length === 0) return;
    const current = sessions[0];
    if (!confirm(`Διαγραφή ΤΡΕΧΟΥΣΑΣ συνεδρίας ${current.sessionCode}; Αμετάκλητο.`)) return;
    onDelete(current.id);
  }

  if (loading) {
    return <ComicPanel className="bg-card text-center py-8"><div className="font-heading text-2xl comic-pulse">ΦΟΡΤΩΣΗ...</div></ComicPanel>;
  }

  if (sessions.length === 0) {
    return (
      <ComicPanel className="bg-card text-center py-8">
        <div className="text-4xl mb-2">📭</div>
        <div className="font-heading text-xl">Δεν υπάρχουν συνεδρίες</div>
        <div className="text-sm text-foreground/60 mt-1">Δημιούργησε νέο παιχνίδι από το Tablet (/) για να ξεκινήσεις.</div>
      </ComicPanel>
    );
  }

  return (
    <div className="space-y-2">
      <ComicPanel className="bg-destructive/20 border-2 border-destructive/40 flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm">
          <div className="font-heading text-lg">⚡ ΤΡΕΧΟΥΣΑ ΣΥΝΕΔΡΙΑ</div>
          <div className="text-xs text-foreground/70">{sessions[0]?.sessionCode} — {STAGE_NAMES[(sessions[0]?.state || {}).stage] || '—'}</div>
        </div>
        <ComicButton variant="red" size="sm" onClick={handleDeleteCurrent}>
          🗑️ ΔΙΑΓΡΑΦΗ ΤΡΕΧΟΥΣΑΣ
        </ComicButton>
      </ComicPanel>
      {sessions.map((s) => {
        const state = s.state || {};
        const players = state.players || [];
        const mostWanted = calculateMostWanted(players);
        const isExpanded = expanded === s.id;
        return (
          <ComicPanel key={s.id} className="bg-card">
            <div
              className="flex items-center justify-between gap-2 cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : s.id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="font-heading text-lg bg-background text-primary px-2 py-0.5 rounded">{s.sessionCode}</div>
                <div className="text-xs">
                  <span className="font-bold">{MODE_NAMES[state.mode || s.mode] || state.mode || '—'}</span>
                  {' · '}
                  <span>{INT_NAMES[state.intensity || s.intensity] || state.intensity || '—'}</span>
                  {' · '}
                  <span>{STAGE_NAMES[state.stage] || `Στάδιο ${state.stage}`}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-tarot-wine/30 px-2 py-0.5 rounded-full font-bold">👥 {players.length}</span>
                {mostWanted && <span className="bg-destructive/30 px-2 py-0.5 rounded-full font-bold">⭐ {mostWanted.name}</span>}
                <span>{isExpanded ? '▲' : '▼'}</span>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t-2 border-border/10 space-y-3">
                {/* Players summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {players.map((p) => (
                    <div key={p.id} className="comic-panel-sm p-2 text-xs">
                      <div className="font-bold truncate">{p.name}</div>
                      <div className="flex justify-between text-foreground/60">
                        <span>Ποινή: {p.penaltyStep || 0}</span>
                        <span>🎟️ {p.tokens || 0}</span>
                      </div>
                      <div className="flex justify-between text-foreground/60">
                        <span>${(p.bounty || 0).toLocaleString()}</span>
                        {p.role && <span>🎭</span>}
                        {p.team && <span className="font-bold">{p.team}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* History */}
                {state.history && state.history.length > 0 && (
                  <div>
                    <div className="text-xs font-bold mb-1">📜 Ιστορικό ({state.history.length} events):</div>
                    <div className="max-h-32 overflow-y-auto space-y-0.5 text-xs bg-background/5 rounded p-2">
                      {state.history.slice(0, 15).map((h, i) => (
                        <div key={i} className="truncate">
                          <span className="text-foreground/40">#{state.history.length - i}</span>{' '}
                          <span className="font-bold">{h.type}</span>
                          {h.player && ` — ${h.player}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <ComicButton variant="magenta" size="sm" onClick={() => onSelect(s)}>
                    ✏️ ΕΠΕΞΕΡΓΑΣΙΑ ΠΑΙΚΤΡΙΩΝ
                  </ComicButton>
                  <ComicButton variant="yellow" size="sm" onClick={() => handleRestart(s)}>
                    🔄 ΟΛΙΚΟ RESTART
                  </ComicButton>
                  <ComicButton
                    variant="red"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Διαγραφή συνεδρίας ${s.sessionCode};`)) onDelete(s.id);
                    }}
                  >
                    🗑️ ΔΙΑΓΡΑΦΗ
                  </ComicButton>
                </div>
              </div>
            )}
          </ComicPanel>
        );
      })}
    </div>
  );
}