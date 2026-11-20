import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

export default function NewsControl({ state, updateState, onClose }) {
  const [detail, setDetail] = useState('');

  async function publish() {
    const message = detail.trim();
    if (!message) return;
    await updateState({
      history: [
        { type: 'breaking_news', detail: message, timestamp: Date.now() },
        ...(state.history || []),
      ].slice(0, 50),
    });
    onClose?.();
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-background/90 p-4">
      <ComicPanel className="w-full max-w-xl space-y-3 bg-card">
        <div className="font-heading text-2xl text-primary">📡 ΕΚΤΑΚΤΟ ΔΕΛΤΙΟ · TV</div>
        <p className="text-sm text-foreground/65">Η ανακοίνωση θα εμφανιστεί αμέσως στην τηλεόραση και στην κάτω ζωντανή ροή.</p>
        <textarea
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          rows={4}
          maxLength={240}
          placeholder="Γράψε την ανακοίνωση..."
          className="w-full rounded-lg border-2 border-border bg-background p-3 text-foreground"
        />
        <div className="text-right text-xs text-foreground/45">{detail.length}/240</div>
        <div className="flex flex-wrap justify-end gap-2">
          <ComicButton variant="dark" onClick={onClose}>ΚΛΕΙΣΙΜΟ</ComicButton>
          <ComicButton variant="magenta" onClick={publish} disabled={!detail.trim()}>ΑΠΟΣΤΟΛΗ ΣΤΗΝ TV</ComicButton>
        </div>
      </ComicPanel>
    </div>
  );
}
