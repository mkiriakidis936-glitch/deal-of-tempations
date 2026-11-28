import React, { useEffect, useRef, useState } from 'react';
import ActCampaign from '@/components/modes/ActCampaign';
import CampaignMobile from '@/components/modes/CampaignMobile';
import { hasBots } from '@/lib/rehearsalBots';
import { isFullAutoAllowed } from '@/lib/movieFullAuto';

// 12.1.0 · «Παράθυρα» στην TV για την πρόβα (/tv?code=…&view=wall):
// κύρια TV (σε δικό της παράθυρο, με ήχο) + καθρέφτης Tablet (μόνο ανάγνωση) + κινητά των εικονικών παικτριών.
// ΙΔΙΩΤΙΚΟΤΗΤΑ: λειτουργεί μόνο στην πρόβα. Κινητά αληθινών παικτριών δεν εμφανίζονται ποτέ (κρυφές αποστολές/όρια),
// και ο καθρέφτης του Tablet μόνο όταν παίζουν αποκλειστικά εικονικές.

const noop = () => {};

// Χωράει ένα περιεχόμενο σταθερού πλάτους (π.χ. 1180px Tablet, 390px κινητό) μέσα σε ένα παράθυρο.
function Scaled({ width, height, children, label }) {
  const box = useRef(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const fit = () => setScale(Math.min(el.clientWidth / width, height ? el.clientHeight / height : Infinity));
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [width, height]);
  return (
    <div className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl" style={{ boxShadow: '0 0 0 2px rgba(120,180,255,.45), 0 0 24px rgba(45,226,255,.25)', background: '#070320' }}>
      <div className="show-kicker shrink-0 px-3 py-1 text-[11px]" style={{ background: 'rgba(18,7,58,.9)' }}>{label}</div>
      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden" inert="" aria-hidden="true">
        <div style={{ width, height: height || 'auto', transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>{children}</div>
      </div>
    </div>
  );
}

export default function RehearsalWall({ session, state }) {
  const players = state?.players || [];
  const bots = players.filter((p) => p.bot);
  const onlyBots = isFullAutoAllowed(players);
  const code = session?.sessionCode || '';
  if (!hasBots(players)) {
    return (
      <div className="show-stage flex min-h-screen items-center justify-center p-10 text-center text-white">
        <div className="max-w-2xl space-y-3">
          <div className="show-title text-5xl">🪟 Παράθυρα</div>
          <p className="text-xl text-white/80">Τα παράθυρα (TV + Tablet + κινητά) ανοίγουν μόνο στην πρόβα με εικονικές παίκτριες, για να μη φαίνονται ποτέ τα κρυφά των αληθινών κινητών.</p>
          <p className="text-white/60">Tablet → Ταινία → «🤖 Βάλε εικονικές».</p>
        </div>
      </div>
    );
  }
  const mg = state.mg || {};
  const nameOf = (id) => players.find((p) => p.id === id)?.name || '—';
  const ctx = { players, mg, setMg: noop, log: noop, nameOf, stopped: !!(mg.stop || state.stopActive) };
  const phones = bots.slice(0, 4);
  return (
    <div className="show-stage grid h-screen w-screen overflow-hidden text-white" style={{ gridTemplateColumns: '64fr 36fr', gap: 12, padding: 12 }}>
      <div className="grid min-h-0" style={{ gridTemplateRows: 'auto 1fr', gap: 12 }}>
        <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '16 / 9', boxShadow: '0 0 0 3px #ffd23f, 0 0 30px rgba(255,170,0,.45)' }}>
          <div className="show-lower absolute left-3 top-3 z-10 text-sm"><span>📺 TV · ζωντανά</span></div>
          <iframe title="TV" src={`/tv?code=${encodeURIComponent(code)}&embed=1`} className="h-full w-full border-0" allow="autoplay; fullscreen" />
        </div>
        <div className="grid min-h-0" style={{ gridTemplateColumns: `repeat(${Math.max(1, phones.length)}, minmax(0, 1fr))`, gap: 12 }}>
          {phones.map((p) => (
            <Scaled key={p.id} width={390} height={844} label={`📱 ${p.name}`}>
              <div className="min-h-[844px] p-3" style={{ background: 'var(--show-ink)' }}><CampaignMobile state={state} me={p} sendAction={noop} /></div>
            </Scaled>
          ))}
        </div>
      </div>
      {onlyBots ? (
        <Scaled width={1180} label="📟 Tablet (καθρέφτης)">
          <div className="p-3" style={{ background: 'var(--show-ink)' }}><ActCampaign ctx={ctx} state={state} sessionCode={code} updateState={noop} onFinish={noop} mirror /></div>
        </Scaled>
      ) : (
        <div className="flex items-center justify-center rounded-2xl p-6 text-center text-white/70" style={{ boxShadow: '0 0 0 2px rgba(120,180,255,.45)' }}>📟 Ο καθρέφτης του Tablet εμφανίζεται μόνο όταν παίζουν αποκλειστικά εικονικές παίκτριες.</div>
      )}
    </div>
  );
}
