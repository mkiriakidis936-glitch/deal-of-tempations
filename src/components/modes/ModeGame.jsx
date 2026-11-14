import React, { useEffect, useState } from 'react';
import { loadModesContent } from '@/lib/modesContentStore';
import ModeShell, { Panel, Btn } from '@/components/modes/ModeShell';
import ActBoard from '@/components/modes/ActBoard';
import ActPediGlam from '@/components/modes/ActPediGlam';
import ActMidnight from '@/components/modes/ActMidnight';
import ActLockdown from '@/components/modes/ActLockdown';
import ActMorning from '@/components/modes/ActMorning';
import BeachBarGame from '@/components/modes/BeachBarGame';
import { modeMeta, ACT_META, MODE_THEMES } from '@/data/modes/modeRegistry';
import { useModeCtx, useTick } from '@/lib/modeKit';
import { COLLECTIONS, applyScenarioCollections } from '@/lib/modesContentStore';

// Tablet (game master) για τα 4 νέα modes. Κάθε mode = λίστα από acts.
export default function ModeGame({ state, updateState, onEnd, onQR }) {
  const [, setContentReady] = useState(false);
  useEffect(() => {
    let active = true;
    let restoreScenario = null;
    loadModesContent().then(() => {
      if (!active) return;
      if (state.customScenario) restoreScenario = applyScenarioCollections(state.mode, state.customScenario.collections || []);
      setContentReady(true);
    });
    return () => { active = false; restoreScenario?.(); };
  }, [state.mode, state.customScenario?.id]);
  const ctx = useModeCtx(state, updateState);
  const { mg, setMg, log } = ctx;
  const meta = modeMeta(state.mode);
  const acts = meta.acts;
  const actIndex = Math.min(mg.actIndex || 0, acts.length - 1);
  const act = acts[actIndex];
  const theme = MODE_THEMES[state.mode];
  const multi = acts.length > 1;
  useTick(true, 15000);

  function nextAct() {
    if (actIndex + 1 >= acts.length) { setMg({ finishedAll: true }); log('🏁 Το παιχνίδι ολοκληρώθηκε'); return; }
    setMg({ actIndex: actIndex + 1, hostageIdx: (mg.hostageIdx || 0) + 1, actStartedAt: Date.now() });
    log(`➡️ ${ACT_META[acts[actIndex + 1]].title}`);
  }
  const finishAll = () => setMg({ finishedAll: true });

  if (mg.finishedAll) {
    return (
      <ModeShell modeId={state.mode} ctx={ctx} onQR={onQR} onEnd={onEnd} showTimer={false}>
        <Results ctx={ctx} theme={theme} onEnd={onEnd} />
      </ModeShell>
    );
  }

  const elapsedMin = Math.floor((Date.now() - (mg.startedAt || Date.now())) / 60000);
  const elapsedLabel = `${Math.floor(elapsedMin / 60)}:${String(elapsedMin % 60).padStart(2, '0')}`;
  const totalMinutes = meta.minutes || 300;
  const totalLabel = `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, '0')}`;
  const actMinutes = (a) => meta.actDurations?.[a] ?? ACT_META[a].minutes;

  return (
    <ModeShell modeId={state.mode} ctx={ctx} act={act} onQR={onQR} onEnd={onEnd}>
      {multi && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {acts.map((a, i) => (
            <div
              key={a}
              className="rounded-md p-2 text-xs"
              style={{ background: i === actIndex ? `${theme.accent}33` : '#ffffff0a', border: `1px solid ${i === actIndex ? theme.accent : '#ffffff22'}`, opacity: i < actIndex ? 0.5 : 1 }}
            >
              <div className="font-heading">{i < actIndex ? '✓ ' : ''}{ACT_META[a].title.split(' · ')[0]}</div>
              <div className="opacity-70">{ACT_META[a].title.split(' · ')[1]} · {actMinutes(a)}′</div>
            </div>
          ))}
        </div>
      )}
      <div className="text-xs opacity-60 text-right">Χρόνος παιχνιδιού: {elapsedLabel} / {totalLabel}</div>
      {state.customScenario && (
        <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: theme.accent, background: `${theme.accent}18` }}>
          <div className="font-heading" style={{ color: theme.accent2 }}>CUSTOM SCENARIO: {state.customScenario.name}</div>
          {state.customScenario.description && <div className="mt-1 opacity-80">{state.customScenario.description}</div>}
          {(state.customScenario.collections || []).length > 0 && <div className="mt-2 text-xs opacity-75">Περιεχόμενο σεναρίου: {(state.customScenario.collections || []).map((id) => COLLECTIONS.find((collection) => collection.id === id)?.label || id).join(' · ')}</div>}
        </div>
      )}

      {act === 'pedi_glam' && <ActPediGlam ctx={ctx} onDone={finishAll} />}
      {act === 'board' && <ActBoard ctx={ctx} onDone={nextAct} />}
      {act === 'midnight' && <ActMidnight ctx={ctx} onDone={nextAct} />}
      {act === 'lockdown' && <ActLockdown ctx={ctx} standalone={!multi} onDone={(res) => { setMg({ lockdownResult: res }); if (multi) nextAct(); else finishAll(); }} />}
      {act === 'morning' && <ActMorning ctx={ctx} onFinish={finishAll} />}
      {act === 'beach' && <BeachBarGame ctx={ctx} onEnd={finishAll} />}
    </ModeShell>
  );
}

function Results({ ctx, theme, onEnd }) {
  const { players, mg } = ctx;
  const total = (p) => (mg.scores || {})[p.id] || 0;
  const tokens = (p) => (mg.tokens || {})[p.id] || 0;
  const ranking = [...players].sort((a, b) => total(b) + tokens(b) - (total(a) + tokens(a)));
  const queen = mg.bb?.queen && players.find((p) => p.id === mg.bb.queen);
  return (
    <Panel title="🏆 Τίτλοι & Απονομή" accent={theme.accent2}>
      {queen && <div className="font-display text-2xl text-center" style={{ color: '#FFD700' }}>👑 Beach Queen: {queen.name}</div>}
      {mg.lockdownResult && <div className="text-center text-sm opacity-80">Lockdown: {mg.lockdownResult === 'won' ? '✅ απόδραση!' : '💀 αποτυχία'}</div>}
      <div className="space-y-1">
        {ranking.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 rounded px-3 py-2 bg-background/50">
            <span className="font-display text-xl w-8">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
            <b className="flex-1">{p.name}</b>
            <span className="text-sm opacity-70">{tokens(p)}🪙</span>
            <span className="font-heading">{total(p) + tokens(p)}</span>
          </div>
        ))}
      </div>
      <div className="text-center"><Btn color="bg-emerald-700" onClick={onEnd}>💾 Αρχειοθέτηση & νέο παιχνίδι</Btn></div>
    </Panel>
  );
}
