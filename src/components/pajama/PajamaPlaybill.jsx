import React from 'react';

export default function PajamaPlaybill({ players, pj, atmo }) {
  const scores = pj.scores || {};
  const ranking = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const teamScore = (t) => players.filter((p) => pj.teams?.[p.id] === t).reduce((s, p) => s + (scores[p.id] || 0), 0);

  return (
    <div
      className="rounded-2xl p-3 space-y-2"
      style={{ background: 'rgba(0,0,0,.45)', border: `1px solid ${atmo.border}`, boxShadow: `inset 0 0 40px ${atmo.accent}12` }}
    >
      <div className="text-center text-[10px] uppercase tracking-[0.4em]" style={{ color: atmo.accent }}>
        Playbill
      </div>

      {pj.teamMode && (
        <div className="grid grid-cols-2 gap-2 text-center">
          {['A', 'B'].map((t) => (
            <div key={t} className="rounded-lg px-1 py-1" style={{ background: atmo.accentSoft, border: `1px solid ${atmo.border}` }}>
              <div className="text-[9px] uppercase tracking-widest" style={{ color: atmo.dim }}>Ομάδα {t}</div>
              <div className="font-heading text-xl" style={{ color: atmo.text }}>{teamScore(t)}</div>
            </div>
          ))}
        </div>
      )}

      {ranking.map((p, i) => (
        <div key={p.id} className="flex items-baseline gap-2">
          <span className="w-4 text-center font-heading text-sm" style={{ color: atmo.accent }}>{i + 1}</span>
          <span className="flex-1 min-w-0">
            <span className="block truncate text-sm" style={{ color: atmo.text }}>{p.name}</span>
            {(p.nailColor || p.slipperType) && (
              <span className="block truncate text-[9px]" style={{ color: atmo.dim }}>
                {[p.nailColor && `💅 ${p.nailColor}`, p.slipperType && `🩴 ${p.slipperType}`].filter(Boolean).join(' · ')}
              </span>
            )}
          </span>
          <span className="font-heading text-lg" style={{ color: atmo.accent }}>{scores[p.id] || 0}</span>
        </div>
      ))}

      {players.length === 0 && (
        <div className="text-center text-xs" style={{ color: atmo.dim }}>Καμία παίκτρια ακόμη.</div>
      )}
    </div>
  );
}