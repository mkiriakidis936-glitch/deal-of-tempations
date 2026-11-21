import React from 'react';
import MediaSpot from '@/components/shared/MediaSpot';

export default function GameCard({
  title,
  text,
  kicker,
  corner,
  icon,
  image,
  accent = '#E8C26B',
  footLeft,
  footRight,
  variant = 'default',
  className = '',
  children,
}) {
  const variantClass = variant === 'tv' ? 'dt-card--tv' : variant === 'compact' ? 'dt-card--compact' : '';
  return (
    <div className={`space-y-3 ${className}`}>
      <article className={`dt-card ${variantClass}`} style={{ '--dt-card-accent': accent }} aria-label={title}>
        <span className="dt-card__inner" aria-hidden="true" />
        <header className="dt-card__head">
          <span className="truncate">{kicker || 'Deal of Temptation'}</span>
          {corner && <span>{corner}</span>}
        </header>
        <MediaSpot
          src={image}
          wrapClassName="dt-card__media"
          fallback={<div className="dt-card__emblem" aria-hidden="true">{icon || '🗝️'}</div>}
        />
        <div className="dt-card__body">
          {title && <h3 className="dt-card__title">{title}</h3>}
          {text && <p className="dt-card__text">{text}</p>}
        </div>
        {(footLeft || footRight) && (
          <footer className="dt-card__foot">
            <span>{footLeft}</span>
            {footRight && <span className="dt-card__badge">{footRight}</span>}
          </footer>
        )}
      </article>
      {children && <div className="dt-card-actions space-y-2">{children}</div>}
    </div>
  );
}
