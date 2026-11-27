import React from 'react';
import { createPortal } from 'react-dom';

// Ενιαία κομμάτια διεπαφής (iOS 27 · μαύρο & χρυσό). Όλες οι νέες οθόνες χτίζονται από εδώ.
const cx = (...parts) => parts.filter(Boolean).join(' ');

export function Page({ center = false, className = '', children }) {
  return <div className={cx('ui-page', center && 'ui-page--center', className)}><div className="ui-stack">{children}</div></div>;
}

export function Header({ eyebrow, title, subtitle, gold = false, right }) {
  return (
    <header className="flex items-start justify-between gap-3 px-1">
      <div className="min-w-0">
        {eyebrow && <div className="ui-eyebrow">{eyebrow}</div>}
        <h1 className={cx('ui-title', gold && 'ui-title--gold')}>{title}</h1>
        {subtitle && <p className="ui-subtitle mt-1">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function Section({ title, children }) {
  return (
    <section className="space-y-2">
      {title && <div className="ui-section-title">{title}</div>}
      {children}
    </section>
  );
}

export function Card({ tone, flush = false, className = '', children, ...props }) {
  return <div className={cx('ui-card', tone && `ui-card--${tone}`, flush && 'ui-card--flush', className)} {...props}>{children}</div>;
}

export function Button({ variant, block = false, size, className = '', children, ...props }) {
  return (
    <button type="button" className={cx('ui-btn', variant && `ui-btn--${variant}`, block && 'ui-btn--block', size === 'xl' && 'ui-btn--xl', className)} {...props}>
      {children}
    </button>
  );
}

export const ButtonRow = ({ children }) => <div className="ui-btn-row">{children}</div>;

export function List({ children }) {
  return <div className="ui-list">{children}</div>;
}

export function Row({ title, value, left, onClick, children }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} className={cx('ui-row', onClick && 'ui-row--button')}>
      {left}
      <span className="ui-row__title">{title}</span>
      {value !== undefined && <span className="ui-row__value">{value}</span>}
      {children}
    </Tag>
  );
}

export function Stats({ items }) {
  return (
    <div className="ui-stats">
      {items.map((item) => (
        <div key={item.label} className="ui-stat">
          <div className="ui-stat__label">{item.label}</div>
          <div className={cx('ui-stat__value', item.gold && 'ui-stat__value--gold', item.small && 'ui-stat__value--sm')}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export function Badge({ tone, children }) {
  return <span className={cx('ui-badge', tone && `ui-badge--${tone}`)}>{children}</span>;
}

export function Avatar({ name, size = 44 }) {
  return <span className="ui-avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>{String(name || '?').trim().charAt(0).toUpperCase()}</span>;
}

export const Input = React.forwardRef(function Input({ code = false, className = '', ...props }, ref) {
  return <input ref={ref} className={cx('ui-input', code && 'ui-input--code', className)} {...props} />;
});

export function SafetyBar({ safeWord, onStop, stopped, children }) {
  return (
    <div className="ui-safety-bar">
      {children}
      {safeWord && <div className="ui-safety-bar__word">Λέξη ασφαλείας: <b>{safeWord}</b></div>}
      <Button variant="danger" block onClick={onStop} disabled={stopped}>{stopped ? '⏸ Όλα σταμάτησαν' : '⏹ ΣΤΟΠ — δεν είμαι καλά'}</Button>
    </div>
  );
}

// ---------- TV ----------
export function TvScreen({ className = '', style, children }) {
  return <div className={cx('ui-tv ui-tv-stack', className)} style={style}>{children}</div>;
}

export function TvBar({ live = true, title, meta, right }) {
  return (
    <div className="ui-tv-bar">
      {live && <span className="ui-tv-live">● LIVE</span>}
      {title && <span className="ui-tv-title ui-tv-title--gold" style={{ fontSize: 'calc(var(--tv-unit) * 2)' }}>{title}</span>}
      {meta && <span className="ui-tv-muted">{meta}</span>}
      {right && <span className="ml-auto flex items-center gap-3">{right}</span>}
    </div>
  );
}

export function TvLeaderboard({ rows }) {
  return (
    <div className="ui-tv-board">
      {rows.map((row, index) => (
        <div key={row.id} className={cx('ui-tv-row', index === 0 && 'ui-tv-row--lead')}>
          <span className="ui-tv-row__rank">{index + 1}</span>
          {row.lead}
          <span className="ui-tv-row__name">{row.name}</span>
          {row.extra}
          <span className="ui-tv-row__value">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- Tablet: μπάρα εργαλείων ----------
// <Dock /> μία φορά ανά οθόνη· <DockItem order={n}> από οποιοδήποτε component μπαίνει μέσα της.
// Αν δεν υπάρχει μπάρα, το DockItem εμφανίζεται εκεί που δηλώθηκε (fallbackClassName).
let dockElement = null;
const dockListeners = new Set();
const setDock = (el) => { dockElement = el; dockListeners.forEach((fn) => fn(el)); };

export function Dock() {
  return <nav ref={setDock} className="ui-dock" aria-label="Εργαλεία παραγωγής" />;
}

export function DockItem({ order = 0, fallbackClassName = '', children }) {
  const [target, setTarget] = React.useState(dockElement);
  React.useEffect(() => {
    setTarget(dockElement);
    dockListeners.add(setTarget);
    return () => { dockListeners.delete(setTarget); };
  }, []);
  if (target) return createPortal(<span style={{ order, display: 'inline-flex' }}>{children}</span>, target);
  return fallbackClassName ? <div className={fallbackClassName}>{children}</div> : null;
}
