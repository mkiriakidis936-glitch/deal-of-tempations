import React from 'react';
import { CONTINENTS } from '@/data/modes/campaignContent';
import { contArt, movieArt } from '@/lib/movieArt';

// Ο χάρτης των 5 ηπείρων — στο ύφος της εικόνας του PDF: σκούρο φόντο, γκρι στεριά, ενεργή ήπειρος ροζ-κόκκινη,
// κατακτημένες πράσινες, πολύχρωμο πλαίσιο. Σχηματικά περιγράμματα (equirectangular 1000×500).
const SHAPES = {
  na: ['M70,95 L120,70 L175,58 L240,52 L300,58 L345,70 L330,96 L300,118 L286,140 L262,150 L250,172 L236,196 L214,206 L196,222 L180,240 L170,232 L160,206 L132,186 L108,170 L84,150 L62,128 L50,108 Z',
    'M318,30 L362,22 L392,34 L378,62 L350,74 L330,64 Z'],
  sa: ['M226,248 L262,244 L292,256 L318,272 L330,292 L322,318 L304,344 L292,372 L276,398 L262,428 L250,438 L246,414 L250,384 L246,352 L238,322 L228,292 L220,268 Z'],
  eu: ['M456,74 L488,64 L520,60 L560,66 L578,84 L570,104 L556,120 L536,132 L512,138 L492,146 L472,140 L460,124 L450,104 Z', 'M430,82 L446,78 L448,98 L434,104 Z'],
  af: ['M446,168 L478,156 L516,154 L550,160 L578,176 L600,200 L606,228 L594,262 L578,292 L560,322 L540,352 L520,372 L504,368 L496,336 L490,302 L474,272 L456,250 L440,226 L436,196 Z', 'M612,320 L624,312 L628,340 L616,350 Z'],
  as: ['M582,70 L640,52 L720,44 L800,48 L870,58 L930,74 L950,96 L924,118 L900,140 L872,160 L846,178 L816,196 L792,214 L768,228 L744,220 L720,206 L700,190 L676,178 L654,170 L632,160 L608,150 L590,128 L584,100 Z',
    'M806,236 L838,240 L846,262 L824,270 L804,256 Z', 'M796,296 L842,284 L884,290 L906,318 L898,352 L866,366 L826,364 L798,346 L786,322 Z'],
};
export const REGION_CENTER = { na: [200, 140], sa: [276, 336], eu: [516, 102], af: [522, 262], as: [770, 130] };

const FRAME = ['#6B0000', '#A84300', '#B07A00', '#0A8F0A', '#0019A8'];

// zoom: ήπειρος όπου «ζουμάρει η κάμερα» (TV). route: [από, προς] — κινούμενη διαδρομή ανάμεσα σε δύο ηπείρους.
export default function WorldMap({ active, conquered = {}, names = {}, focus = false, night = false, compact = false, className = '', labels = true, zoom = null, route = null }) {
  const regionOf = (id) => CONTINENTS.find((c) => c.id === id)?.region;
  const zc = zoom && REGION_CENTER[regionOf(zoom)];
  const camera = zc ? `translate(500px, 240px) scale(1.55) translate(${-zc[0]}px, ${-zc[1]}px)` : 'none';
  const [ra, rb] = (route || []).map((id) => REGION_CENTER[regionOf(id)]);
  const done = {};
  Object.values(conquered).forEach((c) => { if (c?.continent) done[c.continent] = c; });
  const fillOf = (c) => (c.id === active ? '#FF3B5C' : done[c.id] ? '#45D98A' : night ? '#4A4A55' : '#9A9A9A');
  const pad = compact ? 6 : 14;
  const frameImg = movieArt('map_frame');
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: '#1E1B24' }}>
      {frameImg && <img src={frameImg} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 h-full w-full object-fill" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
      {!frameImg && FRAME.map((color, i) => (
        <div key={color} aria-hidden="true" className="pointer-events-none absolute" style={{ inset: `${(i + 1) * (compact ? 2 : 4)}px`, border: `${compact ? 2 : 4}px solid ${color}` }} />
      ))}
      <svg viewBox="0 0 1000 480" role="img" aria-label="Ο χάρτης των 5 ηπείρων" className="relative block h-full w-full" style={{ padding: pad * 2.2 }}>
        <style>{'@keyframes wm-route{to{stroke-dashoffset:-60}} .wm-route{animation:wm-route 1.2s linear infinite} .wm-cam{transition:transform 2.4s cubic-bezier(.32,.72,0,1);transform-box:view-box;transform-origin:0 0} @media (prefers-reduced-motion: reduce){.wm-route{animation:none}.wm-cam{transition:none}}'}</style>
        <g className="wm-cam" style={{ transform: camera }}>
        {CONTINENTS.map((c) => {
          const isActive = c.id === active;
          return (
            <g key={c.id} style={{ opacity: focus && active && !isActive && !done[c.id] ? 0.55 : 1, transition: 'opacity .6s' }}>
              {SHAPES[c.region].map((d) => (
                <path key={d} d={d} fill={fillOf(c)} stroke="#2A2733" strokeWidth={compact ? 3 : 2} strokeLinejoin="round"
                  style={{ filter: isActive ? 'drop-shadow(0 0 18px rgba(255,59,92,.75))' : 'none', transition: 'fill .6s' }} />
              ))}
              {labels && (() => {
                const [x, y] = REGION_CENTER[c.region];
                const winner = done[c.id]?.winner ? names[done[c.id].winner] : '';
                const icon = contArt('icon', c.id);
                const sz = compact ? 54 : 64;
                return (
                  <g pointerEvents="none">
                    {icon && <image href={icon} x={x - sz / 2} y={y - sz - (compact ? 14 : 22)} width={sz} height={sz} preserveAspectRatio="xMidYMid meet" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.6))' }} />}
                    <text x={x} y={y} textAnchor="middle" fontSize={compact ? 26 : 19} fontWeight="800" fill={isActive || done[c.id] ? '#0B0B0F' : '#1E1B24'} style={{ letterSpacing: '0.04em' }}>{c.no}</text>
                    {!compact && <text x={x} y={y + 22} textAnchor="middle" fontSize={c.region === 'sa' || c.region === 'eu' ? 11 : 13} fontWeight="700" fill={isActive || done[c.id] ? '#0B0B0F' : '#26232D'}>{c.short}</text>}
                    {!compact && winner && <text x={x} y={y + 40} textAnchor="middle" fontSize="13" fontWeight="800" fill="#0B3D22">👑 {winner}</text>}
                  </g>
                );
              })()}
            </g>
          );
        })}
        {ra && rb && (
          <path className="wm-route" d={`M${ra[0]},${ra[1]} Q${(ra[0] + rb[0]) / 2},${Math.min(ra[1], rb[1]) - 90} ${rb[0]},${rb[1]}`} fill="none" stroke="#FFD166" strokeWidth="4" strokeDasharray="14 16" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(255,209,102,.8))' }} />
        )}
        </g>
      </svg>
    </div>
  );
}
