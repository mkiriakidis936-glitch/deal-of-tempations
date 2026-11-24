import React from 'react';
import { Tablet, Tv, Smartphone } from 'lucide-react';
import { modeDisplayName } from '@/data/gameConfig';
import { currentPhase } from '@/data/modes/modeGuide';

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
  { label: 'Tablet', href: '/', icon: Tablet },
  { label: 'TV', href: '/tv', icon: Tv },
  { label: 'Κινητά', href: '/play', icon: Smartphone },
];

function describe(session) {
  const s = session?.state || {};
  const modeId = s.mode || session?.mode || '';
  const mode = modeId ? modeDisplayName(modeId) : '—';
  const players = (s.players || []).length;
  const phase = mode === 'pajama'
    ? `Πράξη ${((s.pajama?.actIndex ?? 0) + 1)}/7 · ${PJ_PHASES[s.pajama?.phase] || 'Στήσιμο'}`
    : (() => { const phase = currentPhase(s); return phase ? `Φάση ${phase.index + 1}/${phase.total} · ${phase.title}` : `Στάδιο ${s.stage ?? 0} · Γύρος ${s.round ?? 1}`; })();
  return { mode, players, phase };
}

export default function AdminSessionBar({ sessions, activeSession, onSelect }) {
  const info = describe(activeSession);
  const hasSessions = sessions.length > 0;

  return (
    <section className="adm-sessionbar" aria-label="Ενεργή συνεδρία">
      <span className="adm-eyebrow">
        <span className={hasSessions ? 'adm-dot' : 'adm-dot adm-dot--off'} aria-hidden="true" />
        Ενεργή συνεδρία
      </span>
      {hasSessions ? (
        <select
          aria-label="Επιλογή ενεργής συνεδρίας"
          value={activeSession?.id || ''}
          onChange={(e) => onSelect(sessions.find((s) => s.id === e.target.value) || null)}
          className="px-3 text-xs font-semibold max-w-full w-full sm:w-auto sm:min-w-[260px]"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.sessionCode} · {modeDisplayName(s.state?.mode || s.mode)} · {s.state?.players?.length || 0} παίκτριες
            </option>
          ))}
        </select>
      ) : (
        <span className="text-xs text-foreground/60">Καμία — ξεκίνα από το tablet</span>
      )}
      {hasSessions && (
        <span className="text-[11.5px] text-foreground/70">
          {info.mode} · {info.phase} · {info.players} παίκτριες
        </span>
      )}
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <a
              key={l.href}
              href={activeSession?.sessionCode ? `${l.href}?code=${activeSession.sessionCode}` : l.href}
              target="_blank"
              rel="noreferrer"
              className="adm-chip"
            >
              <Icon aria-hidden="true" />
              {l.label}
            </a>
          );
        })}
      </div>
    </section>
  );
}
