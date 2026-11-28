import React, { useEffect, useRef, useState } from 'react';
import { ART } from '@/data/brandArt';

const MODE_LABELS = { deal_movie: 'Η ΤΑΙΝΙΑ · 5 ΗΠΕΙΡΟΙ',
  classic: 'CLASSIC DEAL',
  marathon: 'MARATHON',
  arrest_heist: 'ARREST HEIST',
  pajama: 'PAJAMA EXPERIENCE',
};

export default function TVExperienceLayer({ sessionCode, mode, playerCount, stage, online, fullscreen, onToggleFullscreen, event }) {
  const [moment, setMoment] = useState(null);
  const previousEventRef = useRef(null);
  useEffect(() => {
    if (!event) return undefined;
    const signature = event.timestamp || event.id || `${event.type || ''}:${event.player || ''}:${event.description || event.detail || event.card || ''}`;
    if (previousEventRef.current === null) { previousEventRef.current = signature; return undefined; }
    if (previousEventRef.current === signature) return undefined;
    previousEventRef.current = signature;
    setMoment(event);
    const timer = window.setTimeout(() => setMoment(null), 2600);
    return () => window.clearTimeout(timer);
  }, [event]);
  const modeLabel = MODE_LABELS[mode] || String(mode || 'LIVE GAME').replace(/[_-]/g, ' ').toUpperCase();

  return (
    <>
      <div className="dot-tv-atmosphere" aria-hidden="true">
        <span className="dot-tv-orb dot-tv-orb-one" />
        <span className="dot-tv-orb dot-tv-orb-two" />
        <span className="dot-tv-grain" />
      </div>

      <header className="dot-tv-hud" aria-label="Κατάσταση τηλεοπτικής οθόνης">
        <div className="dot-tv-brand">
          <img className="dot-tv-brand-mark" src={ART.emblem || '/icons/icon-192.png'} alt="" />
          <span>
            <strong>DEAL OF TEMPTATION</strong>
            <small>{modeLabel}</small>
          </span>
        </div>

        <div className="dot-tv-live-meta">
          <span className={`dot-tv-network ${online ? 'is-online' : 'is-offline'}`}>
            <i />
            {online ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span className="dot-tv-meta-item">SESSION <b>{sessionCode}</b></span>
          <span className="dot-tv-meta-item">PLAYERS <b>{playerCount}</b></span>
        </div>

        <button type="button" className="dot-tv-fullscreen-button" onClick={onToggleFullscreen}>
          <span aria-hidden="true">{fullscreen ? '⤢' : '⛶'}</span>
          {fullscreen ? 'ΕΞΟΔΟΣ' : 'ΠΛΗΡΗΣ ΟΘΟΝΗ'}
        </button>
      </header>

      {moment && (
        <div className="dot-tv-moment" role="status" aria-live="polite">
          <span className="dot-tv-moment-kicker">LIVE MOMENT</span>
          <strong>{String(moment.type || 'GAME UPDATE').replace(/[_-]/g, ' ').toUpperCase()}</strong>
          {(moment.player || moment.description || moment.detail || moment.card) && (
            <small>{[moment.player, moment.description || moment.detail || moment.card].filter(Boolean).join(' · ')}</small>
          )}
        </div>
      )}

      <div className="dot-tv-stage-marker" aria-hidden="true">
        <span />
        {stage > 0 ? 'LIVE EXPERIENCE' : 'STANDBY'}
      </div>
    </>
  );
}
