import React, { useEffect } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';

export default function PrivateMessages({ state, updateState, selectedPlayerId }) {
  const messages = (state.privateMessages?.[selectedPlayerId] || []).filter((m) => !m.dismissed);

  // Auto-mark as read when viewed
  useEffect(() => {
    const unread = messages.filter((m) => !m.read);
    if (unread.length === 0) return;
    const all = { ...(state.privateMessages || {}) };
    all[selectedPlayerId] = (all[selectedPlayerId] || []).map((m) => ({ ...m, read: true }));
    updateState({ privateMessages: all });
  }, [selectedPlayerId]);

  async function dismiss(id) {
    const all = { ...(state.privateMessages || {}) };
    all[selectedPlayerId] = (all[selectedPlayerId] || []).map((m) =>
      m.id === id ? { ...m, dismissed: true } : m
    );
    await updateState({ privateMessages: all });
  }

  if (messages.length === 0) {
    return (
      <ComicPanel className="bg-card text-center py-4">
        <div className="text-3xl mb-1"> </div>
        <div className="text-sm text-foreground/50 font-body">Δεν υπάρχουν ιδιωτικά μηνύματα</div>
      </ComicPanel>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((m) => (
        <ComicPanel key={m.id} className="bg-tarot-royal/40 comic-pop">
          <div className="flex items-start gap-2">
            <span className="text-2xl"> </span>
            <div className="flex-1">
              <div className="text-xs font-bold text-primary mb-1"> ΙDIΩTIKO MNHMA</div>
              <p className="text-sm text-foreground font-body">{m.text}</p>
            </div>
            <button
              onClick={() => dismiss(m.id)}
              className="text-xs text-foreground/50 hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </ComicPanel>
      ))}
    </div>
  );
}