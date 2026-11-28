import React, { useEffect, useState } from 'react';
import { isVideoUrl } from '@/lib/mediaKind';
import { continentOf, WANTED_LEVELS } from '@/data/modes/campaignContent';
import { firstArt } from '@/lib/movieArt';
import { DiceCube, DICE_MS } from '@/components/modes/MovieBoardTV';
import { squareOf, SQUARE_KINDS, BOARD_TEXT } from '@/data/modes/movieBoard';
import { PlayerAvatar, WantedStars, colorOf } from '@/components/modes/MovieGameUI';
import {
  wheelOf, wheelItem, WHEEL_TV, WHEEL_LABEL, fillAll, CHAIR_TEXT, TOD_TEXT, DOND_TEXT, DOND_BOXES, GUESS_TEXT, BEERPONG,
  MANDATORY_STAGES, WARRANT_TEXT, WANTED_TEXT, MOST_WANTED_TEXT, ARREST_WHEEL_TEXT,
} from '@/data/modes/movieGames';

// Η ΤΑΙΝΙΑ · TV σαν τηλεοπτικό show: Τροχοί που γυρίζουν, Deal or No Deal, Καρέκλα, ανακοινώσεις-διαταγές.
// Η TV δείχνει μόνο δημόσια στοιχεία (τα κλειστά κουτιά & το αντικείμενο του «Μάντεψε» δεν φτάνουν εδώ).

const u = (n) => `min(${n}vw, ${n * 1.75}vh)`;
const SPIN_MS = 4500;
const SEG_COLORS = ['#FF3B5C', '#1C1C1E', '#E8C26B', '#2C2C2E', '#FF9F0A', '#1C1C1E', '#BF5AF2', '#2C2C2E', '#64D2FF'];

function Art({ src }) {
  if (!src) return null;
  return isVideoUrl(src)
    ? <video key={src} src={src} className="absolute inset-0 h-full w-full object-cover opacity-20" autoPlay muted loop playsInline />
    : <img key={src} src={src} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover opacity-20" />;
}

function Stage({ art, kicker, title, text, children, tone = '#FF3B5C', player, color }) {
  return (
    <div className="mvg-tv relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black text-center text-white" style={{ padding: `${u(3)} ${u(4)}`, background: `radial-gradient(90% 70% at 50% 0%, ${tone}33, #000 70%)` }}>
      <Art src={art} />
      <div className="mvg-floor" />
      <div className="mvg-spot" />
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-black" style={{ height: '7vh' }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black" style={{ height: '7vh' }} />
      <div className="gx-glass gx-capsule absolute left-1/2 z-10 -translate-x-1/2" style={{ top: '8.5vh', padding: `${u(0.45)} ${u(1.2)}`, fontSize: u(0.85), gap: u(0.8) }}>
        <span className="flex items-center font-bold" style={{ gap: u(0.35) }}><span className="gx-live-dot" />LIVE</span>
        <span className="gx-gold font-black" style={{ letterSpacing: '.14em' }}>DEAL OF TEMPTATION</span>
        <span style={{ color: '#AEAEB2', letterSpacing: '.2em' }}>Η ΤΑΙΝΙΑ</span>
      </div>
      <div className="relative flex w-full max-w-[1600px] flex-col items-center" style={{ gap: u(1.1) }}>
        {player && <div className="mv-rise"><PlayerAvatar name={player} color={color} size={u(7.5)} /></div>}
        {kicker && <div className="mv-rise font-semibold uppercase tracking-[0.35em]" style={{ fontSize: u(1.15), color: tone }}>{kicker}</div>}
        {title && <div className="mv-rise mvg-title3d font-black leading-tight" style={{ fontSize: u(3.2) }}>{title}</div>}
        {text && <div className="mv-rise max-w-[85%] text-white/85" style={{ fontSize: u(1.6), animationDelay: '.2s' }}>{text}</div>}
        {children}
      </div>
    </div>
  );
}

// Ο Τροχός: κομμάτια ίσου μεγέθους, δείκτης πάνω· γυρίζει ~4.5″ και σταματά στο κληρωμένο κομμάτι.
function SpinningWheel({ wheel, w }) {
  const n = w.items.length;
  const seg = 360 / n;
  const target = 360 * 6 - (Math.max(0, wheel.index) + 0.5) * seg;
  const late = Date.now() - wheel.at > SPIN_MS;
  const [rot, setRot] = useState(late ? target : 0);
  useEffect(() => {
    if (late) { setRot(target); return undefined; }
    const id = requestAnimationFrame(() => setRot(target));
    return () => cancelAnimationFrame(id);
  }, [wheel.at]);
  const R = 200;
  const pt = (deg, r = R) => [R + r * Math.sin((deg * Math.PI) / 180), R - r * Math.cos((deg * Math.PI) / 180)];
  return (
    <div className="mvg-float relative" style={{ width: 'min(26vw, 40vh)', height: 'min(26vw, 40vh)', filter: 'drop-shadow(0 30px 40px rgba(0,0,0,.8))' }}>
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2" style={{ width: 0, height: 0, borderLeft: `${u(1.4)} solid transparent`, borderRight: `${u(1.4)} solid transparent`, borderTop: `${u(2.6)} solid #F7E3A8`, filter: 'drop-shadow(0 0 8px rgba(247,227,168,.8))' }} />
      <svg viewBox="0 0 400 400" className="h-full w-full" style={{ transform: `rotate(${rot}deg)`, transition: late ? 'none' : `transform ${SPIN_MS}ms cubic-bezier(.17,.67,.12,1)` }}>
        <defs>
          <radialGradient id="mvw-hub" cx="35%" cy="30%" r="80%"><stop offset="0%" stopColor="#FFF1C7" /><stop offset="55%" stopColor="#E8C26B" /><stop offset="100%" stopColor="#8A6420" /></radialGradient>
        </defs>
        <circle cx={R} cy={R} r={R} fill="#000" />
        {w.items.map((it, i) => {
          const a0 = i * seg; const a1 = (i + 1) * seg;
          const [x0, y0] = pt(a0); const [x1, y1] = pt(a1);
          const mid = a0 + seg / 2; const [tx, ty] = pt(mid, R * 0.6);
          const label = it.title.length > 22 ? `${it.title.slice(0, 21)}…` : it.title;
          return (
            <g key={it.id}>
              <path d={`M${R},${R} L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z`} fill={SEG_COLORS[i % SEG_COLORS.length]} stroke="#000" strokeWidth="2" />
              <text x={tx} y={ty} fill="#fff" fontSize="13" fontWeight="800" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${mid - 90} ${tx} ${ty})`}>{label}</text>
            </g>
          );
        })}
        <circle cx={R} cy={R} r={R - 4} fill="none" stroke="#E8C26B" strokeWidth="8" />
        <circle cx={R} cy={R} r={R - 9} fill="none" stroke="#8A6420" strokeWidth="2" />
        {Array.from({ length: 24 }, (_, k) => { const [lx, ly] = pt(k * 15, R - 4); return <circle key={k} cx={lx} cy={ly} r="4.2" fill={k % 2 ? '#FFF1C7' : '#FF6B85'} />; })}
        <circle cx={R} cy={R} r="40" fill="url(#mvw-hub)" stroke="#0B0B0F" strokeWidth="3" />
        <circle cx={R} cy={R} r="30" fill="#0B0B0F" stroke={w.color} strokeWidth="5" />
        <text x={R} y={R} fill={w.color} fontSize="26" fontWeight="900" textAnchor="middle" dominantBaseline="middle">{w.id}</text>
      </svg>
    </div>
  );
}

// Χρονόμετρο-δαχτυλίδι: χρυσό που αδειάζει, κόκκινο στα τελευταία 5″.
function TimerRing({ left, total }) {
  const T = Math.max(1, total || left);
  const frac = Math.max(0, Math.min(1, left / T));
  const r = 54; const c = 2 * Math.PI * r;
  const hot = left <= 5;
  return (
    <div className="relative" style={{ width: u(12), height: u(12) }}>
      <svg viewBox="0 0 120 120" className="h-full w-full" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="rgba(0,0,0,.55)" stroke="rgba(255,255,255,.10)" strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={hot ? '#FF453A' : '#E8C26B'} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 8px ${hot ? 'rgba(255,69,58,.8)' : 'rgba(232,194,107,.8)'})` }} />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center font-black tabular-nums ${hot ? 'text-[#FF6961]' : 'gx-gold'}`} style={{ fontSize: u(4.4) }}>{left}</div>
    </div>
  );
}

const lastContinent = (cg, act) => {
  const idx = Object.keys(cg.conquered || {}).map(Number).sort((a, b) => b - a)[0];
  return continentOf((cg.conquered || {})[idx]?.continent || act.continent).name;
};

// Επιστρέφει την οθόνη του show που πρέπει να φαίνεται τώρα, ή null (τότε η TV δείχνει την κανονική σκηνή).
export function showScreen({ cg, act, nameOf, artFor, statsOf, now = Date.now(), players = [] }) {
  const art = (id) => artFor(id, act.continent);
  const col = (pid) => colorOf(players, pid);
  const continent = lastContinent(cg, act);
  const alt = Math.floor(now / 6000) % 2 === 1;

  // 0. Ζαριά στο ταμπλό: 3D ζάρι ~2.4″, μετά το τετράγωνο όπου έπεσε (σύνολο ~6″).
  const rl = cg.board?.on ? cg.board.roll : null;
  // Αν μετά τη ζαριά ξεκίνησε ήδη Τροχός/δοκιμασία/κάρτα, η σκηνή του ζαριού δίνει τη θέση της.
  const newerScene = rl && ((cg.wheel && !cg.wheel.done && cg.wheel.at > rl.at) || (cg.trial && !cg.trial.done && cg.trial.at > rl.at) || (cg.card && cg.card.at > rl.at) || (cg.game && ((cg.tod?.at || 0) > rl.at)));
  if (rl && !newerScene && now - rl.at < DICE_MS + 3600) {
    const name = nameOf(rl.pid);
    const landed = now - rl.at >= DICE_MS;
    const sq = squareOf(rl.to);
    const k = SQUARE_KINDS[sq.kind] || {};
    return (
      <Stage art={art('wheel')} kicker={landed ? `${k.icon || '🎲'} ΤΕΤΡΑΓΩΝΟ ${rl.to} · ${k.label || ''}` : '🎲 ΖΑΡΙ'} tone={landed ? (k.color || '#E8C26B') : '#E8C26B'}
        title={landed ? fillAll(sq.title, { name }) : BOARD_TEXT.tvTurn(name)} text={landed ? fillAll(sq.tv, { name }) : ''} player={name} color={col(rl.pid)}>
        <div className="flex items-center justify-center" style={{ gap: u(3) }}>
          <DiceCube value={rl.value} at={rl.at} />
          {landed && <div className="mv-rise gx-gold font-black tabular-nums" style={{ fontSize: u(7) }}>{rl.value}</div>}
        </div>
      </Stage>
    );
  }

  // 1. Τροχός Ποινής
  const wl = cg.wheel;
  if (wl && (!wl.done || (wl.reason === 'mandatory' && now - (wl.doneAt || 0) < 10000))) {
    const w = wheelOf(wl.id);
    const item = wheelItem(wl.id, wl.itemId);
    const name = nameOf(wl.pid);
    const mand = wl.reason === 'mandatory';
    if (wl.done) {
      const t = MANDATORY_STAGES.done.tv;
      return <Stage art={art('mandatory')} kicker="ΔΙΑΤΑΓΗ" title={fillAll(t.title, { name, continent })} text={fillAll(t.text, { name, continent })} tone="#45D98A" player={name} color={col(wl.pid)} />;
    }
    const spinning = now - wl.at < SPIN_MS;
    const arrest = cg.announce?.kind === 'arrestwheel' && Math.abs((cg.announce.at || 0) - wl.at) < 3000 ? ARREST_WHEEL_TEXT.tv(`${wl.id}ος`) : null;
    const head = spinning
      ? (mand ? MANDATORY_STAGES.spin.tv(WHEEL_LABEL[wl.id]) : arrest || WHEEL_TV.spin(w, name))
      : item ? (mand ? MANDATORY_STAGES.spin.tvResult(item.title) : WHEEL_TV.result(item, name)) : { title: 'PASS', text: 'Καμία ποινή εντός των ορίων της — ο γύρος συνεχίζεται.' };
    const left = wl.until ? Math.max(0, Math.ceil((wl.until - now) / 1000)) : null;
    return (
      <Stage art={art('wheel')} kicker={WHEEL_LABEL[wl.id]} title={fillAll(head.title, { name, continent })} text={fillAll(head.text, { name, continent })} player={spinning ? name : undefined} color={col(wl.pid)}>
        <div className="flex items-center justify-center" style={{ gap: u(3) }}>
          <SpinningWheel wheel={wl} w={w} />
          {!spinning && item && (
            <div className="mv-rise mvg-glass mvg-sheen max-w-[40vw] text-left" style={{ padding: u(1.6), background: 'linear-gradient(160deg,rgba(255,59,92,.35),rgba(0,0,0,.6))' }}>
              <div className="font-semibold uppercase tracking-[0.3em] text-[#FF6B85]" style={{ fontSize: u(1) }}>ΔΙΑΤΑΓΗ · {name}</div>
              <div className="font-black" style={{ fontSize: u(2.2) }}>{item.title}</div>
              <div className="text-white/85" style={{ fontSize: u(1.35) }}>{fillAll(item.tv, { name })}</div>
              {left !== null && <div className="gx-gold font-black tabular-nums" style={{ fontSize: u(5) }}>{left}″</div>}
              <div className="text-white/60" style={{ fontSize: u(1) }}>{wl.confirmed ? '📱 Επιβεβαιώθηκε' : '📱 Αναμονή επιβεβαίωσης στο κινητό'}</div>
            </div>
          )}
        </div>
      </Stage>
    );
  }

  // 2. Ανακοινώσεις-διαταγές (ένταλμα, Wanted Level, Καταζητούμενη)
  const an = cg.announce;
  if (an && now - an.at < 12000 && an.kind !== 'arrestwheel') {
    const name = nameOf(an.pid);
    const level = an.level ?? statsOf(cg, an.pid).wanted;
    const t = an.kind === 'warrant' ? (alt ? WARRANT_TEXT.tvActive : WARRANT_TEXT.tv)
      : an.kind === 'wanted' ? (level >= 3 ? WANTED_TEXT.tvEscalate : WANTED_TEXT.tv)
        : (alt ? MOST_WANTED_TEXT.tvOrder : MOST_WANTED_TEXT.tv);
    return (
      <Stage art={firstArt('wanted_poster_bg') || art('warrant')} kicker={an.kind === 'mostwanted' ? '🎯 ΚΑΤΑΖΗΤΟΥΜΕΝΗ' : an.kind === 'wanted' ? '⭐ WANTED LEVEL' : '🚨 ΕΝΤΑΛΜΑ'} title={fillAll(t.title, { name, continent, level })} text={fillAll(t.text, { name, continent, level })} player={name} color="#FF453A">
        <WantedStars n={level} size={u(3.4)} />
        <div className="text-white/70" style={{ fontSize: u(1.2) }}>{WANTED_LEVELS[level]?.label}</div>
      </Stage>
    );
  }

  // 3. Υποχρεωτική κλήρωση μετά την ήπειρο
  const m = cg.mandatory;
  if (m?.pending) {
    const name = m.pid ? nameOf(m.pid) : '';
    const t = m.pid ? (alt ? MANDATORY_STAGES.drawn.tv2 : MANDATORY_STAGES.drawn.tv) : (alt ? MANDATORY_STAGES.closing.tv2 : MANDATORY_STAGES.closing.tv);
    return (
      <Stage art={art('mandatory')} kicker="⚠️ ΥΠΟΧΡΕΩΤΙΚΟ ΓΕΓΟΝΟΣ" title={fillAll(t.title, { name, continent })} text={fillAll(t.text, { name, continent })}>
        {m.pid ? <div className="mv-rise flex items-center" style={{ gap: u(1.6) }}><PlayerAvatar name={name} color={col(m.pid)} size={u(8)} /><span className="gx-gold font-black" style={{ fontSize: u(6) }}>{name}</span></div> : <div className="mv-pulse font-black" style={{ fontSize: u(5) }}>🎲</div>}
      </Stage>
    );
  }

  // 4. Τα 4 παιχνίδια — όταν τελειώσει ένα παιχνίδι, η TV γυρίζει μόνη της στη σκηνή μετά από 20″.
  const OVER = 20000;
  const gameOver = (cg.game === 'tod' && cg.tod?.result && now - (cg.tod.resultAt || 0) > OVER)
    || (cg.game === 'beerpong' && cg.bp?.winner && now - (cg.bp.lastAt || 0) > OVER)
    || (cg.game === 'guess' && cg.guess?.result && now - (cg.guess.resultAt || 0) > OVER)
    || (cg.game === 'dond' && ['won', 'lost'].includes(cg.dond?.status) && now - (cg.dond.awardedAt || 0) > OVER);
  if (gameOver) { /* συνεχίζει στην Καρέκλα ή στην κανονική σκηνή */ } else if (cg.game === 'tod' && cg.tod) {
    const td = cg.tod; const name = nameOf(td.pid);
    const t = td.result === 'wrong' ? TOD_TEXT.tvWrong : td.result === 'refuse' ? TOD_TEXT.tvRefuse : td.choice === 'truth' ? TOD_TEXT.tvTruth : td.choice === 'dare' ? TOD_TEXT.tvDare : TOD_TEXT.tvChoose;
    const chair = cg.chair?.active && cg.chair.pid === td.pid;
    return (
      <Stage art={art(chair ? 'chair' : 'tod')} kicker={chair ? fillAll(CHAIR_TEXT.tvLocked.title, { name }) : '🎭 1ο ΠΑΙΧΝΙΔΙ'} title={fillAll(t.title, { name })} text={fillAll(t.text, { name })} player={name} color={col(td.pid)}>
        {!td.choice && (
          <div className="flex" style={{ gap: u(2.4), fontSize: u(2.8) }}>
            <span className="gx-glass font-black" style={{ padding: `${u(1)} ${u(2.4)}`, borderRadius: u(2), border: '2px solid rgba(100,210,255,.6)', boxShadow: '0 0 40px rgba(100,210,255,.3)', color: '#9BE3FF' }}>ΑΛΗΘΕΙΑ</span>
            <span className="gx-glass font-black" style={{ padding: `${u(1)} ${u(2.4)}`, borderRadius: u(2), border: '2px solid rgba(255,69,58,.6)', boxShadow: '0 0 40px rgba(255,69,58,.3)', color: '#FF8A80' }}>ΘΑΡΡΟΣ</span>
          </div>
        )}
        {td.cardTitle && (
          <div className="mv-rise gx-glass max-w-[80%]" style={{ padding: u(1.8), border: '1px solid rgba(232,194,107,.5)', boxShadow: '0 0 60px rgba(232,194,107,.2)' }}>
            <div className="font-semibold uppercase tracking-[0.3em] text-[#E8C26B]" style={{ fontSize: u(1) }}>ΔΙΑΤΑΓΗ · {td.cardTitle}</div>
            <div className="font-bold" style={{ fontSize: u(2) }}>{td.cardText}</div>
          </div>
        )}
        {td.result === 'ok' && <div className="font-black text-[#45D98A]" style={{ fontSize: u(2.5) }}>✅ ΕΚΤΕΛΕΣΤΗΚΕ</div>}
      </Stage>
    );
  }
  if (!gameOver && cg.game === 'beerpong' && cg.bp) {
    const bp = cg.bp;
    const Rack = ({ left, team, names, ids = [] }) => (
      <div className="flex flex-col items-center" style={{ gap: u(0.8) }}>
        <div className="font-bold" style={{ fontSize: u(1.6) }}>Ομάδα {team}</div>
        <div className="flex" style={{ gap: u(0.4) }}>{ids.map((id) => <PlayerAvatar key={id} name={nameOf(id)} color={col(id)} size={u(2.8)} />)}</div>
        <div className="text-white/60" style={{ fontSize: u(1.1) }}>{names}</div>
        <div className="flex flex-col items-center" style={{ gap: u(0.4) }}>
          {[4, 3, 2, 1].map((row, r) => (
            <div key={row} className="flex" style={{ gap: u(0.4) }}>
              {Array.from({ length: row }).map((_, i) => {
                const idx = [0, 4, 7, 9][r] + i;
                return <span key={i} className="inline-block rounded-full" style={{ width: u(3.2), height: u(3.2), background: idx < left ? 'radial-gradient(circle at 50% 38%, #FFD1D8 0 18%, #FF3B5C 22%, #A3122C 78%)' : 'rgba(255,255,255,.06)', border: idx < left ? '2px solid #FF8A9C' : '2px dashed rgba(255,255,255,.12)', boxShadow: idx < left ? '0 0 16px rgba(255,59,92,.6), inset 0 -4px 6px rgba(0,0,0,.35)' : 'none' }} />;
              })}
            </div>
          ))}
        </div>
        <div className="gx-gold font-black tabular-nums" style={{ fontSize: u(4) }}>{left}</div>
      </div>
    );
    return (
      <Stage art={art('beerpong')} kicker="🍺 2ο ΠΑΙΧΝΙΔΙ" title={bp.winner ? `ΝΙΚΗ ΓΙΑ ΤΗΝ ΟΜΑΔΑ ${bp.winner === 'a' ? 'Α' : 'Β'}` : BEERPONG.text.title} text={bp.winner ? 'ΔΙΑΤΑΓΗ: Η χαμένη ομάδα περνάει από τον Τροχό Ποινής.' : BEERPONG.text.text}>
        <div className="flex items-start justify-center" style={{ gap: u(8) }}>
          <Rack left={bp.cupsA} team="Α" names={bp.a.map(nameOf).join(' · ')} ids={bp.a} />
          <Rack left={bp.cupsB} team="Β" names={bp.b.map(nameOf).join(' · ')} ids={bp.b} />
        </div>
      </Stage>
    );
  }
  if (!gameOver && cg.game === 'guess' && cg.guess) {
    const g = cg.guess; const name = nameOf(g.pid);
    const left = g.until ? Math.max(0, Math.ceil((g.until - now) / 1000)) : 0;
    return (
      <Stage art={art('guess')} kicker="🙈 3ο ΠΑΙΧΝΙΔΙ" title={fillAll(GUESS_TEXT.tv.title, { name })} text={fillAll(GUESS_TEXT.tv.text, { name })} player={name} color={col(g.pid)}>
        {!g.result && left > 0 && <TimerRing left={left} total={g.secs || Math.max(left, Math.ceil(((g.until || now) - (g.at || now)) / 1000)) || left} />}
        {!g.result && left === 0 && <div className="mv-pulse font-black text-[#FF453A]" style={{ fontSize: u(4) }}>⏰ ΤΕΛΟΣ ΧΡΟΝΟΥ — ΑΠΑΝΤΗΣΕ ΤΩΡΑ</div>}
        {g.result && <div className="font-black" style={{ fontSize: u(3), color: g.result === 'ok' ? '#45D98A' : '#FF453A' }}>{g.result === 'ok' ? '✅ ΤΟ ΒΡΗΚΕ' : '❌ ΑΠΟΤΥΧΙΑ — ΤΡΟΧΟΣ ΠΟΙΝΗΣ'}</div>}
      </Stage>
    );
  }
  if (!gameOver && cg.game === 'dond' && cg.dond) return <DondTV d={cg.dond} nameOf={nameOf} art={art('dond')} now={now} col={col} />;

  // 5. Καρέκλα Ανάκρισης
  const ch = cg.chair;
  if (ch?.active || (ch?.outAt && now - ch.outAt < 8000)) {
    const name = nameOf(ch.pid);
    const t = !ch.active ? CHAIR_TEXT.tvExit : now - ch.at < 10000 ? CHAIR_TEXT.tvEnter : CHAIR_TEXT.tvLocked;
    return <Stage art={art('chair')} kicker="🪑 ΚΑΡΕΚΛΑ ΑΝΑΚΡΙΣΗΣ" title={fillAll(t.title, { name })} text={fillAll(t.text, { name })} player={name} color={col(ch.pid)} />;
  }
  return null;
}

function DondTV({ d, nameOf, art, now, col = () => '#E8C26B' }) {
  const name = nameOf(d.pid);
  const prize = nameOf(d.prizePid);
  const opened = new Set(d.boxes.filter((b) => b.open).map((b) => b.value));
  const recent = d.lastOpened && now - d.lastOpened.at < 6000 ? d.boxes.find((b) => b.no === d.lastOpened.no) : null;
  let t = d.status === 'pick' ? DOND_TEXT.tvPick : DOND_TEXT.tvStart;
  if (recent) t = recent.wheel ? DOND_TEXT.tvTrap(`${recent.wheel}ος`, name) : DOND_TEXT.tvOpened(recent.no);
  if (d.status === 'offer') t = d.round >= 3 ? { title: DOND_TEXT.tvFinalOffer.title, text: `${DOND_TEXT.tvOffer(d.offer).text} ${DOND_TEXT.tvFinalOffer.text}` } : DOND_TEXT.tvOffer(d.offer);
  if (d.decision === 'nodeal' && d.decidedAt && now - d.decidedAt < 6000 && !recent) t = DOND_TEXT.tvNoDeal;
  if (d.status === 'deal') t = DOND_TEXT.tvDeal;
  if (d.status === 'revealed') t = { title: `ΤΟ ΚΟΥΤΙ ΤΗΣ: ${d.result?.text || ''}`, text: DOND_TEXT.tvFinalOffer.text };
  if (d.status === 'won') t = DOND_TEXT.tvWin;
  if (d.status === 'lost') t = DOND_TEXT.tvEnd;
  const board = [...DOND_BOXES].sort((a, b) => a.value - b.value);
  const half = Math.ceil(board.length / 2);
  const Val = ({ b }) => (
    <div className={`truncate rounded-lg font-bold ${opened.has(b.value) ? 'bg-white/5 text-white/25 line-through' : b.kind === 'big' ? 'bg-[#E8C26B] text-black' : b.kind === 'trap' ? 'bg-[#3A0A12] text-[#FF8A9C]' : 'bg-[#2C2C2E]'}`} style={{ fontSize: u(0.95), padding: `${u(0.35)} ${u(0.6)}` }}>{b.label}</div>
  );
  return (
    <div className="mvg-tv relative grid min-h-screen w-full grid-cols-[1fr_2.2fr_1fr] items-center overflow-hidden bg-black text-white" style={{ gap: u(1.6), padding: u(2.4), background: 'radial-gradient(90% 70% at 50% 0%, #3b2a0a, #000 70%)' }}>
      <Art src={art} />
      <div className="mvg-floor" />
      <div className="relative flex flex-col" style={{ gap: u(0.4) }}>{board.slice(0, half).map((b) => <Val key={b.id} b={b} />)}</div>
      <div className="relative flex flex-col items-center text-center" style={{ gap: u(1) }}>
        <div className="flex items-center" style={{ gap: u(0.8) }}><PlayerAvatar name={name} color={col(d.pid)} size={u(4.4)} /><span className="gx-gold font-black" style={{ fontSize: u(1.6) }}>→</span><PlayerAvatar name={prize} color={col(d.prizePid)} size={u(4.4)} /></div>
        <div className="font-semibold uppercase tracking-[0.35em] text-[#E8C26B]" style={{ fontSize: u(1.1) }}>💼 4ο ΠΑΙΧΝΙΔΙ · {name} για την ελευθερία της {prize} + δώρο</div>
        <div className="mv-rise mvg-title3d font-black leading-tight" style={{ fontSize: u(2.8) }}>{fillAll(t.title, { name: prize })}</div>
        <div className="max-w-[90%] text-white/85" style={{ fontSize: u(1.4) }}>{fillAll(t.text, { name: prize })}</div>
        {recent && <div className="mv-rise rounded-3xl font-black" style={{ fontSize: u(3), padding: `${u(0.6)} ${u(1.6)}`, background: recent.kind === 'trap' ? '#FF3B5C' : recent.kind === 'big' ? '#E8C26B' : '#2C2C2E', color: recent.kind === 'big' ? '#000' : '#fff' }}>Νο {recent.no}: {recent.label}</div>}
        {d.status === 'offer' && <div className="mv-pulse rounded-3xl border-2 border-[#E8C26B] font-black text-[#F7E3A8]" style={{ fontSize: u(2.4), padding: `${u(0.8)} ${u(1.6)}` }}>☎️ {d.offer}<div className="text-white" style={{ fontSize: u(1.6) }}>DEAL ή NO DEAL;</div></div>}
        <div className="mvg-float grid w-full grid-cols-8" style={{ gap: u(0.6), marginTop: u(0.6) }}>
          {d.boxes.map((b) => (
            <div key={b.no} className="relative flex items-center justify-center rounded-2xl text-center font-black" style={{ minHeight: u(3.8), padding: `${u(0.5)} ${u(0.2)}`, fontSize: u(1.6), background: b.open ? 'rgba(255,255,255,.04)' : b.no === d.myBox ? 'linear-gradient(180deg,#FFF1C7,#E8C26B 55%,#C99B2E)' : 'linear-gradient(180deg,#2E2A22,#14120E)', color: b.open ? 'rgba(255,255,255,.25)' : b.no === d.myBox ? '#1c1405' : '#F7E3A8', border: b.open ? '1px dashed rgba(255,255,255,.12)' : '2px solid #C99B2E', boxShadow: b.open ? 'none' : `inset 0 1px 0 rgba(255,255,255,.25), 0 8px 0 #4a3a16, 0 14px 24px rgba(0,0,0,.6)${b.no === d.myBox ? ', 0 0 40px rgba(232,194,107,.55)' : ''}` }}>
              {!b.open && <span aria-hidden="true" className="absolute left-1/2 -translate-x-1/2 rounded-t-md" style={{ top: `calc(${u(0.55)} * -1)`, width: u(2.2), height: u(0.55), border: '2px solid #C99B2E', borderBottom: 0 }} />}
              {b.open ? <span className="line-clamp-2" style={{ fontSize: u(0.7), lineHeight: 1.1 }}>{b.label}</span> : b.no}
            </div>
          ))}
        </div>
      </div>
      <div className="relative flex flex-col" style={{ gap: u(0.4) }}>{board.slice(half).map((b) => <Val key={b.id} b={b} />)}</div>
    </div>
  );
}

// Ενεργά εντάλματα (για την πλαϊνή στήλη της κανονικής σκηνής).
export function warrantLines(cg, players, nameOf, act) {
  const continent = continentOf(act.continent).name;
  return players.filter((p) => cg.players?.[p.id]?.flags?.warrant).map((p) => fillAll(WARRANT_TEXT.tvActive.title, { name: nameOf(p.id), continent }));
}
