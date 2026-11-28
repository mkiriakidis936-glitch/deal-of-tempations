import React, { useEffect, useRef, useState } from 'react';
import { CONTINENTS, trialOf, cardOf } from '@/data/modes/campaignContent';
import { GAMES } from '@/data/modes/movieGames';
import { contArt, movieArt } from '@/lib/movieArt';

// 10.1.0 · GAME UI της Ταινίας (iOS 27 σκούρο): κοινά κομμάτια για TV, κινητό και Tablet.
// Μόνο εμφάνιση: δεν αλλάζει κανέναν κανόνα, καμία κατάσταση και καμία ενέργεια.
// Οι εικόνες (εικονίδια, κάρτες ηπείρων) διαβάζονται από τις θέσεις media· αν λείπουν, μπαίνει ένδειξη χωρίς εικόνα.

export const PLAYER_COLORS = ['#E8C26B', '#FF5A6E', '#C9B4FF', '#8FE3C6', '#64D2FF', '#FF9F6B', '#FF8FD1', '#7BE495', '#B9A0FF', '#FFD66B'];
export const colorOf = (players = [], id) => {
  const i = players.findIndex((p) => p.id === id);
  return PLAYER_COLORS[(i < 0 ? 0 : i) % PLAYER_COLORS.length];
};
export const initialOf = (name) => String(name || '?').trim().charAt(0).toLocaleUpperCase('el') || '?';
const CONT_TINT = { classic: '#8A6A1E', arrest_heist: '#7A1D2C', lockdown: '#3D2470', marathon_4h: '#7A1550', villa_takeover: '#0E5A45' };

// Μέγεθος σε px (αριθμός) ή σε CSS (π.χ. «min(4vw, 7vh)»): επιστρέφει κλάσμα του.
const part = (size, k) => (typeof size === 'number' ? size * k : `calc(${size} * ${k})`);

export function PlayerAvatar({ name, color = '#E8C26B', size = 44, className = '', title }) {
  const ring = typeof size === 'number' ? Math.max(2, Math.round(size / 16)) : 3;
  return (
    <span className={`gx-avatar ${className}`} title={title || name} aria-label={title || name}
      style={{ width: size, height: size, fontSize: part(size, 0.44), borderWidth: ring, '--gx-c': color }}>
      {initialOf(name)}
    </span>
  );
}

// Τα εικονίδια MEGA δεν έχουν διαφάνεια (λευκό ή μαύρο τετράγωνο φόντο). Διαβάζουμε το χρώμα της γωνίας
// και τα δείχνουμε ως στρογγυλό «νόμισμα» σε αυτό το χρώμα, ώστε να μη φαίνεται τετράγωνο κουτί.
const cornerCache = new Map();
export function useCornerColor(url) {
  const [color, setColor] = useState(() => (url ? cornerCache.get(url) : undefined));
  useEffect(() => {
    if (!url) return undefined;
    if (cornerCache.has(url)) { setColor(cornerCache.get(url)); return undefined; }
    let alive = true;
    const img = new Image();
    img.onload = () => {
      let c = null;
      try {
        const cv = document.createElement('canvas'); cv.width = 1; cv.height = 1;
        const ctx = cv.getContext('2d');
        ctx.drawImage(img, 0, 0, Math.max(1, img.naturalWidth * 0.02), Math.max(1, img.naturalHeight * 0.02), 0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        c = a < 40 ? 'transparent' : `rgb(${r}, ${g}, ${b})`;
      } catch { c = null; }
      cornerCache.set(url, c);
      if (alive) setColor(c);
    };
    img.onerror = () => { cornerCache.set(url, null); if (alive) setColor(null); };
    img.src = url;
    return () => { alive = false; };
  }, [url]);
  return color;
}

// Εικονίδιο από θέση media (π.χ. icon_crown). Χωρίς εικόνα: το fallback (σύμβολο) ή τίποτα.
export function ArtIcon({ id, src, fallback = '', size = 24, className = '', bob = false }) {
  const url = src || movieArt(id);
  const [bad, setBad] = useState(false);
  const bg = useCornerColor(url && !bad ? url : '');
  if (!url || bad) {
    return fallback ? <span aria-hidden="true" className={className} style={{ display: 'inline-block', width: size, textAlign: 'center', fontSize: part(size, 0.86), lineHeight: 1 }}>{fallback}</span> : null;
  }
  if (bg && bg !== 'transparent') {
    return (
      <span aria-hidden="true" className={`gx-icon-coin ${bob ? 'gx-bob' : ''} ${className}`} style={{ width: size, height: size, background: bg }}>
        <img src={url} alt="" onError={() => setBad(true)} />
      </span>
    );
  }
  return <img src={url} alt="" aria-hidden="true" className={`gx-icon ${bob ? 'gx-bob' : ''} ${className}`} style={{ width: size, height: size }} onError={() => setBad(true)} />;
}

export function WantedStars({ n = 0, max = 5, size = 16 }) {
  const icon = movieArt('icon_wanted_star');
  return (
    <span className="inline-flex items-center" style={{ gap: part(size, 0.15) }} role="img" aria-label={`Wanted ${n} από ${max}`}>
      {Array.from({ length: max }, (_, k) => (icon
        ? <img key={`${n}-${k}`} src={icon} alt="" aria-hidden="true" className={`gx-icon ${k < n ? 'gx-star' : ''}`} style={{ width: size, height: size, opacity: k < n ? 1 : 0.18, filter: k < n ? undefined : 'grayscale(1)', animationDelay: `${k * 110}ms` }} />
        : <span key={`${n}-${k}`} aria-hidden="true" className={k < n ? 'gx-star inline-block' : ''} style={{ fontSize: size, lineHeight: 1, color: k < n ? '#FF6B85' : 'rgba(255,255,255,.18)', animationDelay: `${k * 110}ms` }}>★</span>))}
    </span>
  );
}

// «+3» που ανεβαίνει όταν αλλάζουν οι πόντοι (όχι στο πρώτο άνοιγμα).
export function useDelta(value) {
  const prev = useRef(value);
  const [delta, setDelta] = useState(null);
  useEffect(() => {
    const before = prev.current;
    prev.current = value;
    if (before == null || value == null) return undefined; // πρώτο φόρτωμα: χωρίς «+»
    const diff = (Number(value) || 0) - (Number(before) || 0);
    if (!diff) return undefined;
    setDelta({ v: diff, k: Date.now() });
    const t = setTimeout(() => setDelta(null), 1700);
    return () => clearTimeout(t);
  }, [value]);
  return delta;
}
export const DeltaBurst = ({ delta }) => (delta ? <span key={delta.k} className={`gx-burst ${delta.v < 0 ? 'is-minus' : ''}`} aria-hidden="true">{delta.v > 0 ? `+${delta.v}` : delta.v}</span> : null);

// ---------- TV: 3D ταμπλό των 5 ηπείρων ----------
// Ενεργή ήπειρος σηκωμένη με χρυσό φως και τα πιόνια όλων πάνω της· κατακτημένες με στέμμα και τη νικήτρια.
export function ContinentBoard({ cg, players = [], active, night = false, u }) {
  const done = {};
  Object.values(cg?.conquered || {}).forEach((c) => { if (c?.continent) done[c.continent] = c; });
  const n = players.length;
  const pawn = n <= 4 ? u(3.5) : n <= 6 ? u(2.9) : u(2.4);
  return (
    <div className="gx-board w-full" style={{ aspectRatio: '3.3 / 1' }}>
      <div className="gx-plane h-full">
        <div className="gx-plane-bg" />
        <div className="gx-route" aria-hidden="true" />
        <div className="gx-tiles h-full">
          {CONTINENTS.map((c) => {
            const isActive = c.id === active;
            const won = done[c.id];
            const img = contArt('card', c.id) || contArt('hero', c.id);
            const icon = contArt('icon', c.id);
            const winner = won?.winner ? players.find((p) => p.id === won.winner) : null;
            return (
              <div key={c.id} className={`gx-tile ${isActive ? 'is-active' : ''} ${won && !isActive ? 'is-done' : ''}`}
                style={night && !isActive ? { filter: 'saturate(.35) brightness(.42)' } : undefined}>
                {img
                  ? <img className="gx-tile-img" src={img} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  : <div className="gx-tile-img" style={{ background: `linear-gradient(160deg, ${CONT_TINT[c.id] || '#333'}, #0b0b10 85%)` }} />}
                <div className="gx-tile-shade" />
                <div className="gx-upright gx-tile-icon" aria-hidden="true">
                  {icon
                    ? <ArtIcon src={icon} size={u(5.4)} bob={isActive} />
                    : <span className="gx-avatar" style={{ width: u(4), height: u(4), fontSize: u(1.9), '--gx-c': '#E8C26B' }}>{c.no}</span>}
                </div>
                {isActive && n > 0 && (
                  <div className="gx-upright gx-pawns">
                    {players.map((p, i) => (
                      <span key={p.id} className="gx-bob" style={{ animationDelay: `${(i % 5) * 0.22}s` }}>
                        <span className="gx-drop inline-block" style={{ animationDelay: `${i * 0.12}s` }}><PlayerAvatar name={p.name} color={colorOf(players, p.id)} size={pawn} /></span>
                      </span>
                    ))}
                  </div>
                )}
                {winner && !isActive && (
                  <div className="gx-upright gx-crown">
                    <ArtIcon id="icon_crown" fallback="👑" size={u(2.6)} />
                    <PlayerAvatar name={winner.name} color={colorOf(players, winner.id)} size={u(3)} />
                  </div>
                )}
                <div className="gx-tile-label" style={{ fontSize: u(1.05) }}>{c.no}. {c.short}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- TV: κλήρωση «ρουλέτα» (μόνο εμφάνιση· το αποτέλεσμα είναι ήδη γνωστό) ----------
// Τα ονόματα γυρίζουν όλο και πιο αργά για ~1.8″ και σταματούν στη νικήτρια της κλήρωσης.
const SPIN_MS = 1800;
export function Roulette({ names = [], winner, at }) {
  const started = useRef(at || Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (Date.now() - started.current >= SPIN_MS || names.length < 2) return undefined;
    const id = setInterval(() => { const t = Date.now(); setNow(t); if (t - started.current >= SPIN_MS) clearInterval(id); }, 60);
    return () => clearInterval(id);
  }, [names.length]);
  const elapsed = now - started.current;
  if (names.length < 2 || elapsed >= SPIN_MS) return <span className="gx-roulette gx-gold gx-roulette-land">{winner}</span>;
  const p = elapsed / SPIN_MS;
  const steps = Math.floor(26 * (1 - (1 - p) * (1 - p)));
  const pool = names.filter((n) => n !== winner);
  return <span className="gx-roulette gx-gold gx-roulette-spin" aria-hidden="true">{pool[steps % pool.length] || winner}</span>;
}

// ---------- Κομφετί (μόνο CSS, σταθερό σχέδιο, ελαφρύ) ----------
const CONFETTI_COLORS = ['#F7E3A8', '#E8C26B', '#FF6FB5', '#FFFFFF', '#C99A34', '#8FE3C6'];
export function Confetti({ count = 80 }) {
  const pieces = React.useMemo(() => {
    let seed = 17;
    const r = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    return Array.from({ length: count }, (_, i) => ({
      left: `${(r() * 100).toFixed(2)}%`, '--c': CONFETTI_COLORS[i % CONFETTI_COLORS.length], '--s': `${6 + Math.round(r() * 8)}px`,
      '--d': `${(4 + r() * 4).toFixed(2)}s`, '--w': `${(-r() * 8).toFixed(2)}s`, '--x': `${Math.round((r() - 0.5) * 220)}px`, '--r': `${Math.round(360 + r() * 720)}deg`,
    }));
  }, [count]);
  return <div className="gx-confetti" aria-hidden="true">{pieces.map((style, i) => <i key={i} style={style} />)}</div>;
}

// ---------- TV: μεγάλη κάρτα γεγονότος (5″) ----------
export function EventTakeover({ kicker, title, text, img, player, color, danger = false, u, roulette = null, at }) {
  const accent = danger ? '#FF453A' : '#E8C26B';
  return (
    <div className="gx-takeover" role="status" aria-live="polite">
      <div className="gx-takeover-card" style={{ boxShadow: `0 0 0 2px ${accent}, 0 0 90px ${danger ? 'rgba(255,69,58,.45)' : 'rgba(232,194,107,.4)'}` }}>
        <div className="gx-takeover-art">
          {img
            ? <img src={img} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            : <div className="absolute inset-0" style={{ background: danger ? 'radial-gradient(80% 120% at 50% 0%, #6b0f1a, #0e0c12)' : 'radial-gradient(80% 120% at 50% 0%, #5a4415, #0e0c12)' }} />}
          {player && (
            <div className="absolute z-[1]" style={{ left: u(2.4), bottom: part(u(7), -0.4) }}>
              <PlayerAvatar name={player} color={color} size={u(7)} />
            </div>
          )}
        </div>
        <div style={{ padding: `${u(4.2)} ${u(2.6)} ${u(2.2)}` }}>
          {kicker && <div className="font-semibold uppercase" style={{ fontSize: u(1), letterSpacing: '.24em', color: '#AEAEB2' }}>{kicker}</div>}
          <div className="gx-takeover-title" style={{ fontSize: u(3.6), marginTop: u(0.4), color: danger ? '#FF6961' : undefined, textShadow: danger ? '0 0 30px rgba(255,69,58,.55)' : undefined }}>
            <span className={danger ? '' : 'gx-gold'}>{roulette ? <Roulette names={roulette} winner={title} at={at} /> : title}</span>
          </div>
          {text && <div style={{ fontSize: u(1.4), color: '#D1D1D6', marginTop: u(0.8), lineHeight: 1.35 }}>{text}</div>}
        </div>
      </div>
    </div>
  );
}

// ---------- Κινητό: κάρτα που γυρίζει ----------
// Μπροστά «Σειρά σου»· γυρίζει με άγγιγμα ή μόνη της μετά από λίγο. Νέο id = ξαναγυρίζει μπροστά.
export function FlipCard({ id, front, back, auto = 2400 }) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    setFlipped(false);
    if (!auto) return undefined;
    const t = setTimeout(() => setFlipped(true), auto);
    return () => clearTimeout(t);
  }, [id, auto]);
  return (
    <div className={`gx-flip ${flipped ? 'is-flipped' : ''}`}>
      <div className="gx-flip-inner">
        <button type="button" className="gx-face gx-press block w-full border-0 bg-transparent p-0 text-left"
          onClick={() => setFlipped(true)} aria-label="Γύρισε την κάρτα" aria-hidden={flipped} tabIndex={flipped ? -1 : 0}
          style={{ pointerEvents: flipped ? 'none' : 'auto', color: 'inherit' }}>
          {front}
        </button>
        <div className="gx-face gx-face-back" aria-hidden={!flipped} style={{ pointerEvents: flipped ? 'auto' : 'none' }}>{back}</div>
      </div>
    </div>
  );
}

// ---------- Κινητό: λωρίδα ηπείρων ----------
export function ContinentStrip({ cg, active }) {
  const done = {};
  Object.values(cg?.conquered || {}).forEach((c) => { if (c?.continent) done[c.continent] = c; });
  return (
    <div className="gx-cont-strip" role="list" aria-label="Οι 5 ήπειροι">
      {CONTINENTS.map((c) => (
        <div key={c.id} role="listitem" className={`gx-cont-chip ${c.id === active ? 'is-active' : ''} ${done[c.id] && c.id !== active ? 'is-done' : ''}`}>
          <ArtIcon src={contArt('icon', c.id)} fallback={done[c.id] && c.id !== active ? '✓' : String(c.no)} size={26} />
          <span>{c.short}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- Tablet: τι δείχνει τώρα η TV ----------
export function onAirLabel(cg, nameOf = (x) => x, now = Date.now()) {
  if (!cg) return { icon: '🎬', text: 'Αναμονή · επιλογή ροής' };
  const status = cg.status || 'transition';
  if (cg.wheel && !cg.wheel.done) return { icon: '🎡', text: `Τροχός ποινών${cg.wheel.pid ? ` · ${nameOf(cg.wheel.pid)}` : ''}`, hot: true };
  if (cg.announce && now - (cg.announce.at || 0) < 12000) return { icon: '📢', text: 'Ανακοίνωση · διαταγή', hot: true };
  if (cg.mandatory?.pending) return { icon: '🎯', text: 'Υποχρεωτική κλήρωση', hot: true };
  if (cg.game) { const g = GAMES.find((x) => x.id === cg.game); if (g) return { icon: g.icon, text: g.name }; }
  if (status === 'finale') return { icon: '👑', text: 'Μεγάλο Φινάλε' };
  if (status === 'standby') return { icon: '⏸', text: 'Standby' };
  if (status === 'transition') return { icon: '⏪', text: 'Previously On · μετάβαση' };
  const trial = cg.trial && !cg.trial.done ? trialOf(cg.trial.id) : null;
  if (trial) return { icon: trial.icon, text: `${trial.title} · ${nameOf(cg.trial.pid)}`, hot: true };
  const card = cg.card ? cardOf(cg.card.id) : null;
  if (card) return { icon: '🎴', text: card.title };
  if (cg.drawn && now - cg.drawn.at < 20000) return { icon: '🎲', text: `Κλήρωση · ${nameOf(cg.drawn.pid)}`, hot: true };
  if (cg.votes?.open) return { icon: '🗳️', text: 'Ψηφοφορία στα κινητά' };
  return { icon: '🗺️', text: 'Ταμπλό ηπείρων' };
}
