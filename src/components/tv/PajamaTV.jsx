import React from 'react';
import { PAJAMA_BOARD, PAJAMA_NIGHT_LENGTH, SQUARE_META } from '@/data/pajamaBoard';
import { PAJAMA_ACTS } from '@/data/pajamaProgram';
import { getAtmosphere } from '@/data/pajamaAtmosphere';

const PHASE_LABEL = {
  setup: 'SETUP',
  'act-intro': '📜 ΕΝΑΡΞΗ ΠΡΑΞΗΣ',
  'act-break': '🫖 ΔΙΑΛΕΙΜΜΑ',
  sleep: '🌙 ΥΠΝΟΣ',
  gift: '🎁 ΔΩΡΟ',
  dashboard: '🗺️ ΤΑΜΠΛΟ',
  wheel: '🎡 ΤΡΟΧΟΣ',
  confessions: '🤫 ΕΞΟΜΟΛΟΓΗΣΕΙΣ',
  morning: '☀️ ΠΡΩΙΝΗ ΦΑΣΗ',
  finale: '👑 ΦΙΝΑΛΕ',
};

const TILE_TONE = {
  nails: 'bg-pink-500/30 border-pink-300/50',
  slippers: 'bg-purple-500/30 border-purple-300/50',
  tickle: 'bg-fuchsia-500/40 border-fuchsia-200/60',
  wildcard: 'bg-amber-400/30 border-amber-200/70',
  morning_confessions: 'bg-amber-600/40 border-amber-200/60',
  morning_slippers: 'bg-purple-700/40 border-purple-200/60',
  morning_tickle: 'bg-fuchsia-800/50 border-fuchsia-200/60',
  finish: 'bg-yellow-300 border-yellow-100',
};

export default function PajamaTV({ players = [], pj = {} }) {
  const positions = pj.positions || {};
  const scores = pj.scores || {};
  const bindings = pj.bindings || {};
  const ranking = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const current = players[pj.turnIndex ?? 0];
  const phase = PHASE_LABEL[pj.phase] || PHASE_LABEL.dashboard;
  const card = pj.activeCard;
  const act = PAJAMA_ACTS[Math.min(pj.actIndex || 0, PAJAMA_ACTS.length - 1)];
  const atmo = getAtmosphere(pj.actIndex);

  return (
    <div className="w-full space-y-3">
      <div
        className="comic-panel p-3 flex items-center justify-between gap-3"
        style={{ background: atmo.cardBg, borderColor: atmo.border, boxShadow: `0 0 50px ${atmo.accent}2e` }}
      >
        <div>
          <div className="font-heading text-2xl" style={{ color: atmo.accent }}>🩴 PAJAMA PEDI-GLAM &amp; TICKLE SECRETS</div>
          <div className="text-sm" style={{ color: atmo.text, opacity: 0.8 }}>
            ΠΡΑΞΗ {act.roman} · {act.title} · {phase}
            {current && pj.phase === 'dashboard' ? ` · Σειρά: ${current.name}` : ''}
          </div>
        </div>
        <div className="text-right">
          <div className="font-heading text-xl text-pink-100">{pj.confessions?.length || 0}/{players.length}</div>
          <div className="text-[11px] text-pink-300">εξομολογήσεις</div>
        </div>
      </div>

      {pj.boardFinish && (
        <div className="comic-panel bg-yellow-400/20 border-yellow-200 p-2 text-center">
          <div className="font-heading text-xl text-yellow-100">
            🏁 ΤΕΡΜΑΤΙΣΜΟΣ: {pj.boardFinish.name} έφτασε στο 44 (γύρος {pj.boardFinish.round}) +5
          </div>
        </div>
      )}

      {card && (
        <div className="comic-panel bg-fuchsia-950/80 p-3">
          <div className="text-xs text-pink-300">{card.categoryId?.replace('_', ' ')}</div>
          {card.title && <div className="font-heading text-xl text-pink-100">{card.title}</div>}
          <p className="text-base text-pink-50 font-body leading-snug">{card.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-widest text-indigo-200">🌙 Νύχτα 1–22</div>
          <div className="grid grid-cols-11 gap-1">
            {PAJAMA_BOARD.slice(0, PAJAMA_NIGHT_LENGTH).map((sq) => (
              <Tile key={sq.index} square={sq} players={players} positions={positions} />
            ))}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-amber-200">☀️ Πρωί 23–44</div>
          <div className="grid grid-cols-11 gap-1">
            {PAJAMA_BOARD.slice(PAJAMA_NIGHT_LENGTH).map((sq) => (
              <Tile key={sq.index} square={sq} players={players} positions={positions} />
            ))}
          </div>
          {pj.lastRoll && (
            <div className="text-xs text-pink-200">
              🎲 {pj.lastRoll.name}: {pj.lastRoll.d1}+{pj.lastRoll.d2}={pj.lastRoll.dice} → #{pj.lastRoll.to + 1}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="comic-panel bg-card p-2">
            <div className="font-heading text-lg text-primary mb-1">Βαθμολογία</div>
            {pj.teamMode && (
              <div className="flex justify-between text-xs text-foreground/80 border-b border-border pb-1 mb-1">
                <span>Ομάδα A: <b>{players.filter((p) => pj.teams?.[p.id] === 'A').reduce((s, p) => s + (scores[p.id] || 0), 0)}</b></span>
                <span>Ομάδα B: <b>{players.filter((p) => pj.teams?.[p.id] === 'B').reduce((s, p) => s + (scores[p.id] || 0), 0)}</b></span>
              </div>
            )}
            {ranking.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between text-sm text-foreground">
                <span className="truncate">{i + 1}. {p.name}</span>
                <b>{scores[p.id] || 0}</b>
              </div>
            ))}
            {players.length === 0 && <div className="text-xs text-foreground/60">Καμία παίκτρια ακόμη.</div>}
          </div>

          {Object.keys(bindings).length > 0 && (
            <div className="comic-panel bg-rose-950/70 p-2">
              <div className="font-heading text-sm text-rose-200 mb-1">🎀 Δεσίματα</div>
              {Object.entries(bindings).map(([id, b]) => (
                <div key={id} className="text-xs text-rose-100">
                  {players.find((p) => p.id === id)?.name || '—'}: {b.label}
                </div>
              ))}
            </div>
          )}

          <div className="comic-panel bg-fuchsia-950/60 p-2">
            <div className="font-heading text-sm text-fuchsia-200 mb-1">🧦 Σαμποτάζ κάλτσας</div>
            <div className="text-xs text-fuchsia-100/85">
              {(pj.sabotages?.length || 0) === 0
                ? 'Κανένα ακόμη — η Saboteur κρατιέται κρυφή.'
                : `${pj.sabotages.length} μέχρι τώρα · η ταυτότητα αποκαλύπτεται στο φινάλε.`}
            </div>
          </div>

          {pj.phase === 'morning' && (
            <div className="comic-panel bg-amber-950/70 p-2 text-xs text-amber-100">
              ☀️ Zombie Walk &amp; Sock Audit σε εξέλιξη — η βαθμολογία ενημερώνεται ζωντανά.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tile({ square, players, positions }) {
  const meta = SQUARE_META[square.type] || SQUARE_META.nails;
  const here = players.filter((p) => (positions[p.id] || 0) === square.index);
  const isFinish = square.type === 'finish';

  return (
    <div className={`relative aspect-square rounded border flex items-center justify-center ${TILE_TONE[square.type]}`}>
      <span className={`absolute top-0 left-0.5 text-[7px] ${isFinish ? 'text-tarot-dark' : 'text-pink-100/60'}`}>
        {square.index + 1}
      </span>
      <span className="text-[10px] leading-none">{meta.icon}</span>
      {here.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5">
          {here.map((p) => (
            <span key={p.id} className="text-[7px] font-bold bg-pink-100 text-pink-950 rounded px-0.5 leading-tight">
              {p.name.slice(0, 1)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}