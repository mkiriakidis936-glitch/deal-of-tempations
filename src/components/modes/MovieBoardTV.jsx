import React, { useEffect, useState } from 'react';
import { PlayerAvatar, colorOf } from '@/components/modes/MovieGameUI';
import { BOARD_SQUARES, SQUARE_KINDS } from '@/data/modes/movieBoard';
import { turnPid } from '@/lib/movieBoardEngine';

// Η ΤΑΙΝΙΑ · TV — 3D ζάρι και ταμπλό ηπείρου με τα πιόνια των παικτριών.

const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
// Ποια όψη κοιτάζει τον θεατή για κάθε αριθμό (front=1, right=2, top=3, bottom=4, left=5, back=6).
const FACE_ROT = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
export const DICE_MS = 2400;

function Face({ n, transform, size }) {
  return (
    <div className="gx-die-face" style={{ transform, width: size, height: size }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => <span key={i} className={PIPS[n].includes(i) ? 'gx-pip' : ''} />)}
    </div>
  );
}

// Κύβος που γυρίζει ~2.4″ και σταματά δείχνοντας «value». Αν η TV άνοιξε αργότερα, εμφανίζεται κατευθείαν ο αριθμός.
export function DiceCube({ value = 1, at = 0, size = 'min(14vw, 24vh)' }) {
  const late = Date.now() - at > DICE_MS;
  const [x0, y0] = FACE_ROT[value] || FACE_ROT[1];
  const final = `rotateX(${x0 - 720 - 18}deg) rotateY(${y0 + 1080 + 22}deg)`;
  const [rot, setRot] = useState(late ? final : 'rotateX(0deg) rotateY(0deg)');
  useEffect(() => {
    if (late) { setRot(final); return undefined; }
    const id = requestAnimationFrame(() => setRot(final));
    return () => cancelAnimationFrame(id);
  }, [at, value]);
  const half = `calc(${size} / 2)`;
  return (
    <div className="gx-die-stage" style={{ width: size, height: size }}>
      <div className="gx-die" style={{ width: size, height: size, transform: rot, transition: late ? 'none' : `transform ${DICE_MS}ms cubic-bezier(.15,.75,.2,1)` }}>
        <Face n={1} size={size} transform={`translateZ(${half})`} />
        <Face n={6} size={size} transform={`rotateY(180deg) translateZ(${half})`} />
        <Face n={2} size={size} transform={`rotateY(90deg) translateZ(${half})`} />
        <Face n={5} size={size} transform={`rotateY(-90deg) translateZ(${half})`} />
        <Face n={3} size={size} transform={`rotateX(90deg) translateZ(${half})`} />
        <Face n={4} size={size} transform={`rotateX(-90deg) translateZ(${half})`} />
      </div>
    </div>
  );
}

// Ταμπλό 18 τετραγώνων σε 2 σειρές (φιδάκι), με τα πιόνια στις θέσεις τους. Η παίκτρια που έχει σειρά λάμπει.
export function BoardTrack({ cg, players = [], nameOf, u }) {
  const b = cg.board;
  if (!b?.on) return null;
  const turn = turnPid(cg);
  const n = BOARD_SQUARES.length;
  const half = Math.ceil(n / 2);
  const rows = [BOARD_SQUARES.slice(0, half).map((s, i) => [s, i]), BOARD_SQUARES.slice(half).map((s, i) => [s, i + half]).reverse()];
  const lastTo = b.roll?.to;
  return (
    <div className="flex h-full flex-col" style={{ gap: u(0.7) }}>
      <div className="flex items-center justify-between">
        <div className="font-semibold uppercase tracking-[0.25em] text-[#E8C26B]" style={{ fontSize: u(0.95) }}>🎲 Ταμπλό ηπείρου</div>
        {turn && !b.allDone && (
          <div className="flex items-center font-black" style={{ gap: u(0.6), fontSize: u(1.25) }}>
            <PlayerAvatar name={nameOf(turn)} color={colorOf(players, turn)} size={u(2.4)} />
            {b.pending ? `${nameOf(b.pending.pid)} — εκτελεί το τετράγωνο` : `Σειρά: ${nameOf(turn)} — ρίχνει το ζάρι`}
          </div>
        )}
        {b.allDone && <div className="gx-gold font-black" style={{ fontSize: u(1.25) }}>👑 Όλες τερμάτισαν</div>}
      </div>
      <div className="gx-track flex min-h-0 flex-1 flex-col justify-center" style={{ gap: u(0.6) }}>
        {rows.map((row, r) => (
          <div key={r} className="grid" style={{ gridTemplateColumns: `repeat(${half}, minmax(0, 1fr))`, gap: u(0.5) }}>
            {row.map(([s, i]) => {
              const k = SQUARE_KINDS[s.kind] || {};
              const here = b.order.filter((id) => (b.pos[id] || 0) === i);
              const hot = i === lastTo;
              return (
                <div key={s.id} className={`gx-sq ${hot ? 'is-hot' : ''}`} style={{ '--sq': k.color || '#555', minHeight: u(5.2), padding: u(0.35) }}>
                  <div className="flex items-center justify-between" style={{ fontSize: u(0.7), opacity: 0.7 }}><span>{i}</span><span>{k.icon}</span></div>
                  <div className="truncate text-center font-bold" style={{ fontSize: u(0.72), lineHeight: 1.1 }}>{s.title}</div>
                  <div className="flex flex-wrap justify-center" style={{ gap: u(0.15), marginTop: u(0.2) }}>
                    {here.map((id) => (
                      <span key={id} className={id === turn ? 'gx-pawn-turn' : ''}><PlayerAvatar name={nameOf(id)} color={colorOf(players, id)} size={u(1.7)} /></span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
