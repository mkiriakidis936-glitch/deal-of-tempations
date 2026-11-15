import React from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { getActiveSessionCode, setActiveSessionCode, subscribeActiveSession } from '@/lib/activeSession';
import StopButton from '@/components/comic/StopButton';
import ComicButton from '@/components/comic/ComicButton';
import SetupScreen from '@/components/tablet/SetupScreen';
import PatrolScreen from '@/components/tablet/PatrolScreen';
import InterrogationScreen from '@/components/tablet/InterrogationScreen';
import FinaleScreen from '@/components/tablet/FinaleScreen';
import BombEventScreen from '@/components/tablet/BombEventScreen';
import ArrestHeistScreen from '@/components/tablet/ArrestHeistScreen';
import MarathonScreen from '@/components/tablet/MarathonScreen';
import PajamaGame from '@/components/pajama/PajamaGame';
import ModeGame from '@/components/modes/ModeGame';
import { isNewMode } from '@/data/modes/modeRegistry';
import PajamaTVPreview from '@/components/tablet/PajamaTVPreview';
import PajamaForcePhase from '@/components/tablet/PajamaForcePhase';
import PajamaMiniBar from '@/components/tablet/PajamaMiniBar';
import WantedStrobePanic from '@/components/shared/WantedStrobePanic';
import MobileVotePanel from '@/components/shared/MobileVotePanel';
import StageZero from '@/components/tablet/StageZero';
import FlashbangOverlay from '@/components/shared/FlashbangOverlay';
import BountyMultiplier from '@/components/shared/BountyMultiplier';
import SessionQRCode from '@/components/shared/SessionQRCode';
import TabletToolbar from '@/components/tablet/TabletToolbar';
import TabletStatusStrip from '@/components/tablet/TabletStatusStrip';
import SplashScreen from '@/components/shared/SplashScreen';
import JuryTrial from '@/components/tablet/JuryTrial';
import ShoeRoulette from '@/components/tablet/ShoeRoulette';
import TemptationSlots from '@/components/tablet/TemptationSlots';
import KarmaSlots from '@/components/tablet/KarmaSlots';
import LastWish from '@/components/tablet/LastWish';
import BlindOracle from '@/components/tablet/BlindOracle';
import BarefootCrypt from '@/components/tablet/BarefootCrypt';
import MidnightPact from '@/components/tablet/MidnightPact';
import GrandJuryControl from '@/components/tablet/GrandJuryControl';
import ShowDirector from '@/components/tablet/ShowDirector';
import PrivateMessageSender from '@/components/tablet/PrivateMessageSender';
import SealedVoteControl from '@/components/tablet/SealedVoteControl';
import EventQueue from '@/components/tablet/EventQueue';
import AudioControl from '@/components/tablet/AudioControl';
import FinalePresentation from '@/components/tablet/FinalePresentation';
import SyncTimerControl from '@/components/tablet/SyncTimerControl';
import TurnOrderPanel from '@/components/tablet/TurnOrderPanel';
import LiarsPoker from '@/components/tablet/LiarsPoker';
import TriviaKnowMe from '@/components/tablet/TriviaKnowMe';
import FinalDeal from '@/components/tablet/FinalDeal';
import ControlRoom from '@/components/tablet/ControlRoom';
import BlackmailMarket from '@/components/tablet/BlackmailMarket';
import NightDirectorHost from '@/components/night/NightDirectorHost';
import { useSyncTimerAutoFire } from '@/hooks/useSyncTimerAutoFire';
import { calculateMostWanted, getWantedLevel } from '@/lib/gameLogic';
import { base44 } from '@/api/base44Client';
import { awardAchievements } from '@/lib/achievements';
import { setGameStopActive } from '@/lib/modeKit';
import { canAssignVipActivity } from '@/lib/playerIntelligence';
import { getExtra4, pauseExtra4Timers, resumeExtra4Timers, getExtra4SceneItems, getExtra4ModeSceneIndex } from '@/lib/extra4';
import LockdownMiniGames from '@/components/modes/LockdownMiniGames';

export default function Tablet() {
  const { session, state, loading, updateState, createSession, deleteSession, refresh, joinByCode } = useGameSession();
  React.useEffect(() => {
    if (!state?.mode) return;
    const tactical = state.extra4?.tactical || {};
    if (tactical.modeId !== state.mode) {
      updateState({
        ...(state.mg ? { mg: { ...state.mg, intensity: 'standard' } } : { intensity: 'standard' }),
        extra4: {
          ...(state.extra4 || {}),
          tactical: { ...tactical, level: 'standard', modeId: state.mode },
        },
      });
    }
  }, [state?.mode, state?.extra4?.tactical?.modeId, updateState]);

  React.useEffect(() => {
    if (!state?.mode) return;
    const extra4 = getExtra4(state);
    const items = getExtra4SceneItems(state);
    if (!items.length) return;
    const defaultOrder = items.map((item) => item.id);
    const modeIndex = Math.max(0, Math.min(items.length - 1, getExtra4ModeSceneIndex(state)));
    const modeChanged = extra4.scenes.modeId !== state.mode;
    const savedOrder = !modeChanged && Array.isArray(extra4.scenes.order) ? extra4.scenes.order : [];
    const order = [...savedOrder.filter((id) => defaultOrder.includes(id)), ...defaultOrder.filter((id) => !savedOrder.includes(id))];
    if (modeChanged) {
      updateState({ extra4: { scenes: { ...extra4.scenes, auto: true, modeId: state.mode, order: defaultOrder, currentIndex: modeIndex, current: items[modeIndex]?.label || items[0].label } } });
      return;
    }
    if (extra4.scenes.auto === false) return;
    const index = Math.max(0, order.indexOf(items[modeIndex]?.id));
    const current = items.find((item) => item.id === order[index])?.label || items[0].label;
    if (extra4.scenes.current === current && extra4.scenes.currentIndex === index && JSON.stringify(extra4.scenes.order || []) === JSON.stringify(order)) return;
    updateState({ extra4: { scenes: { ...extra4.scenes, modeId: state.mode, order, currentIndex: index, current } } });
  }, [state?.mode, state?.mg?.actIndex, state?.pajama?.actIndex, state?.stage, state?.marathonStage, state?.extra4?.scenes?.auto, state?.extra4?.scenes?.modeId, state?.extra4?.scenes?.current, state?.extra4?.scenes?.currentIndex, state?.extra4?.scenes?.order, updateState]);

  React.useEffect(() => {
    const extraStatus = state?.extra4?.control?.status;
    setGameStopActive(!!(state?.stopActive || state?.mg?.stop || extraStatus === 'paused' || extraStatus === 'emergency'));
  }, [state?.stopActive, state?.mg?.stop, state?.extra4?.control?.status]);

  // Sync με Admin & links: κωδικός στο URL ή η ενεργή συνεδρία του Admin ανοίγει πάντα εδώ.
  React.useEffect(() => {
    const codeParam = new URLSearchParams(window.location.search).get('code');
    if (codeParam) {
      joinByCode(codeParam.trim().toUpperCase());
      return undefined;
    }
    let alive = true;
    getActiveSessionCode().then((code) => { if (alive && code) joinByCode(code); });
    const unsub = subscribeActiveSession((code) => joinByCode(code));
    return () => { alive = false; unsub(); };
  }, [joinByCode]);

  async function startNewSession(data) {
    const created = await createSession(data);
    setActiveSessionCode(data.sessionCode);
    return created;
  }

  const [showQR, setShowQR] = React.useState(false);
  const [intakeProfiles, setIntakeProfiles] = React.useState([]);
  const [intakeProfilesReady, setIntakeProfilesReady] = React.useState(false);
  const [intakeProfilesError, setIntakeProfilesError] = React.useState('');
  const [showSplash, setShowSplash] = React.useState(() => !sessionStorage.getItem('dotSplash'));
  const [overlay, setOverlay] = React.useState(null);
  const endingRef = React.useRef(false);

  // Αναίρεση: κρατάμε τα 10 τελευταία snapshots του state.
  const historyRef = React.useRef([]);
  const liveRef = React.useRef(state);
  const [undoDepth, setUndoDepth] = React.useState(0);

  React.useEffect(() => { liveRef.current = state; }, [state]);

  // Personal answers stay local to the authenticated Tablet; they are never copied into the public session state.
  React.useEffect(() => {
    let active = true;
    if (!session?.id) {
      setIntakeProfiles([]);
      setIntakeProfilesError('');
      setIntakeProfilesReady(true);
      return undefined;
    }
    setIntakeProfilesReady(false);
    setIntakeProfilesError('');
    base44.entities.PlayerIntake.filter({}, { sort: '-created_date', limit: 500 })
      .then((result) => {
        if (active) {
          setIntakeProfiles(result.items || []);
          setIntakeProfilesError('');
          setIntakeProfilesReady(true);
        }
      })
      .catch((error) => {
        console.error('Private player profile load failed', error);
        if (active) setIntakeProfilesError('Δεν φορτώθηκαν οι ιδιωτικές VIP προτιμήσεις. Ανανεώστε το Tablet πριν ξεκινήσει το παιχνίδι.');
      });
    return () => { active = false; };
  }, [session?.id]);

  const playerProfiles = React.useMemo(() => {
    const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('el-GR');
    return (state?.players || []).map((player) => {
      const intake = intakeProfiles.find((item) =>
        normalize(item.name) === normalize(player.name) ||
        normalize(item.legalName) === normalize(player.name) ||
        normalize(item.displayName) === normalize(player.name) ||
        normalize(item.vipProfile?.displayName) === normalize(player.name)
      );
      return {
        playerId: player.id,
        name: player.name,
        vipProfile: intake?.vipProfile || null,
      };
    }).filter((profile) => profile.vipProfile?.answers);
  }, [state?.players, intakeProfiles]);


  const trackedUpdate = React.useCallback(async (patch) => {
    if (liveRef.current) historyRef.current = [...historyRef.current.slice(-9), liveRef.current];
    setUndoDepth(Math.min(historyRef.current.length, 10));
    await updateState(patch);
  }, [updateState]);

  useSyncTimerAutoFire(state, updateState);

  function collectAwards() {
    const awards = [];
    const roster = state.players || [];
    if (state.mode === 'pajama') {
      const scores = state.pajama?.scores || {};
      const top = [...roster].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))[0];
      if (top) awards.push({ conditionId: 'pajama_top_score', playerName: top.name });
      const saboteur = roster.find((p) => p.id === state.pajama?.saboteurId);
      if (saboteur) awards.push({ conditionId: 'pajama_saboteur', playerName: saboteur.name });
    } else if (state.mode === 'classic') {
      const top = [...roster].sort((a, b) => (b.bounty || 0) - (a.bounty || 0))[0];
      if (top) awards.push({ conditionId: 'classic_highest_bounty', playerName: top.name });
    } else {
      const winningTeam = state.mode === 'marathon'
        ? ((state.teamAlpha?.loot || 0) >= (state.teamBeta?.loot || 0) ? 'alpha' : 'beta')
        : ((state.teamA?.points || 0) >= (state.teamB?.points || 0) ? 'A' : 'B');
      roster.filter((p) => p.team === winningTeam)
        .forEach((p) => awards.push({ conditionId: 'winning_team', playerName: p.name }));
    }
    return awards;
  }

  async function archiveAndDelete() {
    if (!session || !state) { await deleteSession(); return; }
    if (state.stage === 0 && state.mode !== 'pajama') { await deleteSession(); return; }
    if (state.testMode) { await deleteSession(); return; }
    if (endingRef.current) return;
    endingRef.current = true;
    try {
      const playerNames = (state.players || []).map((p) => p.name);
      let winner = '';
      if (state.mode === 'marathon') {
        winner = (state.teamAlpha?.loot || 0) >= (state.teamBeta?.loot || 0) ? 'Team Alpha' : 'Team Beta';
      } else if (state.mode === 'arrest_heist') {
        winner = (state.teamA?.points || 0) >= (state.teamB?.points || 0) ? 'Team A' : 'Team B';
      } else if (isNewMode(state.mode)) {
        const sc = (p) => ((state.mg?.scores || {})[p.id] || 0) + ((state.mg?.tokens || {})[p.id] || 0);
        winner = [...(state.players || [])].sort((a, b) => sc(b) - sc(a))[0]?.name || '';
      } else if (state.mode === 'pajama') {
        const scores = state.pajama?.scores || {};
        winner = [...(state.players || [])].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))[0]?.name || '';
      } else {
        const sorted = [...(state.players || [])].sort((a, b) => (b.bounty || 0) - (a.bounty || 0));
        winner = sorted[0]?.name || '';
      }
      const stats = {};
      (state.players || []).forEach((p) => {
        stats[p.name] = isNewMode(state.mode)
          ? { points: (state.mg?.scores || {})[p.id] || 0, penalties: 0, tokens: (state.mg?.tokens || {})[p.id] || 0, team: '' }
          : state.mode === 'pajama'
          ? {
            points: state.pajama?.scores?.[p.id] || 0,
            penalties: state.pajama?.fails?.[p.id] || 0,
            tokens: 0,
            team: state.pajama?.teams?.[p.id] || '',
          }
          : { bounty: p.bounty || 0, penalties: p.penaltyStep || 0, tokens: p.tokens || 0, team: p.team || '' };
      });
      const confessions = (state.history || [])
        .filter((e) => ['truth', 'dare', 'confession'].includes(e.type))
        .map((e) => ({ playerName: e.playerName || e.player || 'Unknown', text: e.text || e.description || e.message || '', type: e.type === 'dare' ? 'dare' : 'truth' }))
        .filter((c) => c.text);
      const highlights = (state.history || [])
        .filter((e) => ['bomb_exploded', 'bomb_timeout', 'midnight_pact', 'warrant', 'trial_verdict', 'plot_twist', 'arrest', 'heist', 'glitch'].includes(e.type))
        .map((e) => e.description || e.message || e.text || e.type)
        .slice(0, 10);
      await base44.functions.invoke('archiveSession', {
        sessionCode: session.sessionCode,
        mode: state.mode,
        winner,
        playerNames,
        stats,
        confessions,
        highlights,
        showScenes: state.showMode?.sceneHistory || [],
        episodeSchedule: state.night?.program || [],
        eventHistory: state.history || [],
      });
    } catch (e) {
      console.error('Archive failed', e);
      window.alert('Η αρχειοθέτηση απέτυχε. Η συνεδρία διατηρήθηκε και δεν διαγράφηκε. Έλεγξε τη σύνδεση και δοκίμασε ξανά.');
      endingRef.current = false;
      return;
    }
    try {
      await awardAchievements(session.sessionCode, collectAwards());
    } catch (e) {
      console.error('Achievement save failed', e);
    }
    await deleteSession();
    endingRef.current = false;
  }

  React.useEffect(() => {
    if (!session || !state) return;
    const check = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        if (!state.midnightPact || state.midnightPact.phase === 'inactive') {
          updateState({ midnightPact: { phase: 'active', offers: {}, timestamp: Date.now() } });
        }
      }
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [session?.id, state?.midnightPact?.phase]);

  if (showSplash) {
    return <SplashScreen onComplete={() => { setShowSplash(false); sessionStorage.setItem('dotSplash', '1'); }} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen comic-dots flex items-center justify-center">
        <div className="font-heading text-4xl comic-pulse text-primary">ΦΟΡΤΩΣΗ...</div>
      </div>
    );
  }

  if (!session || !state) {
    return <SetupScreen onStart={startNewSession} />;
  }

  const displayState = { ...state, sessionCode: session.sessionCode };

  async function startPersonalizedSurprise(profile) {
    const answers = profile.vipProfile?.answers || {};
    if (answers.activeParticipation === 'no' || answers.activityPreferences?.surprises !== 'yes' || answers.unexpectedChallenge === 'no') return;
    if (!canAssignVipActivity({ playerProfiles, playerProfilesReady: intakeProfilesReady }, profile, { activityType: 'surprises', activityLabel: 'προσωπικές εκπλήξεις' })) return;
    const sceneId = Date.now();
    const showMode = state.showMode || {};
    await trackedUpdate({
      showMode: {
        ...showMode,
        reveal: { active: true, title: `ΜΥΣΤΙΚΗ ΕΚΠΛΗΞΗ · ${profile.name}`, content: '', phase: 'buildup', timestamp: sceneId },
        sceneHistory: [...(showMode.sceneHistory || []), { id: sceneId, type: 'personalized_surprise', title: `ΜΥΣΤΙΚΗ ΕΚΠΛΗΞΗ · ${profile.name}`, phase: 'buildup', timestamp: sceneId }].slice(-100),
      },
    });
  }

  async function cancelPersonalizedSurprise() {
    const showMode = state.showMode || {};
    const sceneId = showMode.reveal?.timestamp;
    await trackedUpdate({
      showMode: {
        ...showMode,
        reveal: null,
        sceneHistory: (showMode.sceneHistory || []).filter((scene) => !(scene.id === sceneId && scene.type === 'personalized_surprise' && scene.phase === 'buildup')),
      },
    });
  }

  async function revealPersonalizedSurprise(profile) {
    const answers = profile.vipProfile?.answers || {};
    const wish = String(answers.surpriseWish || '').trim();
    if (!wish || answers.activeParticipation === 'no' || answers.activityPreferences?.surprises !== 'yes' || answers.unexpectedChallenge === 'no') return;
    const showMode = state.showMode || {};
    const sceneId = showMode.reveal?.timestamp;
    const revealedAt = Date.now();
    const sceneHistory = [...(showMode.sceneHistory || [])];
    const sceneIndex = sceneHistory.findIndex((scene) => scene.id === sceneId);
    if (sceneIndex >= 0) sceneHistory[sceneIndex] = { ...sceneHistory[sceneIndex], content: wish, phase: 'reveal', revealedAt };
    await trackedUpdate({
      showMode: {
        ...showMode,
        reveal: { active: true, title: `ΜΥΣΤΙΚΗ ΕΚΠΛΗΞΗ · ${profile.name}`, content: wish, phase: 'reveal', timestamp: revealedAt },
        sceneHistory,
      },
      history: [
        { type: 'personalized_surprise', player: profile.name, detail: 'Αποκαλύφθηκε προσωπική έκπληξη από τη VIP φόρμα', timestamp: Date.now() },
        ...(state.history || []),
      ],
    });
  }

  function renderProductionControls() {
    return (
      <>
        <button
          onClick={() => setOverlay('controlroom')}
          className="fixed bottom-24 right-3 z-[65] comic-boom bg-tarot-royal text-tarot-gold px-3 py-2 font-heading text-xs shadow-xl"
        >
          MASTER CONTROL ROOM
        </button>
        {overlay === 'controlroom' && (
          <ControlRoom
            state={displayState}
            updateState={trackedUpdate}
            playerProfiles={playerProfiles}
            playerProfilesReady={intakeProfilesReady}
            onStartSurprise={startPersonalizedSurprise}
            onRevealSurprise={revealPersonalizedSurprise}
            onCancelSurprise={cancelPersonalizedSurprise}
            onOpen={(key) => key === 'intro' ? handleIntro() : setOverlay(key)}
            onRefresh={refresh}
            onEndGame={() => { setOverlay(null); archiveAndDelete(); }}
            onClose={() => setOverlay(null)}
          />
        )}
        {overlay === 'extra4minigames' && (
         <div className="fixed inset-0 z-[85] overflow-y-auto bg-black/95 p-3">
           <div className="mx-auto max-w-3xl pt-4">
             <LockdownMiniGames
               safeOnly
               onPenalty={() => {}}
               onWheel={() => {}}
               onComplete={(ok, game) => {
                 const current = liveRef.current;
                 const extra4 = getExtra4(current || {});
                 const active = extra4.activity.active;
                 if (active?.status !== 'active') return;
                 trackedUpdate({
                   extra4: {
                     activity: {
                       ...extra4.activity,
                       active: { ...active, result: ok ? 'success' : 'failed', resultGame: game?.id || null, miniGameCompletedAt: Date.now() },
                     },
                   },
                 });
               }}
               onClose={() => setOverlay('controlroom')}
             />
           </div>
         </div>
       )}
       {overlay === 'showdirector' && <ShowDirector state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
        {overlay === 'eventqueue' && <EventQueue state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
        {overlay === 'audio' && <AudioControl state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
        {overlay === 'synctimer' && <SyncTimerControl state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
        {overlay === 'finalepres' && (
          <div className="fixed inset-0 z-[80] bg-background overflow-y-auto">
            <FinalePresentation state={displayState} updateState={trackedUpdate} onEnd={() => { setOverlay(null); archiveAndDelete(); }} />
          </div>
        )}
      </>
    );
  }

  if (isNewMode(state.mode)) {
    return (
      <>
        <ModeGame state={displayState} updateState={trackedUpdate} onEnd={archiveAndDelete} onQR={() => setShowQR(true)} playerProfiles={playerProfiles} playerProfilesReady={intakeProfilesReady} />
        <NightDirectorHost state={displayState} updateState={trackedUpdate} />
        {renderProductionControls()}
        {renderQR()}
      </>
    );
  }

  if (state.mode === 'pajama') {
    return (
      <>
        <PajamaGame state={displayState} updateState={trackedUpdate} onEnd={archiveAndDelete} playerProfiles={playerProfiles} playerProfilesReady={intakeProfilesReady} />
        <NightDirectorHost state={displayState} updateState={trackedUpdate} />
        <PajamaTVPreview players={state.players || []} pj={state.pajama || {}} />
        <PajamaForcePhase pj={state.pajama || {}} updateState={trackedUpdate} />
        <PajamaMiniBar
          paused={!!state.stopActive}
          onQR={() => setShowQR(true)}
          onTogglePause={handleStop}
          onEnd={() => {
            if (window.confirm('Να κλείσει το παιχνίδι και να αρχειοθετηθεί η συνεδρία;')) archiveAndDelete();
          }}
        />
        {state.stopActive && (
          <div className="fixed inset-0 z-[85] bg-destructive/25 pointer-events-none flex items-center justify-center">
            <div className="font-heading text-6xl text-destructive comic-text-stroke comic-pulse">⏸ ΠΑΥΣΗ</div>
          </div>
        )}
        {renderProductionControls()}
        {renderQR()}
      </>
    );
  }

  // Παύση: παγώνει και το συγχρονισμένο χρονόμετρο, και το ξαναξεκινά με το ίδιο υπόλοιπο.
  async function handleStop() {
    const extra4 = getExtra4(state);
    if (extra4.control.status === 'emergency') return;
    if (extra4.control.status === 'paused') {
      const timers = resumeExtra4Timers(state);
      await trackedUpdate({
        ...timers,
        stopActive: false,
        pausedTimerRemaining: null,
        extra4: { ...extra4, control: { ...extra4.control, status: 'running', pausedAt: null, resumedAt: Date.now() } },
      });
      return;
    }
    const timers = pauseExtra4Timers(state);
    await trackedUpdate({
      ...timers,
      stopActive: true,
      extra4: { ...extra4, control: { ...extra4.control, status: 'paused', pausedAt: Date.now() } },
    });
  }

  async function handleUndo() {
    const previous = historyRef.current.pop();
    setUndoDepth(historyRef.current.length);
    if (!previous || !session) return;
    await base44.entities.GameSession.update(session.id, { state: previous });
    await refresh();
  }

  function confirmNewGame() {
    if (window.confirm('Νέο παιχνίδι; Η τρέχουσα συνεδρία θα αρχειοθετηθεί και θα διαγραφεί.')) archiveAndDelete();
  }

  function renderQR() {
    if (!showQR) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-background/70 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
        <div onClick={(e) => e.stopPropagation()} className="max-w-sm w-full">
          <SessionQRCode sessionCode={session.sessionCode} size={240} />
          <ComicButton variant="red" size="md" onClick={() => setShowQR(false)} className="w-full mt-3">
            ✕ ΚΛΕΙΣΙΜΟ
          </ComicButton>
        </div>
      </div>
    );
  }

  async function handleIntro() {
    await trackedUpdate({ intro: { active: true, startedAt: Date.now() } });
  }

  async function handleTriggerBomb() {
    const target = calculateMostWanted(state.players) || state.players[0];
    await trackedUpdate({ bombEvent: { active: true, targetId: target.id } });
  }

  const wantedLevel = state.players?.length ? getWantedLevel(calculateMostWanted(state.players)) : 0;
  const mostWantedName = calculateMostWanted(state.players)?.name;

  return (
    <div className="relative">
      <WantedStrobePanic wantedLevel={wantedLevel} playerName={mostWantedName} />
      <StopButton active={state.stopActive} onToggle={handleStop} />
      <div className="fixed top-3 left-3 z-50">
        <BountyMultiplier state={state} />
      </div>
      <TabletStatusStrip state={displayState} />
      {intakeProfilesError && <div role="alert" className="mx-auto max-w-7xl rounded-lg border border-red-500 bg-red-950/80 p-3 text-center text-sm text-red-100">{intakeProfilesError} <button className="ml-2 underline font-bold" onClick={() => window.location.reload()}>ΑΝΑΝΕΩΣΗ</button></div>}
      {state.stopActive && (
        <div className="fixed inset-0 z-40 bg-destructive/20 pointer-events-auto flex items-center justify-center">
          <div className="font-heading text-6xl text-destructive comic-text-stroke comic-pulse">⏸ ΠΑΥΣΗ</div>
        </div>
      )}
      {state.bombEvent ? (
        <BombEventScreen
          state={displayState}
          updateState={trackedUpdate}
          onExit={() => trackedUpdate({ bombEvent: null })}
          onGoToStage2={() => trackedUpdate({ bombEvent: null, stage: 2 })}
        />
      ) : state.stage === 0 ? (
        <StageZero state={displayState} updateState={trackedUpdate} />
      ) : state.mode === 'arrest_heist' ? (
        <ArrestHeistScreen
          state={displayState}
          updateState={trackedUpdate}
          onEnd={archiveAndDelete}
          playerProfiles={playerProfiles}
          playerProfilesReady={intakeProfilesReady}
        />
      ) : state.mode === 'marathon' ? (
        <MarathonScreen
          state={displayState}
          updateState={trackedUpdate}
          onEnd={archiveAndDelete}
          playerProfiles={playerProfiles}
          playerProfilesReady={intakeProfilesReady}
        />
      ) : (
        <>
          {state.stage === 1 && (
            <PatrolScreen
              state={displayState}
              updateState={trackedUpdate}
              onGoToStage2={() => trackedUpdate({ stage: 2 })}
              playerProfiles={playerProfiles}
              playerProfilesReady={intakeProfilesReady}
            />
          )}
          {state.stage === 2 && (
            <InterrogationScreen
              state={displayState}
              updateState={trackedUpdate}
              onRelease={() => trackedUpdate({ stage: 1 })}
              onGoToFinale={() => trackedUpdate({ stage: 3 })}
              playerProfiles={playerProfiles}
              playerProfilesReady={intakeProfilesReady}
            />
          )}
          {state.stage === 3 && (
            <FinaleScreen
              state={displayState}
              updateState={trackedUpdate}
              onEnd={archiveAndDelete}
              playerProfiles={playerProfiles}
              playerProfilesReady={intakeProfilesReady}
            />
          )}
        </>
      )}
      <TabletToolbar
        onQR={() => setShowQR(true)}
        onNewGame={confirmNewGame}
        onUndo={handleUndo}
        undoDisabled={undoDepth === 0}
        onBomb={handleTriggerBomb}
        onFlashbang={() => window.__triggerFlashbang && window.__triggerFlashbang()}
        bombDisabled={!!state.bombEvent}
        onTrial={() => setOverlay('trial')}
        onShoeRoulette={() => setOverlay('shoe')}
        onSlotMachine={() => setOverlay('slots')}
        onKarmaSlots={() => setOverlay('karmaslots')}
        onLastWish={() => setOverlay('wish')}
        onBlindOracle={() => setOverlay('oracle')}
        onBarefootCrypt={() => setOverlay('crypt')}
        onMidnightPact={() => setOverlay('pact')}
        onGrandJury={() => setOverlay('grandjury')}
        onShowDirector={() => setOverlay('showdirector')}
        onPrivateMessage={() => setOverlay('privatemsg')}
        onSealedVote={() => setOverlay('sealedvote')}
        onEventQueue={() => setOverlay('eventqueue')}
        onAudioControl={() => setOverlay('audio')}
        onFinalePresentation={() => setOverlay('finalepres')}
        onIntro={handleIntro}
        onSyncTimer={() => setOverlay('synctimer')}
        onTurnOrder={() => setOverlay('turnorder')}
        onLiarsPoker={() => setOverlay('poker')}
        onTrivia={() => setOverlay('trivia')}
        onFinalDeal={() => setOverlay('finaldeal')}
        onMarket={() => setOverlay('market')}
        onControlRoom={() => setOverlay('controlroom')}
      />
      {overlay === 'trial' && <JuryTrial state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'shoe' && <ShoeRoulette state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'slots' && <TemptationSlots state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'karmaslots' && <KarmaSlots state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'wish' && <LastWish state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'oracle' && <BlindOracle state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'crypt' && <BarefootCrypt state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'pact' && <MidnightPact state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'grandjury' && <GrandJuryControl state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'showdirector' && <ShowDirector state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'privatemsg' && <PrivateMessageSender state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'sealedvote' && <SealedVoteControl state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'eventqueue' && <EventQueue state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'audio' && <AudioControl state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'synctimer' && <SyncTimerControl state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'turnorder' && <TurnOrderPanel state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'poker' && <LiarsPoker state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'trivia' && <TriviaKnowMe state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'finaldeal' && <FinalDeal state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'market' && <BlackmailMarket state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
      {overlay === 'controlroom' && (
        <ControlRoom
          state={displayState}
          playerProfiles={playerProfiles}
          onStartSurprise={startPersonalizedSurprise}
          onRevealSurprise={revealPersonalizedSurprise}
          onCancelSurprise={cancelPersonalizedSurprise}
          onOpen={(key) => key === 'intro' ? handleIntro() : setOverlay(key)}
          onRefresh={refresh}
          onEndGame={() => { setOverlay(null); archiveAndDelete(); }}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === 'finalepres' && (
        <div className="fixed inset-0 z-[80] bg-background overflow-y-auto">
          <FinalePresentation state={displayState} updateState={trackedUpdate} onEnd={() => { setOverlay(null); archiveAndDelete(); }} />
        </div>
      )}
      <NightDirectorHost state={displayState} updateState={trackedUpdate} />
      <MobileVotePanel state={displayState} updateState={trackedUpdate} />
      <FlashbangOverlay state={displayState} updateState={trackedUpdate} />
      {renderQR()}
    </div>
  );
}