import React, { useEffect, useRef, useState } from 'react';
import { WantedStars, ArtIcon, colorOf } from '@/components/modes/MovieGameUI';

// 11.0.0 · Κομμάτια game show για την TV: podium διαγωνιζομένων, μαρκίζα με λαμπιόνια, κυλιόμενη μπάρα ειδήσεων.
// Μόνο εμφάνιση.

const initial = (name = '') => (name.trim()[0] || '?').toUpperCase();

// Σειρά από βάθρα. Η πρώτη στο κέντρο και ψηλότερα (σαν τηλεπαιχνίδι), οι υπόλοιπες εναλλάξ δεξιά/αριστερά.
export function Podiums({ rank, players, u, highlight = null, compact = false }) {
  const n = rank.length;
  // 12.0.0 · Ζωντανή κατάταξη: ποια ανέβηκε/έπεσε και πόσους πόντους πήρε (για 7″).
  const prevRef = useRef(null);
  const [moves, setMoves] = useState({});
  const sig = rank.map((p) => `${p.id}:${p.score}`).join('|');
  useEffect(() => {
    const prev = prevRef.current;
    const next = Object.fromEntries(rank.map((p, i) => [p.id, { i, score: p.score }]));
    prevRef.current = next;
    if (!prev) return;
    const m = {};
    rank.forEach((p, i) => { const o = prev[p.id]; if (o && (o.i !== i || o.score !== p.score)) m[p.id] = { d: o.i - i, delta: p.score - o.score, at: Date.now() }; });
    if (Object.keys(m).length) setMoves((x) => ({ ...x, ...m }));
  }, [sig]);
  const now = Date.now();
  const centered = [];
  rank.forEach((p, i) => { if (i % 2) centered.push({ p, i }); else centered.unshift({ p, i }); }); // 1η στη μέση
  const base = compact || n > 6 ? 5 : 6;
  return (
    <div className="show-podiums" style={{ gap: u(n > 6 ? 0.6 : 1.1) }}>
      {centered.map(({ p, i }) => {
        const lead = i === 0 && p.score > 0;
        const h = base - Math.min(i, 4) * 0.4;
        const pc = colorOf(players, p.id);
        return (
          <div key={`${p.id}:${moves[p.id]?.at || 0}`} className={`show-podium ${lead ? 'is-lead' : ''} ${moves[p.id] && now - moves[p.id].at < 7000 ? (moves[p.id].d > 0 ? 'is-up' : moves[p.id].d < 0 ? 'is-down' : 'is-score') : ''}`} style={{ '--pc': pc, maxWidth: u(n > 6 ? 11 : 15) }}>
            {moves[p.id] && now - moves[p.id].at < 7000 && (
              <div className="show-move" style={{ fontSize: u(1.1), top: u(-3.2) }}>
                {moves[p.id].d > 0 ? `▲${moves[p.id].d}` : moves[p.id].d < 0 ? `▼${-moves[p.id].d}` : ''}{moves[p.id].delta ? ` ${moves[p.id].delta > 0 ? '+' : ''}${moves[p.id].delta}` : ''}
              </div>
            )}
            <div className="relative flex items-center justify-center" style={{ marginBottom: u(-0.9), zIndex: 2 }}>
              <span className="gx-avatar" style={{ '--gx-c': pc, width: u(n > 6 ? 3.6 : 4.4), height: u(n > 6 ? 3.6 : 4.4), fontSize: u(n > 6 ? 1.6 : 2), borderWidth: 0, outline: highlight === p.id ? '4px solid #2de2ff' : 'none', outlineOffset: 4 }}>{initial(p.name)}</span>
              {lead && <span className="absolute" style={{ top: u(-2), fontSize: u(2) }} aria-hidden="true">👑</span>}
            </div>
            <div className="show-podium-plate" style={{ fontSize: u(n > 6 ? 0.95 : 1.15), padding: `${u(1.1)} ${u(0.5)} ${u(0.3)}` }}>{p.name}</div>
            <div className="show-podium-body" style={{ minHeight: u(h), paddingTop: u(0.5), paddingBottom: u((4 - Math.min(i, 4)) * 0.45), gap: u(0.35) }}>
              <div className="show-led-window" style={{ minWidth: '74%', padding: `${u(0.15)} ${u(0.6)}` }}>
                <span className="show-led" style={{ fontSize: u(n > 6 ? 2 : 2.6) }}>{p.score}</span>
              </div>
              <div className="flex items-center justify-center tabular-nums text-white/85" style={{ gap: u(0.35), fontSize: u(0.85) }}>
                <WantedStars n={p.stats?.wanted || 0} size={u(0.8)} />
                <ArtIcon id="icon_loot" fallback="💰" size={u(1)} />{p.stats?.loot ?? 0}
                <ArtIcon id="icon_token" fallback="🪙" size={u(0.9)} />{p.stats?.tokens ?? 0}
              </div>
              <div className="show-podium-stripe" style={{ marginTop: 'auto' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Μαρκίζα με λαμπιόνια (τίτλος πράξης).
export function MarqueeSign({ kicker, title, u, cool = false }) {
  return (
    <div className="show-sign show-bulbs inline-flex flex-col items-center text-center" style={{ '--bulb': u(0.75), padding: `${u(0.9)} ${u(2.6)}` }}>
      {kicker && <div className="show-kicker" style={{ fontSize: u(0.85) }}>{kicker}</div>}
      <div className={`show-title ${cool ? 'show-title--cool' : ''}`} style={{ fontSize: u(2.7) }}>{title}</div>
    </div>
  );
}

// Κυλιόμενη μπάρα ειδήσεων στο κάτω μέρος της TV.
export function Ticker({ items, u, tag = 'LIVE' }) {
  const list = items.filter(Boolean);
  if (!list.length) return null;
  const row = list.map((t, i) => <span key={i}>★ {t}</span>);
  return (
    <div className="show-ticker" style={{ height: u(2.4), fontSize: u(1.05) }}>
      <div className="show-ticker-tag">{tag}</div>
      <div className="min-w-0 flex-1 overflow-hidden"><div className="show-ticker-track">{row}{row}</div></div>
    </div>
  );
}
