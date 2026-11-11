import React, { useRef, useState } from 'react';
import MyPajamaCard from '@/components/play/MyPajamaCard';
import { PAJAMA_ACTS } from '@/data/pajamaProgram';
import { PAJAMA_NIGHT_LENGTH } from '@/data/pajamaBoard';
import { ART } from '@/data/brandArt';
import { getAtmosphere } from '@/data/pajamaAtmosphere';

export default function PediPassport({ pj = {}, players = [], me }) {
  const [open, setOpen] = useState(false);
  const holdRef = useRef(null);

  if (!me) return null;

  const atmo = getAtmosphere(pj.actIndex);
  const act = PAJAMA_ACTS[Math.min(pj.actIndex || 0, PAJAMA_ACTS.length - 1)];
  const scores = pj.scores || {};
  const pos = (pj.positions || {})[me.id] || 0;
  const rank = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)).findIndex((p) => p.id === me.id) + 1;
  const team = pj.teams?.[me.id];
  const binding = (pj.bindings || {})[me.id];
  const hasSecret = pj.saboteurId === me.id || !!team;

  const startHold = () => {
    clearTimeout(holdRef.current);
    holdRef.current = setTimeout(() => setOpen(true), 600);
  };
  const endHold = () => {
    clearTimeout(holdRef.current);
    setOpen(false);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4"
      style={{ background: atmo.cardBg, border: `1px solid ${atmo.border}`, boxShadow: `0 0 34px ${atmo.accent}24` }}
    >
      <img
        src={ART.emblem}
        alt=""
        className="pointer-events-none absolute -right-7 -top-7 h-28 w-28 rounded-full opacity-[0.12]"
      />

      <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.32em]" style={{ color: atmo.accent }}>
        <span>Πεδι-Πασολόγιο</span>
        <span>ΠΡΑΞΗ {act?.roman}</span>
      </div>

      <div className="mt-1 font-heading text-2xl leading-tight" style={{ color: atmo.text }}>🩴 {me.name}</div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
        {team && (
          <span className="rounded-full px-2 py-0.5" style={{ background: atmo.accentSoft, border: `1px solid ${atmo.border}`, color: atmo.text }}>
            Ομάδα {team}
          </span>
        )}
        <span className="rounded-full px-2 py-0.5" style={{ background: 'rgba(255,255,255,.06)', color: atmo.dim }}>
          {pos >= PAJAMA_NIGHT_LENGTH ? '☀️ Πρωί' : '🌙 Νύχτα'}
        </span>
        {me.nailColor && (
          <span className="rounded-full px-2 py-0.5" style={{ background: 'rgba(255,255,255,.06)', color: atmo.dim }}>💅 {me.nailColor}</span>
        )}
        {me.slipperType && (
          <span className="rounded-full px-2 py-0.5" style={{ background: 'rgba(255,255,255,.06)', color: atmo.dim }}>🩴 {me.slipperType}</span>
        )}
        {binding && (
          <span className="rounded-full px-2 py-0.5" style={{ background: 'rgba(120,20,40,.5)', color: '#ffd9df' }}>🎀 Δεμένη</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Πόντοι', value: scores[me.id] || 0 },
          { label: 'Θέση', value: `#${pos + 1}` },
          { label: 'Κατάταξη', value: players.length ? `${rank}/${players.length}` : '—' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg py-1.5" style={{ background: 'rgba(0,0,0,.35)', border: `1px solid ${atmo.accentSoft}` }}>
            <div className="font-heading text-xl" style={{ color: atmo.accent }}>{s.value}</div>
            <div className="text-[9px] uppercase tracking-widest" style={{ color: atmo.dim }}>{s.label}</div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
        onContextMenu={(e) => e.preventDefault()}
        className="mt-3 w-full rounded-lg py-2 font-heading text-[11px] tracking-wider"
        style={{ border: `1px dashed ${atmo.border}`, color: atmo.accent, background: 'rgba(0,0,0,.4)' }}
      >
        {open ? '👁 ΜΟΝΟ ΓΙΑ ΤΑ ΜΑΤΙΑ ΣΟΥ' : '🔒 ΚΡΑΤΑ ΠΑΤΗΜΕΝΟ ΓΙΑ ΤΗΝ ΤΑΥΤΟΤΗΤΑ'}
      </button>

      {open && (
        <div className="mt-2">
          {hasSecret ? (
            <MyPajamaCard pj={pj} me={me} />
          ) : (
            <div className="rounded-lg px-2 py-2 text-xs" style={{ background: 'rgba(255,255,255,.05)', color: atmo.dim }}>
              Αθώα — κανένας ειδικός ρόλος, κανένα κρυφό χρέος.
            </div>
          )}
        </div>
      )}
    </div>
  );
}