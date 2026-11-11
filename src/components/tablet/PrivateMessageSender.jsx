import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

export default function PrivateMessageSender({ state, updateState, onClose }) {
  const players = state.players || [];
  const [selectedIds, setSelectedIds] = useState([]);
  const [text, setText] = useState('');

  function togglePlayer(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function send() {
    if (!text.trim() || selectedIds.length === 0) return;
    const messages = { ...(state.privateMessages || {}) };
    const msg = {
      id: `msg_${Date.now()}`,
      text: text.trim(),
      timestamp: Date.now(),
      from: 'GM',
      read: false,
    };
    selectedIds.forEach((pid) => {
      messages[pid] = [...(messages[pid] || []), { ...msg }];
    });
    await updateState({ privateMessages: messages });
    setText('');
    setSelectedIds([]);
  }

  function selectAll() {
    setSelectedIds(players.map((p) => p.id));
  }

  return (
    <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-3 max-h-[85vh] overflow-y-auto">
        <ComicPanel className="bg-tarot-royal text-center py-4">
          <div className="font-heading text-3xl comic-text-stroke text-tarot-gold">Ψίθυρος</div>
          <div className="text-sm font-bold text-foreground/80 font-body">Ιδιωτικά μηνύματα σε παίκτριες</div>
        </ComicPanel>

        <ComicPanel className="bg-card">
          <div className="flex justify-between items-center mb-2">
            <div className="font-heading text-lg text-primary">👥 Παραλήπτριες</div>
            <ComicButton variant="dark" size="sm" onClick={selectAll}>ΌΛΕΣ</ComicButton>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlayer(p.id)}
                className={`comic-panel-sm p-2 text-left flex items-center gap-2 transition-all ${
                  selectedIds.includes(p.id) ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'
                }`}
              >
                <span className="font-heading text-foreground">{p.name}</span>
                {selectedIds.includes(p.id) && <span className="text-primary ml-auto">✓</span>}
              </button>
            ))}
          </div>
        </ComicPanel>

        <ComicPanel className="bg-card">
          <div className="font-heading text-lg mb-2 text-primary"> Μήνυμα</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Γράψε το κρυφό μήνυμα..."
            rows={3}
            className="cinp w-full"
          />
          <ComicButton
            variant="purple"
            size="lg"
            onClick={send}
            disabled={!text.trim() || selectedIds.length === 0}
            className="w-full mt-2"
          >
             ΑΠΟΣΤΟΛΗ ({selectedIds.length})
          </ComicButton>
        </ComicPanel>

        <ComicButton variant="red" size="sm" onClick={onClose} className="w-full">✕ ΚΛΕΙΣΙΜΟ</ComicButton>
      </div>
    </div>
  );
}