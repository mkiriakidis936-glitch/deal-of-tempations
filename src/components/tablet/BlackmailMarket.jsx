import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { addHistory } from '@/lib/gameLogic';

// Αγορά σιωπής: μια παίκτρια ξοδεύει tokens για να εξαγοράσει μια confession.
export default function BlackmailMarket({ state, updateState, onClose }) {
  const players = (state.players || []).filter((p) => p.name);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerId, setPlayerId] = useState(players[0]?.id || null);
  const [busyId, setBusyId] = useState(null);

  const buyer = players.find((p) => p.id === playerId);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.BlackmailVault.filter(
          { sessionCode: state.sessionCode, redeemed: false },
          { sort: '-created_date', limit: 50 }
        );
        setEntries(items || []);
      } catch (e) { /* ignore */ }
      setLoading(false);
    })();
  }, [state.sessionCode]);

  async function buySilence(entry) {
    if (!buyer) return;
    const cost = entry.tokenCost || 100;
    if ((buyer.tokens || 0) < cost) return;
    setBusyId(entry.id);
    try {
      await base44.entities.BlackmailVault.update(entry.id, { redeemed: true, heldBy: buyer.name });
      const updatedPlayers = state.players.map((p) => (p.id === buyer.id ? { ...p, tokens: (p.tokens || 0) - cost } : p));
      const history = addHistory({ ...state, players: updatedPlayers }, {
        type: 'blackmail_buy',
        detail: `${buyer.name} εξαγόρασε σιωπή για «${entry.playerName}» (-${cost} 🎟️)`,
      });
      await updateState({ players: updatedPlayers, history });
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-lg space-y-3 overflow-y-auto">
        <div className="comic-panel ds-sheen px-5 py-4">
          <div className="ds-eyebrow text-primary/80">Αγορά</div>
          <div className="ds-title mt-1 text-2xl text-foreground">Παζάρι Εκβιασμού</div>
          <div className="ds-label mt-2">Αγόρασε σιωπή με tokens</div>
        </div>

        <ComicPanel>
          <div className="ds-label mb-2">Αγοράστρια</div>
          <div className="grid grid-cols-2 gap-1.5">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlayerId(p.id)}
                className={`comic-panel-sm flex items-center justify-between p-2 text-left ${playerId === p.id ? 'border-primary/40 bg-primary/12' : ''}`}
              >
                <span className="font-bold text-xs">{p.name}</span>
                <span className="text-[11px]">🎟️ {p.tokens || 0}</span>
              </button>
            ))}
          </div>
        </ComicPanel>

        <ComicPanel>
          <div className="ds-label mb-2 text-primary/80">Διαθέσιμα μυστικά</div>
          {loading ? (
            <div className="text-xs text-foreground/60 font-body">Φόρτωση...</div>
          ) : entries.length === 0 ? (
            <div className="text-xs text-foreground/60 font-body">Δεν υπάρχουν ενεργά μυστικά για αυτή τη σύνοδο.</div>
          ) : (
            <div className="space-y-1.5">
              {entries.map((entry) => {
                const cost = entry.tokenCost || 100;
                const can = (buyer?.tokens || 0) >= cost;
                return (
                  <div key={entry.id} className="comic-panel-sm p-2 bg-secondary">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading text-sm">{entry.playerName}</span>
                      <span className="text-[11px] font-bold text-tarot-gold">🪙 {cost}</span>
                    </div>
                    <p className="text-[11px] text-foreground/70 font-body mb-2 line-clamp-2">{entry.confession}</p>
                    <ComicButton
                      variant={can ? 'green' : 'dark'}
                      size="sm"
                      className="w-full"
                      disabled={!can || busyId === entry.id}
                      onClick={() => buySilence(entry)}
                    >
                      {busyId === entry.id ? '...' : can ? '🔒 ΕΞΑΓΟΡΑ ΣΙΩΠΗΣ' : 'ΔΕΝ ΕΠΑΡΚΟΥΝ TOKENS'}
                    </ComicButton>
                  </div>
                );
              })}
            </div>
          )}
        </ComicPanel>

        <ComicButton variant="red" size="sm" className="w-full" onClick={onClose}>✕ ΚΛΕΙΣΙΜΟ</ComicButton>
      </div>
    </div>
  );
}