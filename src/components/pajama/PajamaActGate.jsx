import React from 'react';
import PajamaTimer from '@/components/pajama/PajamaTimer';
import PajamaStage from '@/components/pajama/PajamaStage';
import { PAJAMA_ACTS } from '@/data/pajamaProgram';
import { getAtmosphere } from '@/data/pajamaAtmosphere';

export default function PajamaActGate({ act, index, onStart }) {
  const night = act.zone === 'night';
  const atmo = getAtmosphere(index);

  return (
    <PajamaStage atmo={atmo}>
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-24 pt-10">
        <div className="text-center">
          <div className="text-[10px] tracking-[0.42em]" style={{ color: atmo.accent }}>
            {night ? '🌙 ΝΥΧΤΕΡΙΝΟ ΠΡΟΓΡΑΜΜΑ' : '☀️ ΠΡΩΙΝΟ ΠΡΟΓΡΑΜΜΑ'}
          </div>
          <div
            className="font-display mt-3 leading-none"
            style={{ fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', color: atmo.accent, textShadow: `0 2px 0 #000, 0 0 60px ${atmo.accent}66` }}
          >
            ΠΡΑΞΗ {act.roman}
          </div>
          <div className="font-heading mt-2 text-2xl tracking-[0.16em]" style={{ color: atmo.text }}>{act.title}</div>
          <div className="text-sm italic" style={{ color: atmo.dim }}>{act.subtitle}</div>
        </div>

        <div
          className="space-y-2 rounded-2xl p-4"
          style={{ background: atmo.cardBg, border: `1px solid ${atmo.border}`, boxShadow: `0 26px 60px rgba(0,0,0,.7)` }}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: atmo.accent }}>Τι κάνουμε τώρα</div>
          {act.brief.map((line) => (
            <div key={line} className="text-sm" style={{ color: atmo.text }}>• {line}</div>
          ))}
          <div className="pt-1 text-xs" style={{ color: atmo.dim }}>
            Διάρκεια πράξης: <b style={{ color: atmo.text }}>{act.minutes}′</b>
            {act.breakMinutes > 0 && ` · διάλειμμα ${act.breakMinutes}′ μετά`}
          </div>
        </div>

        <PajamaTimer seconds={act.minutes * 60} autoStart />

        <button
          onClick={onStart}
          className="w-full rounded-xl py-4 font-heading text-xl"
          style={{ background: atmo.accent, color: '#150a06', boxShadow: `0 0 50px ${atmo.accent}55` }}
        >
          ΞΕΚΙΝΑΜΕ →
        </button>

        <div className="rounded-2xl p-3" style={{ background: 'rgba(0,0,0,.4)', border: `1px solid ${atmo.border}` }}>
          <div className="mb-1 text-[10px] uppercase tracking-[0.3em]" style={{ color: atmo.accent }}>Το πρόγραμμα της βραδιάς</div>
          <div className="space-y-1">
            {PAJAMA_ACTS.map((a, i) => {
              const state = i === index ? 'now' : i < index ? 'past' : 'next';
              const tone =
                state === 'now'
                  ? { background: atmo.accentSoft, color: atmo.text, border: `1px solid ${atmo.border}` }
                  : { color: state === 'past' ? `${atmo.dim}` : atmo.text, opacity: state === 'past' ? 0.55 : 0.85 };
              return (
                <div key={a.id} className={`flex items-center gap-2 rounded px-2 py-1 text-[11px] ${state === 'now' ? 'font-bold' : ''}`} style={tone}>
                  <span className="w-5">{a.zone === 'night' ? '🌙' : '☀️'}</span>
                  <span className="w-6 font-heading">{a.roman}</span>
                  <span className={`flex-1 truncate ${state === 'past' ? 'line-through' : ''}`}>{a.title}</span>
                  <span>{a.minutes}′</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PajamaStage>
  );
}