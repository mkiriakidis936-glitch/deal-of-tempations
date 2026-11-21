import ScreenWallpaper from '@/components/shared/ScreenWallpaper';
import TVCamera from '@/components/tv/TVCamera';
import TVDrama from '@/components/tv/TVDrama';
import SoundUnlock from '@/components/shared/SoundUnlock';
import ModeTV from '@/components/modes/ModeTV';
import TVExperienceLayer from '@/components/tv/TVExperienceLayer';
import { isNewMode } from '@/data/modes/modeRegistry';
import { ART } from '@/data/brandArt';
import React, { useMemo, useState } from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { getActiveSessionCode, subscribeActiveSession } from '@/lib/activeSession';
import WantedStrobePanic from '@/components/shared/WantedStrobePanic';
import SessionJoin from '@/components/shared/SessionJoin';
import TVBoardPanel from '@/components/tv/TVBoardPanel';
import TVTicker from '@/components/tv/TVTicker';
import SpecialEventsTV from '@/components/tv/SpecialEventsTV';
import GrandJuryTV from '@/components/tv/GrandJuryTV';
import ShowModeTV from '@/components/tv/ShowModeTV';
import SealedVoteTV from '@/components/tv/SealedVoteTV';
import BannerOverlay from '@/components/tv/BannerOverlay';
import FinaleTV from '@/components/tv/FinaleTV';
import GiftCodeTV from '@/components/tv/GiftCodeTV';
import BlitzOverlay from '@/components/shared/BlitzOverlay';
import ArrestHeistTV from '@/components/tv/ArrestHeistTV';
import InterrogationTV from '@/components/tv/InterrogationTV';
import SessionQRCode from '@/components/shared/SessionQRCode';
import IntroSequenceTV from '@/components/tv/IntroSequenceTV';
import TVLaunchVideos from '@/components/tv/TVLaunchVideos';
import TVProductionOutput from '@/components/tv/TVProductionOutput';
import TutorialTV from '@/components/tv/TutorialTV';
import GameDurationClock from '@/components/shared/GameDurationClock';
import PajamaRevealOverlay from '@/components/tv/PajamaRevealOverlay';
import PajamaTV from '@/components/tv/PajamaTV';
import SyncTimerDisplay from '@/components/shared/SyncTimerDisplay';
import { PHOTO, FILM } from '@/data/brandArt';
import MediaSpot from '@/components/shared/MediaSpot';
import NightTV from '@/components/night/NightTV';
import { useAudioSync } from '@/hooks/useAudioSync';
import { calculateMostWanted, getWantedLevel, getTotalLoot } from '@/lib/gameLogic';

function formatEvent(event) {
  if (!event) return '';
  switch (event.type) {
    case 'move':
      return `🎲 ${event.player} έριξε ${event.dice} → κουτί ${event.position + 1} (${event.squareType})`;
    case 'trapped':
      return `🔒 ${event.player} παγιδευμένη — έριξε ${event.dice}, χρειάζεται 6άρι`;
    case 'skip':
      return `⏭️ ${event.player} παραλείπει τη σειρά`;
    case 'command':
      return `📋 ${event.player} — Εντολή: ${event.square}`;
    case 'challenge_success':
      return `🎯 ${event.player} — Challenge Επιτυχία +$5.000`;
    case 'challenge_fail':
      return `🎯 ${event.player} — Challenge Αποτυχία +1⭐`;
    case 'trap':
      return `🪤 ${event.player} — Παγίδα: ${event.square}`;
    case 'penalty':
      return `⚠️ ${event.player} — Ποινή: ${event.square}`;
    case 'duel_win':
      return `⚔️ ${event.player} — Κόντρα ΝΙΚΗ +$5.000`;
    case 'duel_lose':
      return `⚔️ ${event.player} — Κόντρα ΗΤΤΑ +1⭐`;
    case 'success':
      return `✅ ${event.player} ολοκλήρωσε "${event.card}"`;
    case 'fail':
      return `❌ ${event.player} απέτυχε "${event.card}" — ${event.penalty || '+1 ποινή'}`;
    case 'glitch':
      return `⚡ GLITCH: ${event.card} (${event.player})`;
    case 'warrant':
      return `📜 ${event.player} → ένταλμα σε ${event.target}`;
    case 'blackmarket':
      return `🛍️ ${event.player} αγόρασε ${event.option}`;
    case 'bomb_defused':
      return `💣 BOMB DEFUSED! ${event.player} +$2.000`;
    case 'bomb_exploded':
      return `💥 BOMB EXPLODED! ${event.player} συνελήφθη`;
    case 'bomb_timeout':
      return `💥 BOMB TIMEOUT! ${event.player} συνελήφθη`;
    case 'bomb_paso':
      return `🔥 P.A.S.O. ${event.paso} — ${event.success ? 'Επιτυχία' : 'Αποτυχία'} (${event.player})`;
    case 'bomb_typing':
      return `🪢 ${event.player} → ${event.typing}`;
    case 'dare_success':
      return `🔥 ${event.player} (Team ${event.team}) — Θάρρος επιτυχία`;
    case 'dare_fail':
      return `🔥 ${event.player} (Team ${event.team}) — Θάρρος αποτυχία`;
    case 'truth_answered':
      return `💬 ${event.player} (Team ${event.team}) — Αλήθεια απαντήθηκε`;
    case 'truth_refused':
      return `💬 ${event.player} (Team ${event.team}) — Αλήθεια άρνηση`;
    case 'penalty':
      return `⚠️ ${event.player} (Team ${event.team}) — Ποινή στάδιο ${event.step}/6`;
    case 'vault_unlocked':
      return `🔓 VAULT ΞΕΚΛΕΙΔΩΘΗΚΕ — Team ${event.team} ΝΙΚΗΣΕ!`;
    case 'vault_timeout':
      return `⏱ VAULT TIMEOUT — Νικήτρια: Team ${event.winner}`;
    case 'trial_success':
      return `🦶 ${event.trial} — Team ${event.team} (${event.player}) Επιτυχία +$10.000`;
    case 'trial_fail':
      return `🦶 ${event.trial} — Team ${event.team} (${event.player}) Αποτυχία +1⭐`;
    case 'group_penalty':
      return `🚨 Ομαδική Ποινή ${event.index}/3: ${event.penalty}`;
    case 'release':
      return `🔓 ${event.player} απελευθερώθηκε!`;
    case 'finale_complete':
      return `🏆 Φινάλε! ${event.player} Most Wanted`;
    case 'trial_verdict':
      return `⚖️ ΔΙΚΗ: ${event.player} — ${event.verdict === 'guilty' ? 'ΕΝΟΧΗ' : 'ΑΘΩΗ'} (${event.guilty}/${event.innocent})`;
    case 'shoe_roulette':
      return `👟 ΡΟΥΛΕΤΑ: ${event.player} ⇄ ${event.target}`;
    case 'breaking_news':
      return `📡 BREAKING NEWS: ${event.detail}`;
    case 'penalty_slots':
      return `🎰 ΚΟΥΛΟΧΕΡΗΣ: ${event.player} — ${event.detail}`;
    case 'karma_slots':
      return `🍒 ΦΡΟΥΤΑΚΙΑ: ${event.player} — ${event.detail}`;
    case 'last_wish':
      return `🕯️ ${event.player}: "${event.wish}" — ${event.accepted ? 'Εγκρίθηκε' : 'Απορρίφθηκε'}`;
    case 'capsule_reveal':
      return `⏳ Χρονοκάψουλα: Αποκάλυψη προβλέψεων!`;
    case 'blind_oracle':
      return `🔮 Μαντείο: ${event.detail}`;
    case 'crypt_solved':
      return `🗝️ ${event.detail}`;
    case 'crypt_failed':
      return `💥 ${event.detail}`;
    case 'midnight_pact':
      return `🌙 Συμβόλαιο: ${event.detail}`;
    case 'grand_jury_verdict':
      return `⚖️ GRAND JURY: Queen=${event.queen} · Champion=${event.champion}`;
    case 'liars_poker':
      return `🃏 ΠΟΚΕΡ ΨΕΜΑΤΩΝ: ${event.detail}`;
    case 'trivia':
      return `🧠 TRIVIA: ${event.detail}`;
    case 'turn_order':
      return `🔀 ΝΕΑ ΣΕΙΡΑ: ${event.detail}`;
    case 'karma_faucet':
      return `🎁 KARMA: ${event.detail}`;
    case 'timer_expired':
      return `⏱ ΧΡΟΝΟΜΕΤΡΟ: ${event.detail}`;
    case 'final_deal':
      return `🎲 FINAL DEAL: ${event.detail}`;
    case 'blackmail_buy':
      return `🪙 BLACKMAIL: ${event.detail}`;
    default:
      return JSON.stringify(event);
  }
}

const IS_PREVIEW = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';

export default function TVScreen() {
  const { session, state, loading, joinByCode } = useGameSession({ autoLoad: false });
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [networkOnline, setNetworkOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

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

  useAudioSync(state);

  React.useEffect(() => {
    const updateNetwork = () => setNetworkOnline(navigator.onLine);
    const updateFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => {
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
      document.removeEventListener('fullscreenchange', updateFullscreen);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setFullscreen((value) => !value);
    } catch (error) {
      console.warn('Fullscreen is not available in this browser', error);
      setFullscreen((value) => !value);
    }
  };

  const formattedHistory = useMemo(() => (state?.history || []).map(formatEvent), [state?.history]);

  if (loading) {
    return (
      <div className="ui-tv min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: 'var(--ui-bg)' }}>
        <img src="/icons/icon-192.png" alt="" className="h-28 w-28 rounded-[30px]" />
        <div className="ui-tv-muted">Σύνδεση…</div>
      </div>
    );
  }

  if (!session || !state) {
    return (
      <>
        <PajamaRevealOverlay />
        <SessionJoin onJoin={joinByCode} loading={loading} title="Σύνδεση TV" />
      </>
    );
  }

  const mostWanted = calculateMostWanted(state.players);
  const wantedLevel = mostWanted ? getWantedLevel(mostWanted) : 0;
  const totalLoot = getTotalLoot(state);
  const currentEvent = state.history?.[0];
  const isMarathon = state.mode === 'marathon';
  const isArrestHeist = state.mode === 'arrest_heist';
  const isPajama = state.mode === 'pajama';
  const isNew = isNewMode(state.mode);
  const ahLeaderA = state.players?.find((p) => p.team === 'A' && p.isLeader);
  const ahLeaderB = state.players?.find((p) => p.team === 'B' && p.isLeader);

  return (
    <div className={`dot-tv-shell ui-tv min-h-screen text-foreground flex flex-col ${fullscreen ? 'dot-tv-fullscreen' : ''}`}>
      <ScreenWallpaper src={ART.wallpaperTv} />
      {!IS_PREVIEW && <SoundUnlock variant="screen" />}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-20">
        <MediaSpot src={PHOTO.tv || FILM.tv} slot="tv" className="w-full h-full object-cover" />
      </div>
      {state.stopActive && <div className="fixed inset-0 z-[100] bg-destructive/90 flex items-center justify-center text-center pointer-events-auto"><div className="font-heading text-7xl text-white">⏸ ΣΤΟΠ</div></div>}
      <TVExperienceLayer sessionCode={session.sessionCode} mode={state.mode} playerCount={state.players?.length || 0} stage={state.stage} online={networkOnline} fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen} event={currentEvent} />
      {(state.absoluteInterrogation?.active || state.interrogationVerdict || state.bailoutAuction?.active || state.blackBribe || state.sacrificeWheel || state.bailoutOutcome) && (
        <div className="ui-card ui-card--gold fixed bottom-16 left-4 z-50 max-w-md w-[min(92vw,28rem)] space-y-2">
          {state.absoluteInterrogation?.active && <div><b style={{ color: 'var(--ui-gold)' }}>⚖️ ABSOLUTE INTERROGATION · {state.absoluteInterrogation.step + 1}/3</b><div className="text-sm">{state.absoluteInterrogation.questions?.[state.absoluteInterrogation.step]}</div></div>}
          {state.interrogationVerdict && <div><b style={{ color: 'var(--ui-gold)' }}>{state.interrogationVerdict.label}</b><div className="text-xs">{state.interrogationVerdict.release ? '+5.000€ · 1 Pass Card' : 'Ποινή ×' + state.interrogationVerdict.penaltyMultiplier + ' · Sensory Lock'}</div></div>}
          {state.bailoutAuction?.active && <div><b style={{ color: 'var(--ui-gold)' }}>🔨 BAILOUT AUCTION LIVE</b><div className="text-xs">Μυστικές προσφορές: {Object.keys(state.bailoutAuction.bids || {}).length}</div></div>}
          {state.blackBribe && <div className="text-xs">💰 BLACK BRIBE: {state.players?.find((p) => p.id === state.blackBribe.playerId)?.name} → {state.players?.find((p) => p.id === state.blackBribe.targetId)?.name} · 20′</div>}
          {state.sacrificeWheel && <div className="text-xs">🎡 SACRIFICE WHEEL: {state.sacrificeWheel.choice === 'sacrifice' ? 'Θυσία · 15′ · Top 3 ×2' : 'Άρνηση · αφαίρεση μεγαλύτερου ποσού'}</div>}
          {state.bailoutOutcome && <div className="text-xs">🔓 BAILOUT: {state.bailoutOutcome.released ? 'Άμεση απελευθέρωση' : 'Επιπλέον 15′ · Sensory Lock'}</div>}
        </div>
      )}
      <PajamaRevealOverlay />
      <TutorialTV tutorial={state.tutorialDemo} />
      <GameDurationClock state={state} corner />
      <TVProductionOutput sessionCode={session.sessionCode} />
      <TVDrama drama={state.mg?.drama} muted={IS_PREVIEW || !!state.mg?.tvSfxOff} />
      {!IS_PREVIEW && <TVCamera sessionCode={session.sessionCode} camera={state.camera} hidden={!!(state.stopActive || state.mg?.stop)} />}
      <TVLaunchVideos
        sessionCode={session.sessionCode}
        welcomeSrc={FILM.welcomeVideo}
        countdownSrc={FILM.countdownVideo}
        countdownStartedAt={state.countdownStartedAt}
      />
      <IntroSequenceTV state={state} />
      <NightTV state={state} />
      <WantedStrobePanic wantedLevel={wantedLevel} playerName={mostWanted?.name} />
      <ShowModeTV state={state} />
      <SpecialEventsTV state={state} />
      <SealedVoteTV state={state} />
      <BannerOverlay state={state} />
      <GrandJuryTV state={state} />
      <FinaleTV state={state} />
      <GiftCodeTV state={state} />
      <BlitzOverlay blitz={state.blitz} />
      {state.testMode && (
        <div className="fixed top-10 left-4 z-40"><span className="ui-badge ui-badge--gold">🧪 Δοκιμαστική λειτουργία</span></div>
      )}

      {state.syncTimer && (
        <div className="fixed bottom-16 right-4 z-40 w-44">
          <SyncTimerDisplay state={state} />
        </div>
      )}

      <div className={`dot-tv-stage flex-1 flex flex-col ${fullscreen ? 'p-2' : 'p-4 pt-16 pb-16'}`}>
        <div className="mx-auto w-full max-w-[min(96vw,2600px)] flex-1 flex flex-col gap-3">


          {state.bombEvent && (
            <div className="ui-card ui-card--danger text-center">
              <div className="text-6xl mb-1">💣</div>
              <div className="ui-tv-title ui-tv-title--red">Βόμβα σε εξέλιξη</div>
              <div className="ui-tv-text">
                Στόχος: {state.players.find((p) => p.id === state.bombEvent.targetId)?.name || '—'}
              </div>
            </div>
          )}


          <div className="flex-1 flex items-center justify-center">
            {state.stage === 0 && !isPajama ? (
              <div className="ui-card flex w-full max-w-[min(88vw,1700px)] items-center gap-12 p-12">
                <div className="flex-1 space-y-4 text-left">
                  <div className="ui-tv-eyebrow ui-tv-eyebrow--gold">Deal of Temptation</div>
                  <div className="ui-tv-title ui-tv-title--xl">Αναμονή έναρξης</div>
                  <div className="ui-tv-text">Σκανάρετε το QR με το κινητό σας για να μπείτε στο παιχνίδι.</div>
                  <div className="ui-tv-muted">Κωδικός: <b className="ui-tv-num" style={{ color: 'var(--ui-gold)' }}>{session.sessionCode}</b> · Ο Game Master ετοιμάζει το παιχνίδι στο Tablet.</div>
                </div>
                <div className="shrink-0">
                  <SessionQRCode sessionCode={session.sessionCode} size={300} />
                </div>
              </div>
            ) : isNew ? (
              <ModeTV state={state} />
            ) : isPajama ? (
              <PajamaTV players={state.players || []} pj={state.pajama || {}} />
            ) : isArrestHeist ? (
              <ArrestHeistTV state={state} />
            ) : isMarathon ? (
              <TVBoardPanel mode="marathon" players={state.players || []} large={fullscreen} />
            ) : state.stage === 2 ? (
              <InterrogationTV state={state} />
            ) : (
              <TVBoardPanel mode="classic" players={state.players || []} large={fullscreen} />
            )}
          </div>

        </div>
      </div>

      {state.mode !== 'marathon_4h' && <TVTicker items={formattedHistory.slice(0, 4)} />}
    </div>
  );
}