import React, { useEffect, useState } from 'react';
import { modeMeta, ACT_META } from '@/data/modes/modeRegistry';
import { fmt, timerLeft, useTick, setGameStopActive } from '@/lib/modeKit';
import GameDurationClock from '@/components/shared/GameDurationClock';
import { Dock, DockItem } from '@/design/ui';

// Κοινό περίβλημα όλων των νέων modes: τίτλος, χρονόμετρο, ΣΤΟΠ για όλες, ημερολόγιο γεγονότων.
export default function ModeShell({ modeId, ctx, state, act, children, onQR, onEnd, showTimer = true }) {
  const meta = modeMeta(modeId);
  const actTitle = ACT_META[act]?.title || act;
  const [showLog, setShowLog] = useState(false);
  const { mg, stopped, toggleStop, centralStopped } = ctx;
  useEffect(() => { setGameStopActive(stopped); }, [stopped]);

  return (
    <div className="mode-shell ui-page text-foreground" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
      <div className="max-w-5xl mx-auto space-y-3">
        <header className="flex items-center justify-between gap-3 pr-36">
          <div className="min-w-0">
            {act && <div className="ui-eyebrow">{actTitle}</div>}
            <div className="ui-title ui-title--gold truncate">{meta?.icon ? `${meta.icon} ` : ''}{meta?.name}</div>
          </div>
          <div className="flex items-center gap-2">
            <GameDurationClock state={state} inline />
            {showTimer && mg.timer && <ModeTimer timer={mg.timer} />}
          </div>
        </header>

        {children}
      </div>

      <button
        onClick={toggleStop}
        disabled={centralStopped}
        className="ui-btn ui-btn--danger fixed top-3 right-3 z-50" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        aria-label="Στοπ"
      >
        {centralStopped ? '⏸ ΠΑΥΣΗ DIRECTOR' : stopped ? '▶ ΣΥΝΕΧΕΙΑ' : '⏹ ΣΤΟΠ'}
      </button>

      <Dock />
      <DockItem order={2}>
        {onQR && <button onClick={onQR} className="ui-btn">📱 QR</button>}
        {ctx.undo && (mg.undo || []).length > 0 && (
          <button
            onClick={() => { const e = ctx.undo(); if (e) ctx.log(`↩️ Αναίρεση: ${e.k === 'tokens' ? 'tokens' : 'σκορ'} ${ctx.nameOf(e.pid)} (${e.n > 0 ? '-' : '+'}${Math.abs(e.n)})`); }}
            className="ui-btn"
          >
            ↩️ Αναίρεση
          </button>
        )}
        <button onClick={() => setShowLog(true)} className="ui-btn">📜 Ιστορικό</button>
        {ctx.setMg && <button onClick={() => ctx.setMg({ tvSfxOff: !mg.tvSfxOff })} className="ui-btn" aria-pressed={!mg.tvSfxOff}>{mg.tvSfxOff ? '🔇 Ήχοι TV' : '🔊 Ήχοι TV'}</button>}
      </DockItem>
      <DockItem order={9}>
        {onEnd && (
          <button
            onClick={() => { if (window.confirm('Να κλείσει το παιχνίδι και να αρχειοθετηθεί η συνεδρία;')) onEnd(); }}
            className="ui-btn"
          >
            🏁 Τέλος
          </button>
        )}
      </DockItem>

      {stopped && (
        <div className="mode-stop-overlay fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="ui-title" style={{ fontSize: 64, color: '#fff' }}>⏸ ΣΤΟΠ</div>
          <p className="text-lg sm:text-2xl font-body text-white max-w-xl">
            Όλα σταματούν. Λύστε αμέσως κάθε δέσιμο, κατεβάστε τις μάσκες και ελέγξτε ότι όλες είναι ΟΚ πριν συνεχίσετε.
          </p>
          {centralStopped
            ? <div className="rounded-lg bg-black/40 px-5 py-3 text-sm text-white">Η παύση ελέγχεται αποκλειστικά από τον Director.</div>
            : <button onClick={toggleStop} className="ui-btn ui-btn--xl" style={{ background: '#fff', color: '#000' }}>▶ Συνέχεια — όλες ΟΚ</button>}
        </div>
      )}

      {showLog && (
        <div className="fixed inset-0 z-[70] bg-black/80 p-4 overflow-y-auto" onClick={() => setShowLog(false)}>
          <div className="ui-card max-w-md mx-auto space-y-1" onClick={(e) => e.stopPropagation()}>
            <div className="ui-title mb-2" style={{ fontSize: 22 }}>📜 Ιστορικό</div>
            {(mg.log || []).length === 0 && <div className="text-sm opacity-60">Δεν έχει γίνει κάτι ακόμα.</div>}
            {(mg.log || []).map((l, i) => (
              <div key={i} className="text-sm border-b border-border/40 py-1">
                <span className="opacity-50 text-xs mr-2">{new Date(l.t).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}</span>
                {l.text}
              </div>
            ))}
            <button onClick={() => setShowLog(false)} className="ui-btn ui-btn--block mt-3">Κλείσιμο</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeTimer({ timer }) {
  useTick(true, 500);
  const left = timerLeft(timer);
  return <div className={`mode-timer text-3xl sm:text-5xl ${left <= 60 ? 'is-danger' : ''}`}>{fmt(left)}</div>;
}

export function RestraintNote() {
  return (
    <div className="rounded-xl px-3 py-2 text-[14px]" style={{ background: 'var(--ui-gold-soft)', color: 'var(--ui-gold-hi)' }}>
      🎀 Δέσιμο: χαλαρά και ποτέ σε σφιχτό κόμπο, ψαλίδι/εύκολη λύση δίπλα σου, ποτέ μόνη. Όποια πει «ΣΤΟΠ» λύνεται αμέσως.
    </div>
  );
}

// Πάνελ & κουμπιά όλων των modes στο Tablet: χτίζονται πάνω στο ενιαίο design system.
const toneOfAccent = (accent = '') => {
  const a = String(accent).toUpperCase();
  if (/E8C26B|F0B85A|F7E3A8/.test(a)) return 'gold';
  if (/FF453A|FF375F|DC2626|B91C1C/.test(a)) return 'danger';
  return '';
};

export function Panel({ title, children, className = '', accent }) {
  const tone = toneOfAccent(accent);
  return (
    <section className={`ui-card space-y-3 ${tone ? `ui-card--${tone}` : ''} ${className}`}>
      {title && <h3 className="text-[19px] font-semibold leading-snug" style={{ color: 'var(--ui-text)' }}>{title}</h3>}
      {children}
    </section>
  );
}

const variantOfColor = (color = '') => {
  if (/emerald|green/.test(color)) return 'success';
  if (/red-|rose-|destructive/.test(color)) return 'danger';
  if (/amber|yellow|orange|E8C26B|primary/.test(color)) return 'primary';
  return '';
};

export function Btn({ children, color = 'bg-secondary', className = '', ...props }) {
  const variant = variantOfColor(color);
  return (
    <button type="button" className={`ui-btn select-none ${variant ? `ui-btn--${variant}` : ''} ${className}`} {...props}>
      {children}
    </button>
  );
}
