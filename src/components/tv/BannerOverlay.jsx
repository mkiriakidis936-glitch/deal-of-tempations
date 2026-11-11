import React from 'react';

// Non-disruptive banner overlay for TV — shows queued announcements without taking over the full screen.
export default function BannerOverlay({ state }) {
  const queue = state.eventQueue;
  if (!queue?.active || queue.currentIndex == null) return null;
  const item = queue.items?.[queue.currentIndex];
  if (!item) return null;

  const styles = {
    announcement: 'border-primary/30',
    news: 'border-destructive/35',
    reveal: 'border-primary/45',
  };

  const accents = {
    announcement: 'text-primary',
    news: 'text-destructive',
    reveal: 'text-primary',
  };
  const accent = accents[item.type] || accents.announcement;

  return (
    <div className="comic-slide-in fixed left-1/2 top-16 z-[48] w-full max-w-2xl -translate-x-1/2 px-4">
      <div className={`rounded-lg border bg-surface-2/95 p-4 shadow-panel backdrop-blur ${styles[item.type] || styles.announcement}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl opacity-80">{item.icon || '📢'}</span>
          <div className="flex-1 min-w-0">
            {item.title && (
              <div className={`font-heading text-lg tracking-[0.02em] ${accent}`}>{item.title}</div>
            )}
            {item.body && (
              <div className="mt-1 font-body text-sm text-foreground/75">{item.body}</div>
            )}
          </div>
          {queue.items.length > 1 && (
            <div className="ds-value text-[10px] text-foreground/40">
              {queue.currentIndex + 1}/{queue.items.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}