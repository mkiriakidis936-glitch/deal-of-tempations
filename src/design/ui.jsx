import React from 'react';

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
