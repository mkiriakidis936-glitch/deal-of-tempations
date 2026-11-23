import React, { useEffect, useState } from 'react';
import { loadModesContent, subscribeModesContent } from '@/lib/modesContentStore';
import ModeShell, { Panel, Btn } from '@/components/modes/ModeShell';
import ActBoard from '@/components/modes/ActBoard';
import ActMidnight from '@/components/modes/ActMidnight';
import ActLockdown from '@/components/modes/ActLockdown';
import ActMorning from '@/components/modes/ActMorning';
import BeachBarGame from '@/components/modes/BeachBarGame';
import ActLounge from '@/components/modes/ActLounge';
import VIPUnratedMode from '@/components/modes/VIPUnratedMode';
import { modeMeta, ACT_META, MODE_THEMES } from '@/data/modes/modeRegistry';
import { useModeCtx, useTick, timerStart } from '@/lib/modeKit';
import { applyScenarioCollections } from '@/lib/modesContentStore';
import { consentPending } from '@/lib/consent';
import { ConsentTablet } from '@/components/modes/ConsentCheckIn';
import ModeRecap from '@/components/modes/ModeRecap';
import { BriefingTablet, PhaseGuideTablet, briefingPending } from '@/components/modes/ModeBriefing';
import { finalStandings, pointsOf } from '@/lib/modeRanking';

// Tablet (game master) για τα ψηφιακά modes. Κάθε mode = λίστα από acts.
export default function ModeGame({ state, updateState, onEnd, onQR, playerProfiles = [], playerProfilesReady = true }) {
  const [, setContentReady] = useState(0);
  const [contentRev, setContentRev] = useState(0);
  const [showVip, setShowVip] = useState(false);
  useEffect(() => subscribeModesContent(() => setContentRev((n) => n + 1)), []);
  useEffect(() => {
    let active = true;
    let restoreScenario = null;
    loadModesContent().then(() => {
      if (!active) return;
      if (state.customScenario) restoreScenario = applyScenarioCollections(state.mode, state.customScenario.collections || []);
      setContentReady((n) => n + 1);
    });
    return () => { active = false; restoreScenario?.(); };
  }, [state.mode, state.customScenario?.id, contentRev]);
  const modeContext = useModeCtx(state, updateState);
  const ctx = { ...modeContext, playerProfiles, playerProfilesReady };
  const { mg, setMg, log } = ctx;
  const meta = modeMeta(state.mode);
  const configuredDurationMinutes = Number(state.gameDurationMinutes) || meta?.minutes || 0;
  useEffect(() => {
    // Το χρονόμετρο ξεκινά μετά το consent check-in (το ξεκινά η ConsentTablet), όχι πριν.
    if (!configuredDurationMinutes || mg.timerModeId === state.mode || consentPending(mg)) return;
    setMg({ timer: timerStart(configuredDurationMinutes * 60), timerModeId: state.mode });
  }, [state.mode, configuredDurationMinutes, mg.timerModeId, mg.consentRequired, mg.consent?.done, setMg]);
  useEffect(() => {
    if (!state.gameStartedAt || mg.finishedAll || mg.gameTimeExpired || consentPending(mg)) return undefined;
    const expireIfNeeded = () => {
      if (mg.stop || state.stopActive) return;
      const pausedMs = Math.max(0, Number(state.gamePausedMs || 0));
      const pausedNow = state.gamePausedAt ? Date.now() - state.gamePausedAt : 0;
      const elapsed = Date.now() - state.gameStartedAt - pausedMs - pausedNow;
      if (elapsed >= configuredDurationMinutes * 60000) {
        setMg({ finishedAll: true, gameTimeExpired: true, timer: { ...(mg.timer || {}), running: false, remaining: 0 } });
      }
    };
    expireIfNeeded();
    const id = setInterval(expireIfNeeded, 500);
    return () => clearInterval(id);
  }, [state.gameStartedAt, state.gamePausedMs, state.gamePausedAt, state.stopActive, mg.stop, mg.finishedAll, mg.gameTimeExpired, mg.consentRequired, mg.consent?.done, configuredDurationMinutes, setMg]);
  const acts = meta.acts;
  const actIndex = Math.min(mg.actIndex || 0, acts.length - 1);
  const act = acts[actIndex];
  const actTitleFor = (item) => ACT_META[item].title;
  const theme = MODE_THEMES[state.mode];
  const multi = acts.length > 1;
  useTick(true, 15000);

  function nextAct() {
    if (actIndex + 1 >= acts.length) { setMg({ finishedAll: true }); log('🏁 Το παιχνίδι ολοκληρώθηκε'); return; }
    setMg({ actIndex: actIndex + 1, hostageIdx: (mg.hostageIdx || 0) + 1, actStartedAt: Date.now() });
    log(`➡️ ${actTitleFor(acts[actIndex + 1])}`);
  }
  const finishAll = () => setMg({ finishedAll: true });

  if (consentPending(mg)) {
    return (
      <ModeShell modeId={state.mode} ctx={ctx} state={state} onQR={onQR} onEnd={onEnd} showTimer={false}>
        <ConsentTablet ctx={ctx} updateState={updateState} minutes={configuredDurationMinutes} />
      </ModeShell>
    );
  }

  if (briefingPending(mg, state.mode)) {
    return (
      <ModeShell modeId={state.mode} ctx={ctx} state={state} onQR={onQR} onEnd={onEnd} showTimer={false}>
        <BriefingTablet state={state} setMg={setMg} log={log} />
      </ModeShell>
    );
  }

  if (showVip || mg.vipUnrated?.active || mg.vipUnrated?.completed || mg.vipUnrated?.stoppedAt) {
    return (
      <ModeShell modeId={state.mode} ctx={ctx} state={state} onQR={onQR} onEnd={onEnd}>
        {!mg.vipUnrated?.active && <div className="text-right"><Btn onClick={() => { setShowVip(false); if (mg.vipUnrated?.completed || mg.vipUnrated?.stoppedAt) setMg({ vipUnrated: null }); }}>← Επιστροφή στο παιχνίδι</Btn></div>}
        <VIPUnratedMode ctx={ctx} />
      </ModeShell>
    );
  }

  if (mg.finishedAll) {
    return (
      <ModeShell modeId={state.mode} ctx={ctx} state={state} onQR={onQR} onEnd={onEnd} showTimer={false}>
        <Results ctx={ctx} theme={theme} onEnd={onEnd} state={state} />
      </ModeShell>
    );
  }

  const elapsedMin = Math.floor((Date.now() - (mg.startedAt || Date.now())) / 60000);
  const elapsedLabel = `${Math.floor(elapsedMin / 60)}:${String(elapsedMin % 60).padStart(2, '0')}`;
  const totalMinutes = configuredDurationMinutes || meta.minutes || 300;
  const totalLabel = `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, '0')}`;
  const baseActTotal = acts.reduce((sum, item) => sum + (meta.actDurations?.[item] ?? ACT_META[item].minutes), 0);
  const actMinutes = (a) => Math.max(1, Math.round(((meta.actDurations?.[a] ?? ACT_META[a].minutes) / baseActTotal) * totalMinutes));

  return (
    <ModeShell modeId={state.mode} ctx={ctx} state={state} act={act} onQR={onQR} onEnd={onEnd}>
      {multi && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {acts.map((a, i) => (
            <div
              key={a}
              className="rounded-md p-2 text-xs"
              style={{ background: i === actIndex ? `${theme.accent}33` : '#ffffff0a', border: `1px solid ${i === actIndex ? theme.accent : '#ffffff22'}`, opacity: i < actIndex ? 0.5 : 1 }}
            >
              <div className="font-heading">{i < actIndex ? '✓ ' : ''}{actTitleFor(a).split(' · ')[0]}</div>
              <div className="opacity-70">{actTitleFor(a).split(' · ')[1]} · {actMinutes(a)}′</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 text-xs opacity-80">
        <Btn onClick={() => setShowVip(true)}>🔐 VIP</Btn>
        <span className="opacity-75">Χρόνος παιχνιδιού: {elapsedLabel} / {totalLabel}</span>
      </div>
      <PhaseGuideTablet state={state} />

      {act === 'board' && <ActBoard ctx={ctx} onDone={nextAct} />}
      {act === 'midnight' && <ActMidnight ctx={ctx} onDone={nextAct} />}
      {act === 'lockdown' && <ActLockdown ctx={ctx} standalone={!multi} onDone={(res) => { setMg({ lockdownResult: res }); if (multi) nextAct(); else finishAll(); }} />}
      {act === 'morning' && <ActMorning ctx={ctx} onFinish={finishAll} />}
      {act === 'beach' && <BeachBarGame ctx={ctx} onEnd={finishAll} />}
      {act === 'lounge' && <ActLounge ctx={ctx} state={state} onFinish={finishAll} />}
    </ModeShell>
  );
}

function Results({ ctx, theme, onEnd, state }) {
  const { players, mg } = ctx;
  const tokens = (p) => (mg.tokens || {})[p.id] || 0;
  const ranking = finalStandings(players, mg);
  const queen = mg.bb?.queen && players.find((p) => p.id === mg.bb.queen);
  const loungeQueen = mg.loungeQueen && players.find((p) => p.id === mg.loungeQueen);
  return (
    <Panel title="🏆 Τίτλοι & Απονομή" accent={theme.accent2}>
      {queen && <div className="font-display text-2xl text-center" style={{ color: '#E8C26B' }}>👑 Beach Queen: {queen.name}</div>}
      {loungeQueen && <div className="font-display text-2xl text-center" style={{ color: '#E8C26B' }}>👑 Ultimate Pajama Police Queen: {loungeQueen.name}</div>}
      {mg.lockdownResult && <div className="text-center text-sm opacity-80">Lockdown: {mg.lockdownResult === 'won' ? '✅ απόδραση!' : '💀 αποτυχία'}</div>}
      <div className="space-y-1">
        {ranking.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 rounded px-3 py-2 bg-background/50">
            <span className="font-display text-xl w-8">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
            <b className="flex-1">{p.name}</b>
            <span className="text-sm opacity-70">{tokens(p)}🪙</span>
            <span className="font-heading">{pointsOf(mg, p.id)}</span>
          </div>
        ))}
      </div>
      <ModeRecap state={state} players={players} mg={mg} ranking={ranking} />
      <div className="text-center"><Btn color="bg-emerald-700" onClick={onEnd}>💾 Αρχειοθέτηση & νέο παιχνίδι</Btn></div>
    </Panel>
  );
}
