import React, { useCallback, useEffect, useState } from 'react';
import { Tv, Tablet, Smartphone } from 'lucide-react';
import SectionErrorBoundary from '@/components/shared/SectionErrorBoundary';
import { modeMeta } from '@/data/modes/modeRegistry';
import { modeDisplayName } from '@/data/gameConfig';
import { consentOf } from '@/lib/consent';
import { fmt, timerLeft, useTick } from '@/lib/modeKit';
import { AdminAvatar } from '@/components/admin/AdminGameUI';

// Τριπλή προεπισκόπηση: TV · Tablet · κινητό, δίπλα-δίπλα, ΜΟΝΟ για προβολή.
// - TV: η πραγματική σελίδα /tv σε λειτουργία preview (όπως ήταν).
// - Tablet: σύνοψη μόνο-ανάγνωσης από την κατάσταση της παρτίδας (δεν ανοίγει δεύτερο Tablet,
//   ώστε να μην τρέξει δεύτερη φορά η λογική του παιχνιδιού).
// - Κινητό: η σελίδα /play/preview (ίδια οθόνη με το κινητό της παίκτριας, με «νεκρές» ενέργειες,
//   χωρίς παρουσία/PIN/ουρά αλλαγών, χωρίς πατήματα).

function useFit(baseWidth) {
  const [scale, setScale] = useState(0.3);
  const ref = useCallback((node) => {
    if (!node) return;
    const fit = () => setScale(node.clientWidth / baseWidth);
    fit();
    new ResizeObserver(fit).observe(node);
  }, [baseWidth]);
  return [ref, scale];
}

export function Frame({ kind, icon: Icon, label, note, children }) {
  return (
    <figure className={`adm-device adm-device--${kind}`}>
      <figcaption className="adm-device-cap">
        <Icon size={14} aria-hidden="true" />
        <span>{label}</span>
        {note && <span className="adm-device-note">{note}</span>}
      </figcaption>
      <div className="adm-device-body">{children}</div>
    </figure>
  );
}

export function Scaled({ width, height, children, className = '' }) {
  const [ref, scale] = useFit(width);
  return (
    <div ref={ref} className={`adm-device-screen ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }} className="adm-device-canvas">
        {children}
      </div>
    </div>
  );
}

const scoreOf = (state, p) => {
  const mg = state.mg || {};
  if (mg.lounge?.stats?.[p.id]?.loot !== undefined) return `${Math.round(mg.lounge.stats[p.id].loot).toLocaleString('el-GR')}€`;
  const n = (mg.scores?.[p.id] ?? p.score ?? p.points ?? 0) + (mg.tokens?.[p.id] || 0);
  return n;
};

export function TabletSummary({ state }) {
  useTick(true, 1000);
  const mg = state.mg || {};
  const players = state.players || [];
  const stopped = !!(state.stopActive || mg.stop);
  const meta = modeMeta(state.mode);
  const act = meta?.acts?.[Math.min(mg.actIndex || 0, (meta?.acts?.length || 1) - 1)];
  const left = mg.timer ? timerLeft(mg.timer) : 0;
  const card = state.activeCard;
  const needsConsent = !!mg.consentRequired && !mg.consent?.done;
  return (
    <div className="adm-tab-sim">
      <div className="adm-tab-sim-top">
        <div className="min-w-0">
          <div className="adm-tab-sim-eyebrow">TABLET · ΔΙΟΡΓΑΝΩΤΡΙΑ</div>
          <div className="adm-tab-sim-title">{modeDisplayName(state.mode) || meta?.name || 'Παιχνίδι'}</div>
          <div className="adm-tab-sim-sub">{act ? `Πράξη: ${act}` : `Στάδιο ${state.stage ?? '—'}`}</div>
        </div>
        <div className={`adm-tab-sim-status ${stopped ? 'is-stop' : ''}`}>{stopped ? '⏸ ΣΤΟΠ' : left > 0 ? `⏱ ${fmt(left)}` : '● ΣΕ ΕΞΕΛΙΞΗ'}</div>
      </div>
      {needsConsent && (
        <div className="adm-tab-sim-banner">Περιμένει συναίνεση: {players.filter((p) => consentOf(mg, p.id).confirmed).length}/{players.length} έτοιμες</div>
      )}
      {card && (
        <div className="adm-tab-sim-card">
          <span className="text-3xl" aria-hidden="true">{card.icon || '🎴'}</span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-bold">{card.name}</span>
            <span className="line-clamp-2 block text-sm opacity-70">{card.text}</span>
          </span>
        </div>
      )}
      <div className="adm-tab-sim-grid">
        {players.map((p) => (
          <div key={p.id} className="adm-tab-sim-player">
            <AdminAvatar name={p.name} seed={p.id} size={46} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold">{p.name}</div>
              <div className="text-xs opacity-55">{mg.consentRequired ? (consentOf(mg, p.id).confirmed ? '✓ όρια' : '… όρια') : ' '}</div>
            </div>
            <div className="adm-tab-sim-score">{scoreOf(state, p)}</div>
          </div>
        ))}
        {!players.length && <div className="col-span-2 py-10 text-center opacity-60">Δεν υπάρχουν παίκτριες ακόμα.</div>}
      </div>
    </div>
  );
}

export default function AdminTriplePreview({ code, state = {}, defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  const players = state.players || [];
  const [pid, setPid] = useState(players[0]?.id || '');
  useEffect(() => { if (!players.some((p) => p.id === pid)) setPid(players[0]?.id || ''); }, [players, pid]);
  const me = players.find((p) => p.id === pid) || null;

  return (
    <section className="adm-card adm-triple">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="adm-card-title">Τριπλή προεπισκόπηση</div>
          <p className="text-xs text-foreground/55">Ό,τι βλέπουν τώρα TV, Tablet και κινητό. Μόνο προβολή: τίποτα εδώ δεν πατιέται ούτε στέλνεται.</p>
        </div>
        {on && players.length > 0 && (
          <div className="adm-seg" role="radiogroup" aria-label="Κινητό ποιας παίκτριας">
            {players.slice(0, 8).map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={p.id === pid} className={p.id === pid ? 'is-on' : ''} onClick={() => setPid(p.id)} title={p.name}>
                <AdminAvatar name={p.name} seed={p.id} size={24} />
                <span className="hidden sm:inline">{p.name}</span>
              </button>
            ))}
          </div>
        )}
        <button type="button" className="adm-pill" onClick={() => setOn((v) => !v)}>{on ? 'Απόκρυψη' : 'Προβολή'}</button>
      </div>

      {on ? (
        <div className="adm-triple-grid">
          <Frame kind="tv" icon={Tv} label="TV" note="ζωντανά">
            <Scaled width={1280} height={720}>
              <iframe title="Προεπισκόπηση TV" src={`/tv?code=${encodeURIComponent(code)}&preview=1`} style={{ width: 1280, height: 720, border: 0 }} />
            </Scaled>
          </Frame>
          <Frame kind="tablet" icon={Tablet} label="Tablet" note="σύνοψη">
            <Scaled width={1024} height={768}>
              <SectionErrorBoundary name="preview-tablet"><TabletSummary state={state} /></SectionErrorBoundary>
            </Scaled>
          </Frame>
          <Frame kind="phone" icon={Smartphone} label={me ? `Κινητό · ${me.name}` : 'Κινητό'}>
            <Scaled width={390} height={844} className="adm-phone-screen">
              {me ? (
                <iframe title={`Προεπισκόπηση κινητού · ${me.name}`} tabIndex={-1} src={`/play/preview?code=${encodeURIComponent(code)}&player=${encodeURIComponent(me.id)}`} style={{ width: 390, height: 844, border: 0, pointerEvents: 'none' }} />
              ) : <div className="adm-device-empty">Δεν υπάρχουν παίκτριες για προβολή.</div>}
            </Scaled>
          </Frame>
        </div>
      ) : (
        <div className="adm-triple-off">
          <span><Tv size={18} /></span><span><Tablet size={18} /></span><span><Smartphone size={18} /></span>
          <div className="text-xs text-foreground/55">Η προεπισκόπηση είναι κλειστή για εξοικονόμηση ενέργειας.</div>
        </div>
      )}
    </section>
  );
}
