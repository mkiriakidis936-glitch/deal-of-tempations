import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { categorizeGrandJuryLogs } from '@/lib/gameLogic';

const LOG_CATEGORIES = [
  { id: 'bust', label: '💣 BUST' },
  { id: 'midnight_pact', label: '🌙 MIDNIGHT PACT' },
  { id: 'trade_hostage', label: '📜 TRADE HOSTAGE' },
  { id: 'anonymous_vote', label: '⚖️ ΑΝΩΝΥΜΗ ΨΗΦΟΣ' },
];

export default function AdminGrandJury() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [manualText, setManualText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await base44.entities.GameSession.filter({}, { sort: '-created_date', limit: 50 });
      setSessions(items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = sessions.find((s) => s.id === selectedId);
  const state = selected?.state || {};
  const cats = categorizeGrandJuryLogs(state.history);
  const manualLogs = state.grandJury?.manualLogs || [];

  async function addManualLog() {
    if (!manualText.trim() || !selected) return;
    const gj = state.grandJury || { manualLogs: [] };
    const newLogs = [...(gj.manualLogs || []), { text: manualText.trim(), timestamp: Date.now() }];
    const newState = { ...state, grandJury: { ...gj, manualLogs: newLogs } };
    try {
      await base44.entities.GameSession.update(selected.id, { state: newState });
      setSessions((prev) => prev.map((s) => (s.id === selected.id ? { ...s, state: newState } : s)));
      setManualText('');
    } catch (e) { console.error(e); }
  }

  async function removeManualLog(idx) {
    if (!selected) return;
    const gj = state.grandJury || { manualLogs: [] };
    const newLogs = (gj.manualLogs || []).filter((_, i) => i !== idx);
    const newState = { ...state, grandJury: { ...gj, manualLogs: newLogs } };
    try {
      await base44.entities.GameSession.update(selected.id, { state: newState });
      setSessions((prev) => prev.map((s) => (s.id === selected.id ? { ...s, state: newState } : s)));
    } catch (e) { console.error(e); }
  }

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-destructive/40">
        <div className="font-heading text-xl comic-text-stroke">📜 ΚΑΤΗΓΟΡΗΤΗΡΙΟ — LOGS</div>
        <div className="text-xs font-bold mt-1">
          Προβολή & χειροκίνητη καταχώρηση logs ανά συνεδρία για το Grand Jury.
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card">
        <div className="font-heading text-sm mb-2">Επιλογή Συνεδρίας</div>
        {loading ? (
          <div className="text-sm">Φόρτωση…</div>
        ) : (
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border-2 border-border rounded px-2 py-1 text-sm bg-card"
          >
            <option value="">— Επιλέξτε συνεδρία —</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sessionCode} — {s.mode} — {new Date(s.created_date).toLocaleString('el-GR')}
              </option>
            ))}
          </select>
        )}
      </ComicPanel>

      {selected && (
        <>
          {LOG_CATEGORIES.map((c) => {
            const events = cats[c.id] || [];
            return (
              <ComicPanel key={c.id} className="bg-card">
                <div className="font-heading text-sm mb-2">{c.label} ({events.length})</div>
                {events.length === 0 ? (
                  <div className="text-xs text-foreground/40 italic">Καθόλου καταγραφές</div>
                ) : (
                  <div className="space-y-1">
                    {events.map((e, i) => (
                      <div key={i} className="text-xs comic-panel-sm p-2 bg-secondary">
                        {e.player && <span className="font-bold">{e.player}</span>}
                        {e.target && <span> → {e.target}</span>}
                        {e.detail && <span> — {e.detail}</span>}
                        {e.verdict && <span> — {e.verdict === 'guilty' ? 'ΕΝΟΧΗ' : 'ΑΘΩΗ'}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </ComicPanel>
            );
          })}

          <ComicPanel className="bg-primary/20">
            <div className="font-heading text-sm mb-2">📝 Χειροκίνητα Logs</div>
            <div className="space-y-1 mb-3">
              {manualLogs.length === 0 ? (
                <div className="text-xs text-foreground/40 italic">Καθόλου χειροκίνητα logs</div>
              ) : (
                manualLogs.map((m, i) => (
                  <div key={i} className="text-xs comic-panel-sm p-2 bg-card flex justify-between items-start gap-2">
                    <span>{m.text}</span>
                    <button onClick={() => removeManualLog(i)} className="text-xs px-1 border border-border rounded bg-destructive/40 font-bold shrink-0">🗑️</button>
                  </div>
                ))
              )}
            </div>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Προσθήκη χειροκίνητου log..."
              className="w-full border-2 border-border rounded px-2 py-1 text-sm bg-card"
              rows={2}
            />
            <ComicButton variant="green" size="sm" onClick={addManualLog} disabled={!manualText.trim()} className="w-full mt-2">
              + ΠΡΟΣΘΗΚΗ LOG
            </ComicButton>
          </ComicPanel>
        </>
      )}
    </div>
  );
}