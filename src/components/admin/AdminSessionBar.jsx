import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';

const PJ_PHASES = {
  setup: 'Στήσιμο',
  'act-intro': 'Έναρξη πράξης',
  dashboard: 'Ταμπλό',
  wheel: 'Τροχός',
  confessions: 'Εξομολογήσεις',
  morning: 'Πρωινό',
  gift: 'Δώρο',
  finale: 'Φινάλε',
  'act-break': 'Διάλειμμα',
  sleep: 'Ύπνος',
};

const LINKS = [
  { label: '📱 Tablet', href: '/' },
  { label: '📺 TV', href: '/tv' },
  { label: '📲 Κινητά', href: '/play' },
];

function describe(session) {
  const s = session?.state || {};
  const mode = s.mode || session?.mode || '—';
  const players = (s.players || []).length;
  const phase = mode === 'pajama'
    ? `Πράξη ${((s.pajama?.actIndex ?? 0) + 1)}/7 · ${PJ_PHASES[s.pajama?.phase] || 'Στήσιμο'}`
    : `Stage ${s.stage ?? 0} · Γύρος ${s.round ?? 1}`;
  return { mode, players, phase };
}

export default function AdminSessionBar({ sessions, activeSession, onSelect }) {
  const info = describe(activeSession);

  return (
    <ComicPanel className="bg-secondary flex flex-wrap items-center justify-between gap-2 py-2">
      <div className="flex flex-wrap items-center gap-2 min-w-0 w-full">
        <span className="font-heading text-xs text-primary">ΕΝΕΡΓΗ ΣΥΝΕΔΡΙΑ</span>
        {sessions.length > 0 ? (
          <select
            value={activeSession?.id || ''}
            onChange={(e) => onSelect(sessions.find((s) => s.id === e.target.value) || null)}
            className="px-2 py-2 rounded-lg border-2 border-border bg-background text-foreground font-bold text-xs max-w-full w-full sm:w-auto"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sessionCode} · {s.mode} · {s.state?.players?.length || 0} παίκτριες
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-foreground/60 font-body">καμία — ξεκίνα από το Tablet</span>
        )}
        {info && (
          <span className="text-[11px] font-body text-foreground/70">
            {info.mode} · {info.phase} · 👥 {info.players}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={activeSession?.sessionCode ? `${l.href}?code=${activeSession.sessionCode}` : l.href}
            target="_blank"
            rel="noreferrer"
            className="px-2 py-1 rounded-lg border-2 border-border/50 bg-card text-[11px] font-bold hover:bg-primary hover:text-tarot-dark"
          >
            {l.label}
          </a>
        ))}
      </div>
    </ComicPanel>
  );
}