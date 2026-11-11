import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

export default function EventQueue({ state, updateState, onClose }) {
  const queue = state.eventQueue || { items: [], currentIndex: 0, active: false };
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('announcement');

  async function addItem() {
    if (!title.trim() && !body.trim()) return;
    const item = {
      id: `q_${Date.now()}`,
      type,
      title: title.trim(),
      body: body.trim(),
      icon: type === 'news' ? '📡' : type === 'reveal' ? '✨' : '📢',
    };
    await updateState({
      eventQueue: { ...queue, items: [...(queue.items || []), item] },
    });
    setTitle('');
    setBody('');
  }

  async function playQueue() {
    if (!queue.items?.length) return;
    await updateState({ eventQueue: { ...queue, active: true, currentIndex: 0 } });
  }

  async function nextItem() {
    const next = (queue.currentIndex || 0) + 1;
    if (next >= queue.items.length) {
      await updateState({ eventQueue: { ...queue, active: false, currentIndex: 0 } });
    } else {
      await updateState({ eventQueue: { ...queue, currentIndex: next } });
    }
  }

  async function removeItem(id) {
    await updateState({
      eventQueue: { ...queue, items: queue.items.filter((i) => i.id !== id) },
    });
  }

  async function clearAll() {
    await updateState({ eventQueue: { items: [], currentIndex: 0, active: false } });
  }

  return (
    <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-3 max-h-[85vh] overflow-y-auto">
        <div className="comic-panel ds-sheen px-5 py-4">
          <div className="ds-eyebrow text-primary/80">Προβολή</div>
          <div className="ds-title mt-1 text-2xl text-foreground">Ουρά ανακοινώσεων</div>
          <div className="ds-label mt-2">Παίζονται ως banner στην TV</div>
        </div>

        {/* Add item */}
        <ComicPanel>
          <div className="ds-label mb-2 text-primary/80">Νέα ανακοίνωση</div>
          <div className="flex gap-1 mb-2">
            {[
              { id: 'announcement', label: '📢 Ανακοίνωση' },
              { id: 'news', label: '📡 Breaking News' },
              { id: 'reveal', label: '✨ Reveal' },
            ].map((t) => (
              <ComicButton
                key={t.id}
                variant={type === t.id ? 'magenta' : 'dark'}
                size="sm"
                onClick={() => setType(t.id)}
              >
                {t.label}
              </ComicButton>
            ))}
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Τίτλος"
            className="mb-2 w-full rounded-md border border-primary/20 bg-input px-3 py-2 font-ui text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Κείμενο"
            rows={2}
            className="mb-2 w-full rounded-md border border-primary/20 bg-input px-3 py-2 font-ui text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none"
          />
          <ComicButton variant="green" size="sm" onClick={addItem} disabled={!title.trim() && !body.trim()} className="w-full">
            ➕ ΠΡΟΣΘΗΚΗ
          </ComicButton>
        </ComicPanel>

        {/* Queue list */}
        {queue.items?.length > 0 && (
          <ComicPanel>
            <div className="ds-label mb-2 text-primary/80">Ουρά · {queue.items.length}</div>
            <div className="space-y-1 mb-2">
              {queue.items.map((item, i) => (
                <div key={item.id} className={`comic-panel-sm p-2 flex items-center gap-2 ${queue.active && queue.currentIndex === i ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'}`}>
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">{item.title || item.body}</div>
                  </div>
                  {queue.active && queue.currentIndex === i && (
                    <span className="text-xs text-primary font-bold comic-pulse">▶ ΠΑΙΖΕΙ</span>
                  )}
                  <button onClick={() => removeItem(item.id)} className="text-xs text-foreground/50 hover:text-foreground">✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {!queue.active ? (
                <ComicButton variant="yellow" size="sm" onClick={playQueue} className="flex-1">▶ ΠΑΙΞΕ</ComicButton>
              ) : (
                <ComicButton variant="green" size="sm" onClick={nextItem} className="flex-1">⏭ ΕΠΟΜΕΝΟ</ComicButton>
              )}
              <ComicButton variant="red" size="sm" onClick={clearAll}>🗑️</ComicButton>
            </div>
          </ComicPanel>
        )}

        <ComicButton variant="red" size="sm" onClick={onClose} className="w-full">✕ ΚΛΕΙΣΙΜΟ</ComicButton>
      </div>
    </div>
  );
}