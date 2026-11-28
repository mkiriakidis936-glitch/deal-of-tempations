import React from 'react';

// Μικρά κομμάτια «game UI» μόνο για το Admin (εμφάνιση· καμία ενέργεια ή αλλαγή δεδομένων).

// Σταθερό χρώμα ανά όνομα: ίδιο κάθε φορά, ώστε η ίδια παίκτρια να αναγνωρίζεται σε όλες τις λίστες.
const AVATAR_COLORS = ['#E8C26B', '#FF9F0A', '#64D2FF', '#BF5AF2', '#FF6482', '#30D158', '#5E5CE6', '#FFD60A'];
const hash = (value) => [...String(value || '?')].reduce((h, ch) => ((h * 31) + ch.codePointAt(0)) >>> 0, 7);
export const avatarColor = (seed) => AVATAR_COLORS[hash(seed) % AVATAR_COLORS.length];
export const initialsOf = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : [...parts[0]].slice(0, 2).join('')).toUpperCase();
};

export function AdminAvatar({ name, seed, size = 36, online, className = '' }) {
  const color = avatarColor(seed || name);
  return (
    <span className={`adm-avatar ${className}`} style={{ '--av': color, width: size, height: size, fontSize: Math.round(size * 0.38) }} aria-hidden="true">
      {initialsOf(name)}
      {online !== undefined && <span className={`adm-avatar-dot ${online ? 'is-on' : ''}`} />}
    </span>
  );
}

const TONE = {
  ready: { label: 'ΕΤΟΙΜΟ ΓΙΑ ΒΡΑΔΙΑ', color: '#30D158' },
  almost: { label: 'ΣΧΕΔΟΝ ΕΤΟΙΜΟ', color: '#E8C26B' },
  notyet: { label: 'ΧΡΕΙΑΖΕΤΑΙ ΔΟΥΛΕΙΑ', color: '#FF9F0A' },
};

export function ReadinessRing({ score, tone, size = 132 }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = TONE[tone]?.color || '#E8C26B';
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`Ετοιμότητα ${score}%`} className="adm-ring">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${(c * score) / 100} ${c}`} transform="rotate(-90 60 60)" />
      <text x="60" y="58" textAnchor="middle" fontSize="30" fontWeight="800" fill="#F5F1E8" fontFamily="inherit">{score}%</text>
      <text x="60" y="78" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgba(245,241,232,.55)" letterSpacing="1.5">ΕΤΟΙΜΟΤΗΤΑ</text>
    </svg>
  );
}

const STATUS = {
  ok: { icon: '✓', label: 'Έτοιμο' },
  todo: { icon: '!', label: 'Εκκρεμεί' },
  unknown: { icon: '?', label: 'Άγνωστο' },
};

export function AdminReadiness({ readiness, onNavigate = () => {} }) {
  const { score, tone, items, todo, session } = readiness;
  const meta = TONE[tone] || TONE.notyet;
  return (
    <section className="adm-card adm-ready" style={{ '--ready': meta.color }}>
      <div className="adm-ready-head">
        <ReadinessRing score={score} tone={tone} />
        <div className="min-w-0 flex-1">
          <div className="adm-ready-badge">{meta.label}</div>
          <div className="adm-card-title mt-2">Έτοιμο για βραδιά</div>
          <p className="mt-1 text-sm text-foreground/60">
            {todo.length === 0 ? 'Όλοι οι έλεγχοι είναι εντάξει. Καλή εκπομπή!' : `${todo.length} ${todo.length === 1 ? 'πράγμα θέλει' : 'πράγματα θέλουν'} προσοχή πριν ανοίξει η TV.`}
            {session?.sessionCode ? ` Παρτίδα ${session.sessionCode}.` : ''}
          </p>
          <div className="adm-ready-bar" aria-hidden="true"><span style={{ width: `${score}%` }} /></div>
        </div>
      </div>
      <ul className="adm-ready-list">
        {items.map((item) => (
          <li key={item.id} className={`adm-ready-row is-${item.status}`}>
            <span className="adm-ready-icon" aria-label={STATUS[item.status].label}>{STATUS[item.status].icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{item.label}</span>
              <span className="block truncate text-xs text-foreground/55">{item.detail}</span>
            </span>
            <span className="adm-ready-weight">{item.weight}%</span>
            {item.status !== 'ok' && (
              <button type="button" className="adm-ready-fix" onClick={() => onNavigate(item.tab)}>Φτιάξ' το →</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
