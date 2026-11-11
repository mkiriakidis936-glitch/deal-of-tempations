import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { addHistory, categorizeGrandJuryLogs } from '@/lib/gameLogic';

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

export default function GrandJuryControl({ state, updateState, onClose }) {
  const gj = state.grandJury;
  const [minutes, setMinutes] = useState(60);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!gj || gj.phase !== 'countdown') return;
    const tick = () => {
      const r = Math.max(0, Math.floor((gj.countdownEnd - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) {
        updateState({ grandJury: { ...gj, phase: 'logs' } });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gj?.phase, gj?.countdownEnd]);

  async function startCountdown() {
    let reward = '';
    try {
      const { items } = await base44.entities.GameContent.filter({ category: 'grand_jury_rewards' }, { limit: 1 });
      if (items?.length) reward = items[0].data?.text || '';
    } catch (e) { /* ignore */ }
    const duration = minutes * 60;
    await updateState({
      grandJury: {
        phase: 'countdown',
        countdownEnd: Date.now() + duration * 1000,
        countdownDuration: duration,
        queenVotes: {},
        championVotes: {},
        winners: {},
        rewardText: reward,
        manualLogs: [],
      },
    });
  }

  function proceedToLogs() {
    updateState({ grandJury: { ...gj, phase: 'logs' } });
  }

  function startVoting() {
    updateState({ grandJury: { ...gj, phase: 'voting', queenVotes: {}, championVotes: {} } });
  }

  async function revealVerdict() {
    const queenVotes = gj.queenVotes || {};
    const championVotes = gj.championVotes || {};
    const tally = (votes) => {
      const counts = {};
      Object.values(votes).forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
      let winner = null, max = -1;
      Object.entries(counts).forEach(([id, c]) => {
        if (c > max) { winner = id; max = c; }
      });
      return winner;
    };
    const queenId = tally(queenVotes);
    const championId = tally(championVotes);
    const queen = state.players.find((p) => p.id === queenId);
    const champion = state.players.find((p) => p.id === championId);
    const history = addHistory(state, { type: 'grand_jury_verdict', queen: queen?.name, champion: champion?.name });
    await updateState({
      grandJury: { ...gj, phase: 'verdict', winners: { queen: queenId, champion: championId } },
      history,
    });
  }

  function handleClose() {
    updateState({ grandJury: null });
    onClose();
  }

  const cats = categorizeGrandJuryLogs(state.history);
  const manualLogs = gj?.manualLogs || [];

  if (!gj || gj.phase === 'idle' || gj.phase === 'done') {
    return (
      <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4" onClick={handleClose}>
        <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-3">
          <ComicPanel className="bg-tarot-crimson text-foreground text-center py-6">
            <div className="text-5xl mb-2">⚖️</div>
            <div className="font-heading text-3xl comic-text-stroke text-tarot-gold">Η ΜΕΓΑΛΗ ΕΠΙΤΡΟΠΗ</div>
            <div className="text-sm mt-1 text-foreground/80 font-body">Η Τελική Δίκη — 1 ώρα πριν το Grand Finale</div>
          </ComicPanel>
          <ComicPanel className="bg-card">
            <div className="text-sm mb-3 text-foreground font-body">
              Η TV μετατρέπεται σε Δικαστήριο. Προβάλλονται τα logs, η παρέα ψηφίζει ανώνυμα
              Queen of Shame & Champion of Secrets, και ανακοινώνονται οι 2 νικήτριες.
            </div>
            <label className="text-xs font-bold block mb-1 text-foreground font-body">Λεπτά Αντίστροφης Μέτρησης</label>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="number" min="1" max="180" value={minutes}
                onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))}
                className="w-24 border-2 border-border rounded px-2 py-1 text-lg font-bold text-center bg-background text-foreground font-body"
              />
              <span className="text-sm font-bold text-foreground font-body">λεπτά</span>
            </div>
            <ComicButton variant="red" size="lg" onClick={startCountdown} className="w-full">
              ⚖️ ΕΝΕΡΓΟΠΟΙΗΣΗ ΔΙΚΗΣ
            </ComicButton>
          </ComicPanel>
          <ComicButton variant="red" size="sm" onClick={handleClose} className="w-full">✕ ΚΛΕΙΣΙΜΟ</ComicButton>
        </div>
      </div>
    );
  }

  if (gj.phase === 'countdown') {
    return (
      <div className="fixed inset-0 z-[70] bg-background/90 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-3">
          <ComicPanel className="bg-tarot-crimson text-foreground text-center py-6 comic-pulse">
            <div className="text-5xl mb-2">⚖️</div>
            <div className="font-heading text-2xl comic-text-stroke text-tarot-gold">Η ΔΙΚΗ ΞΕΚΙΝΑΕ</div>
            <div className="font-heading text-6xl comic-text-stroke text-tarot-gold mt-3">{fmtTime(remaining)}</div>
            <div className="text-sm mt-2 text-foreground/80 font-body">Η TV δείχνει την αντίστροφη μέτρηση</div>
          </ComicPanel>
          <ComicButton variant="yellow" size="lg" onClick={proceedToLogs} className="w-full">
            ⏭️ ΠΡΟΧΩΡΑ ΣΤΗ ΔΙΚΗ
          </ComicButton>
          <ComicButton variant="red" size="sm" onClick={handleClose} className="w-full">✕ ΑΚΥΡΩΣΗ</ComicButton>
        </div>
      </div>
    );
  }

  if (gj.phase === 'logs') {
    return (
      <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-3 max-h-[85vh] overflow-y-auto">
          <ComicPanel className="bg-tarot-crimson text-foreground text-center py-4">
            <div className="font-heading text-2xl comic-text-stroke text-tarot-gold">📜 ΚΑΤΗΓΟΡΗΤΗΡΙΟ</div>
            <div className="text-xs text-foreground/80 font-body">Η TV προβάλλει τα logs</div>
          </ComicPanel>
          {LOG_CATEGORIES.map((c) => {
            const events = cats[c.id] || [];
            return (
              <ComicPanel key={c.id} className="bg-card">
                <div className="font-heading text-lg text-primary">{c.label} — {c.desc}</div>
                {events.length === 0 ? (
                  <div className="text-xs text-foreground/40 italic mt-1 font-body">Καθόλου καταγραφές</div>
                ) : (
                  <div className="space-y-1 mt-2">
                    {events.map((e, i) => (
                      <div key={i} className="text-sm comic-panel-sm p-2 bg-secondary text-foreground font-body">
                        {e.player ? <span className="font-bold">{e.player}</span> : null}
                        {e.target ? <span> → {e.target}</span> : null}
                        {e.detail ? <span> — {e.detail}</span> : null}
                        {e.verdict ? <span> — {e.verdict === 'guilty' ? 'ΕΝΟΧΗ' : 'ΑΘΩΗ'}</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </ComicPanel>
            );
          })}
          {manualLogs.length > 0 && (
            <ComicPanel className="bg-primary/20">
              <div className="font-heading text-lg text-primary">📝 ΧΕΙΡΟΚΙΝΗΤΑ LOGS</div>
              <div className="space-y-1 mt-2">
                {manualLogs.map((m, i) => (
                  <div key={i} className="text-sm comic-panel-sm p-2 bg-card text-foreground font-body">{m.text}</div>
                ))}
              </div>
            </ComicPanel>
          )}
          <ComicButton variant="magenta" size="lg" onClick={startVoting} className="w-full">
            🗳️ ΠΡΟΧΩΡΑ ΣΕ ΨΗΦΟΦΟΡΙΑ
          </ComicButton>
          <ComicButton variant="red" size="sm" onClick={handleClose} className="w-full">✕ ΑΚΥΡΩΣΗ</ComicButton>
        </div>
      </div>
    );
  }

  if (gj.phase === 'voting') {
    const queenCount = Object.keys(gj.queenVotes || {}).length;
    const championCount = Object.keys(gj.championVotes || {}).length;
    const total = (state.players || []).length;
    return (
      <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-3">
          <ComicPanel className="bg-tarot-royal text-foreground text-center py-4">
            <div className="font-heading text-2xl comic-text-stroke text-tarot-gold">🗳️ ΑΝΩΝΥΜΗ ΨΗΦΟΦΟΡΙΑ</div>
            <div className="text-xs text-foreground/80 font-body">Κάθε κινητό ψηφίζει Queen & Champion</div>
          </ComicPanel>
          <div className="grid grid-cols-2 gap-3">
            <ComicPanel className="bg-destructive/30 text-center">
              <div className="font-heading text-sm text-primary">👑 QUEEN OF SHAME</div>
              <div className="font-heading text-3xl text-foreground">{queenCount}/{total}</div>
            </ComicPanel>
            <ComicPanel className="bg-tarot-forest/30 text-center">
              <div className="font-heading text-sm text-primary">🏆 CHAMPION OF SECRETS</div>
              <div className="font-heading text-3xl text-foreground">{championCount}/{total}</div>
            </ComicPanel>
          </div>
          <ComicButton variant="yellow" size="lg" onClick={revealVerdict} className="w-full" disabled={queenCount === 0 && championCount === 0}>
            ⚖️ ΑΝΑΚΟΙΝΩΣΗ ΝΙΚΗΤΡΙΩΝ
          </ComicButton>
          <ComicButton variant="red" size="sm" onClick={handleClose} className="w-full">✕ ΑΚΥΡΩΣΗ</ComicButton>
        </div>
      </div>
    );
  }

  if (gj.phase === 'verdict') {
    const queen = state.players.find((p) => p.id === gj.winners?.queen);
    const champion = state.players.find((p) => p.id === gj.winners?.champion);
    return (
      <div className="fixed inset-0 z-[70] bg-background/90 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-3 max-h-[85vh] overflow-y-auto">
          <ComicPanel className="bg-tarot-crimson text-foreground text-center py-6 comic-pop">
            <div className="text-5xl mb-2">⚖️</div>
            <div className="font-heading text-3xl comic-text-stroke text-tarot-gold">ΤΕΛΙΚΟ ΚΑΤΗΓΟΡΗΤΗΡΙΟ</div>
          </ComicPanel>
          <ComicPanel className="bg-destructive text-foreground text-center py-4 comic-pop">
            <div className="text-4xl mb-1">👑</div>
            <div className="font-heading text-xl text-tarot-gold">ΒΑΣΙΛΙΣΣΑ ΤΗΣ ΝΤΡΟΠΗΣ</div>
            <div className="font-heading text-3xl comic-text-stroke text-tarot-gold">{queen?.name || '—'}</div>
            <div className="text-sm mt-1 text-foreground/80 font-body">Δέχεται την τελική μεγάλη ποινή!</div>
          </ComicPanel>
          <ComicPanel className="bg-tarot-forest text-foreground text-center py-4 comic-pop">
            <div className="text-4xl mb-1">🏆</div>
            <div className="font-heading text-xl text-tarot-gold">ΠΡΩΤΑΘΛΗΤΡΙΑ ΤΩΝ ΜΥΣΤΙΚΩΝ</div>
            <div className="font-heading text-3xl comic-text-stroke text-tarot-gold">{champion?.name || '—'}</div>
            <div className="text-sm mt-1 text-foreground/80 font-body">Κερδίζει την επιβράβευση!</div>
          </ComicPanel>
          {gj.rewardText && (
            <ComicPanel className="bg-primary">
              <div className="font-heading text-lg mb-2 text-center text-tarot-dark">🎁 ΑΝΤΑΜΟΙΒΗ — DJ SLAVE HOUR</div>
              <div className="text-sm whitespace-pre-wrap text-tarot-dark font-body">{gj.rewardText}</div>
            </ComicPanel>
          )}
          <ComicButton variant="dark" size="lg" onClick={handleClose} className="w-full">✅ ΕΠΙΣΤΡΟΦΗ</ComicButton>
        </div>
      </div>
    );
  }

  return null;
}