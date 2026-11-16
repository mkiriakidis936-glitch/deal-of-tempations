import React from 'react';

const MODE_LABELS = {
  classic: 'CLASSIC DEAL',
  marathon: 'MARATHON',
  arrest_heist: 'ARREST HEIST',
  pajama: 'PAJAMA EXPERIENCE',
};

export default function TVExperienceLayer({ sessionCode, mode, playerCount, stage, online, fullscreen, onToggleFullscreen }) {
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
          <span className="dot-tv-brand-mark">D</span>
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

      <div className="dot-tv-stage-marker" aria-hidden="true">
        <span />
        {stage > 0 ? 'LIVE EXPERIENCE' : 'STANDBY'}
      </div>
    </>
  );
}
