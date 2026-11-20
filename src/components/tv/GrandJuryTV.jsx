import React, { useState, useEffect } from 'react';
import { categorizeGrandJuryLogs } from '@/lib/gameLogic';

const LOG_CATEGORIES = [
  { id: 'bust', label: '💣 BUST', desc: 'Πάτησαν BUST' },
  { id: 'midnight_pact', label: '🌙 MIDNIGHT PACT', desc: 'Δέχτηκαν το Συμβόλαιο' },
  { id: 'trade_hostage', label: '📜 TRADE HOSTAGE', desc: 'Έκαναν Trade Hostage' },
  { id: 'anonymous_vote', label: '⚖️ ΑΝΩΝΥΜΗ ΨΗΦΟΣ', desc: 'Ψήφισαν ανώνυμα' },
];

function fmtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function GrandJuryTV({ state }) {
  const gj = state.grandJury;
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!gj || gj.phase !== 'countdown') return;
    const tick = () => {
      setRemaining(Math.max(0, Math.floor((gj.countdownEnd - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gj?.phase, gj?.countdownEnd]);

  if (!gj || gj.phase === 'done' || gj.phase === 'idle') return null;

  const cats = categorizeGrandJuryLogs(state.history);

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col items-center justify-center p-6 overflow-y-auto">
      {gj.phase === 'countdown' && (
        <div className="text-center">
          <div className="text-7xl mb-4">⚖️</div>
          <div className="font-heading text-4xl text-destructive comic-text-stroke mb-4">Η ΔΙΚΗ ΞΕΚΙΝΑΕ</div>
          <div className="font-heading text-8xl text-primary comic-text-stroke comic-pulse">{fmtTime(remaining)}</div>
        </div>
      )}

      {gj.phase === 'logs' && (
        <div className="max-w-4xl w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">⚖️</div>
            <div className="font-heading text-4xl text-destructive comic-text-stroke">ΚΑΤΗΓΟΡΗΤΗΡΙΟ</div>
            <div className="text-sm text-foreground/60 font-body">Τα logs του παιχνιδιού</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {LOG_CATEGORIES.map((c) => {
              const events = cats[c.id] || [];
              return (
                <div key={c.id} className="comic-panel bg-card text-foreground p-4">
                  <div className="font-heading text-xl mb-1 text-primary">{c.label}</div>
                  <div className="text-xs font-bold text-foreground/60 mb-2 font-body">{c.desc}</div>
                  {events.length === 0 ? (
                    <div className="text-xs text-foreground/40 italic font-body">Καθόλου καταγραφές</div>
                  ) : (
                    <div className="space-y-1">
                      {events.map((e, i) => (
                        <div key={i} className="text-sm bg-secondary rounded px-2 py-1 border border-border/10 font-body">
                          {e.player && <span className="font-bold">{e.player}</span>}
                          {e.target && <span> → {e.target}</span>}
                          {e.detail && <span> — {e.detail}</span>}
                          {e.verdict && <span> — {e.verdict === 'guilty' ? 'ΕΝΟΧΗ' : 'ΑΘΩΗ'}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {(gj.manualLogs || []).length > 0 && (
            <div className="comic-panel bg-primary text-tarot-dark p-4 mt-4">
              <div className="font-heading text-lg mb-2">📝 ΧΕΙΡΟΚΙΝΗΤΑ LOGS</div>
              <div className="space-y-1">
                {(gj.manualLogs || []).map((m, i) => (
                  <div key={i} className="text-sm bg-tarot-dark text-foreground rounded px-2 py-1 font-body">{m.text}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {gj.phase === 'voting' && (
        <div className="text-center">
          <div className="text-7xl mb-4">🗳️</div>
          <div className="font-heading text-4xl text-tarot-royal comic-text-stroke mb-4">ΨΗΦΟΦΟΡΙΑ ΣΕ ΕΞΕΛΙΞΗ</div>
          <div className="text-lg text-foreground/80 font-body">Κάθε κινητό ψηφίζει ανώνυμα</div>
          <div className="flex gap-6 justify-center mt-6">
            <div className="comic-panel bg-destructive p-6">
              <div className="font-heading text-xl text-tarot-gold">👑 QUEEN OF SHAME</div>
              <div className="font-heading text-5xl text-foreground">{Object.keys(gj.queenVotes || {}).length}</div>
            </div>
            <div className="comic-panel bg-tarot-forest p-6">
              <div className="font-heading text-xl text-tarot-gold">🏆 CHAMPION</div>
              <div className="font-heading text-5xl text-foreground">{Object.keys(gj.championVotes || {}).length}</div>
            </div>
          </div>
        </div>
      )}

      {gj.phase === 'verdict' && (
        <div className="max-w-3xl w-full text-center">
          <div className="text-6xl mb-4">⚖️</div>
          <div className="font-heading text-5xl text-destructive comic-text-stroke mb-6">ΤΕΛΙΚΟ ΚΑΤΗΓΟΡΗΤΗΡΙΟ</div>
          <div className="grid grid-cols-2 gap-6">
            <div className="comic-panel bg-destructive p-6 comic-pop">
              <div className="text-5xl mb-2">👑</div>
              <div className="font-heading text-xl text-tarot-gold">ΒΑΣΙΛΙΣΣΑ ΤΗΣ ΝΤΡΟΠΗΣ</div>
              <div className="font-heading text-3xl comic-text-stroke text-foreground mt-2">
                {state.players.find((p) => p.id === gj.winners?.queen)?.name || '—'}
              </div>
            </div>
            <div className="comic-panel bg-tarot-forest p-6 comic-pop">
              <div className="text-5xl mb-2">🏆</div>
              <div className="font-heading text-xl text-tarot-gold">ΠΡΩΤΑΘΛΗΤΡΙΑ ΤΩΝ ΜΥΣΤΙΚΩΝ</div>
              <div className="font-heading text-3xl comic-text-stroke text-foreground mt-2">
                {state.players.find((p) => p.id === gj.winners?.champion)?.name || '—'}
              </div>
            </div>
          </div>
          {gj.rewardText && (
            <div className="comic-panel bg-primary text-tarot-dark p-4 mt-6 text-left">
              <div className="font-heading text-lg mb-2 text-center">🎁 ΑΝΤΑΜΟΙΒΗ — DJ SLAVE HOUR</div>
              <div className="text-sm whitespace-pre-wrap font-body">{gj.rewardText}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}