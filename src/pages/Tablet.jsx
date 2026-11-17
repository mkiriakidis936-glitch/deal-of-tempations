import React from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { getActiveSessionCode, setActiveSessionCode, subscribeActiveSession } from '@/lib/activeSession';
const StopButton = React.lazy(() => import('@/components/comic/StopButton'));
import ComicButton from '@/components/comic/ComicButton';
import SetupScreen from '@/components/tablet/SetupScreen';
const PatrolScreen = React.lazy(() => import('@/components/tablet/PatrolScreen'));
const InterrogationScreen = React.lazy(() => import('@/components/tablet/InterrogationScreen'));
const FinaleScreen = React.lazy(() => import('@/components/tablet/FinaleScreen'));
const BombEventScreen = React.lazy(() => import('@/components/tablet/BombEventScreen'));
const ArrestHeistScreen = React.lazy(() => import('@/components/tablet/ArrestHeistScreen'));
const MarathonScreen = React.lazy(() => import('@/components/tablet/MarathonScreen'));
const PajamaGame = React.lazy(() => import('@/components/pajama/PajamaGame'));
const ModeGame = React.lazy(() => import('@/components/modes/ModeGame'));
import { isNewMode } from '@/data/modes/modeRegistry';
const PajamaTVPreview = React.lazy(() => import('@/components/tablet/PajamaTVPreview'));
const PajamaForcePhase = React.lazy(() => import('@/components/tablet/PajamaForcePhase'));
const PajamaMiniBar = React.lazy(() => import('@/components/tablet/PajamaMiniBar'));
const WantedStrobePanic = React.lazy(() => import('@/components/shared/WantedStrobePanic'));
const MobileVotePanel = React.lazy(() => import('@/components/shared/MobileVotePanel'));
const StageZero = React.lazy(() => import('@/components/tablet/StageZero'));
const GameDurationClock = React.lazy(() => import('@/components/shared/GameDurationClock'));
const FlashbangOverlay = React.lazy(() => import('@/components/shared/FlashbangOverlay'));
const BountyMultiplier = React.lazy(() => import('@/components/shared/BountyMultiplier'));
const SessionQRCode = React.lazy(() => import('@/components/shared/SessionQRCode'));
const TabletToolbar = React.lazy(() => import('@/components/tablet/TabletToolbar'));
const TabletStatusStrip = React.lazy(() => import('@/components/tablet/TabletStatusStrip'));
import SplashScreen from '@/components/shared/SplashScreen';
const JuryTrial = React.lazy(() => import('@/components/tablet/JuryTrial'));
const ShoeRoulette = React.lazy(() => import('@/components/tablet/ShoeRoulette'));
const TemptationSlots = React.lazy(() => import('@/components/tablet/TemptationSlots'));
const KarmaSlots = React.lazy(() => import('@/components/tablet/KarmaSlots'));
const LastWish = React.lazy(() => import('@/components/tablet/LastWish'));
const BlindOracle = React.lazy(() => import('@/components/tablet/BlindOracle'));
const BarefootCrypt = React.lazy(() => import('@/components/tablet/BarefootCrypt'));
const MidnightPact = React.lazy(() => import('@/components/tablet/MidnightPact'));
const GrandJuryControl = React.lazy(() => import('@/components/tablet/GrandJuryControl'));
const NewsControl = React.lazy(() => import('@/components/tablet/NewsControl'));
const PrivateMessageSender = React.lazy(() => import('@/components/tablet/PrivateMessageSender'));
const SealedVoteControl = React.lazy(() => import('@/components/tablet/SealedVoteControl'));
const EventQueue = React.lazy(() => import('@/components/tablet/EventQueue'));
const AudioControl = React.lazy(() => import('@/components/tablet/AudioControl'));
const FinalePresentation = React.lazy(() => import('@/components/tablet/FinalePresentation'));
const SyncTimerControl = React.lazy(() => import('@/components/tablet/SyncTimerControl'));
const TurnOrderPanel = React.lazy(() => import('@/components/tablet/TurnOrderPanel'));
const LiarsPoker = React.lazy(() => import('@/components/tablet/LiarsPoker'));
const TriviaKnowMe = React.lazy(() => import('@/components/tablet/TriviaKnowMe'));
const FinalDeal = React.lazy(() => import('@/components/tablet/FinalDeal'));
const ControlRoom = React.lazy(() => import('@/components/tablet/ControlRoom'));
const BlackmailMarket = React.lazy(() => import('@/components/tablet/BlackmailMarket'));
const NightDirectorHost = React.lazy(() => import('@/components/night/NightDirectorHost'));
import { useSyncTimerAutoFire } from '@/hooks/useSyncTimerAutoFire';
import { calculateMostWanted, getWantedLevel } from '@/lib/gameLogic';
import { base44 } from '@/api/base44Client';
import { awardAchievements } from '@/lib/achievements';
import { setGameStopActive } from '@/lib/modeKit';

export default function Tablet() {
  const { session, state, loading, updateState, createSession, deleteSession, refresh, joinByCode } = useGameSession();
  React.useEffect(() => {
    setGameStopActive(!!(state?.stopActive || state?.mg?.stop));
  }, [state?.stopActive, state?.mg?.stop]);

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
    const created = await createSession({
      ...data,
      event: { title: String(data.mode || 'Game').replace(/_/g, ' ').toUpperCase(), sessionCode: data.sessionCode, createdFrom: 'game-setup', guests: [] },
    });
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

  React.useEffect(() => {
    if (!session || !state?.gameStartedAt || state.gameTimeExpired) return undefined;
    const checkDuration = () => {
      const pausedMs = Math.max(0, Number(state.gamePausedMs || 0));
      const pausedNow = state.gamePausedAt ? Date.now() - state.gamePausedAt : 0;
      const elapsed = Date.now() - state.gameStartedAt - pausedMs - pausedNow;
      const durationMs = Math.max(1, Number(state.gameDurationMinutes) || 300) * 60000;
      if (elapsed >= durationMs) {
        trackedUpdate({ gameTimeExpired: true, stopActive: true, gamePausedAt: state.gamePausedAt || Date.now() });
      }
    };
    checkDuration();
    const timerId = setInterval(checkDuration, 1000);
    return () => clearInterval(timerId);
  }, [session?.id, state?.gameStartedAt, state?.gameDurationMinutes, state?.gamePausedMs, state?.gamePausedAt, state?.gameTimeExpired, trackedUpdate]);

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
        <a
          href={`/tv?code=${encodeURIComponent(session.sessionCode)}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-24 left-3 z-[65] comic-boom bg-background/90 border border-primary/60 text-primary px-3 py-2 font-heading text-xs shadow-xl"
        >
          LIVE TV PREVIEW ↗
        </a>
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

  // Παύση βασικού παιχνιδιού.
  async function handleStop() {
    if (state.stopActive) {
      await trackedUpdate({
        stopActive: false,
        gamePausedMs: (state.gamePausedMs || 0) + (state.gamePausedAt ? Date.now() - state.gamePausedAt : 0),
        gamePausedAt: null,
      });
      return;
    }
    await trackedUpdate({
      stopActive: true,
      gamePausedAt: state.gamePausedAt || Date.now(),
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
      <GameDurationClock state={displayState} />
      {state.gameTimeExpired && (
        <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-5">
          <div className="w-full max-w-lg rounded-2xl border-2 border-amber-400 bg-zinc-950 p-6 text-center space-y-4">
            <div className="font-display text-4xl sm:text-6xl text-amber-300">ΟΙ 5 ΩΡΕΣ ΟΛΟΚΛΗΡΩΘΗΚΑΝ</div>
            <p className="text-white/80">Το παιχνίδι ολοκληρώθηκε αυτόματα. Η συνέχεια έχει παγώσει.</p>
            <button onClick={() => archiveAndDelete()} className="w-full rounded-lg bg-amber-400 px-5 py-4 font-heading text-lg text-black">ΑΡΧΕΙΟΘΕΤΗΣΗ & ΤΕΛΟΣ</button>
          </div>
        </div>
      )}
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
        {overlay === 'news' && <NewsControl state={displayState} updateState={trackedUpdate} onClose={() => setOverlay(null)} />}
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