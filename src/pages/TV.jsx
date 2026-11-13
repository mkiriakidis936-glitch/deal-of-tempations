import ModeTV from '@/components/modes/ModeTV';
import { isNewMode } from '@/data/modes/modeRegistry';
import React, { useMemo, useState } from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { getActiveSessionCode, subscribeActiveSession } from '@/lib/activeSession';
import PlayerCard from '@/components/shared/PlayerCard';
import LiveOverlay from '@/components/tv/LiveOverlay';
import WantedStrobePanic from '@/components/shared/WantedStrobePanic';
import DecibelMeter from '@/components/comic/DecibelMeter';
import SessionJoin from '@/components/shared/SessionJoin';
import TVBoardPanel from '@/components/tv/TVBoardPanel';
import MarathonProtocol from '@/components/tv/MarathonProtocol';
import BountyMultiplier from '@/components/shared/BountyMultiplier';
import TVTopStrip from '@/components/tv/TVTopStrip';
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
import PajamaRevealOverlay from '@/components/tv/PajamaRevealOverlay';
import PajamaTV from '@/components/tv/PajamaTV';
import SyncTimerDisplay from '@/components/shared/SyncTimerDisplay';
import { PHOTO, FILM } from '@/data/brandArt';
import MediaSpot from '@/components/shared/MediaSpot';
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

export default function TVScreen() {
  const { session, state, loading, joinByCode } = useGameSession({ autoLoad: false });
  const [fullscreen, setFullscreen] = useState(false);

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

  const formattedHistory = useMemo(() => (state?.history || []).map(formatEvent), [state?.history]);

  if (loading) {
    return (
      <div className="min-h-screen comic-dots-dark flex items-center justify-center text-foreground">
        <div className="font-heading text-5xl comic-pulse text-primary">ΦΟΡΤΩΣΗ...</div>
      </div>
    );
  }

  if (!session || !state) {
    return (
      <>
        <PajamaRevealOverlay />
        <SessionJoin onJoin={joinByCode} loading={loading} title="📺 TV — ΣΥΝΔΕΣΗ" />
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
    <div className="min-h-screen comic-dots-dark text-foreground flex flex-col">
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-20">
        <MediaSpot src={PHOTO.tv || FILM.tv} slot="tv" className="w-full h-full object-cover" />
      </div>
      <LiveOverlay />
      <PajamaRevealOverlay />
      <IntroSequenceTV state={state} />
      <WantedStrobePanic wantedLevel={wantedLevel} playerName={mostWanted?.name} />
      <ShowModeTV state={state} />
      <SpecialEventsTV state={state} />
      <SealedVoteTV state={state} />
      <BannerOverlay state={state} />
      <GrandJuryTV state={state} />
      <FinaleTV state={state} />
      <GiftCodeTV state={state} />
      <BlitzOverlay blitz={state.blitz} />
      <button
        onClick={() => setFullscreen((f) => !f)}
        className="fixed top-10 right-4 z-40 comic-boom bg-primary text-tarot-dark px-3 py-1.5 text-sm"
      >
        {fullscreen ? '🔽 Exit' : '⛶ Fullscreen'}
      </button>

      {state.testMode && (
        <div className="fixed top-10 left-4 z-40 comic-boom bg-tarot-royal text-tarot-gold px-3 py-1.5 text-sm font-heading">
          🧪 TEST MODE
        </div>
      )}

      {state.syncTimer && (
        <div className="fixed bottom-16 right-4 z-40 w-44">
          <SyncTimerDisplay state={state} />
        </div>
      )}

      <div className={`flex-1 flex flex-col ${fullscreen ? 'p-2' : 'p-4 pt-14 pb-16'}`}>
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-3">
          {!fullscreen && (
            <TVTopStrip
              wantedLevel={wantedLevel}
              mostWantedName={mostWanted?.name}
              totalLoot={totalLoot}
              playerCount={state.players?.length || 0}
              sessionCode={session.sessionCode}
              stopActive={state.stopActive}
            />
          )}

          {!fullscreen && isMarathon && state.stage > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="comic-panel bg-tarot-crimson p-3 text-center">
                <div className="font-heading text-xl text-tarot-gold">ΟΜΑΔΑ ΑΛΦΑ</div>
                <div className="text-2xl text-foreground">${state.teamAlpha?.loot?.toLocaleString() || 0}</div>
                <div className="text-lg text-tarot-gold">⭐ {state.teamAlpha?.stars || 0}</div>
              </div>
              <div className="comic-panel bg-tarot-royal p-3 text-center">
                <div className="font-heading text-xl text-tarot-gold">ΟΜΑΔΑ ΒΗΤΑ</div>
                <div className="text-2xl text-foreground">${state.teamBeta?.loot?.toLocaleString() || 0}</div>
                <div className="text-lg text-tarot-gold">⭐ {state.teamBeta?.stars || 0}</div>
              </div>
            </div>
          )}

          {!fullscreen && isArrestHeist && state.stage > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="comic-panel bg-tarot-wine p-3 text-center">
                <div className="font-heading text-xl text-tarot-gold">💖 TEAM ALPHA</div>
                <div className="text-2xl text-foreground">{state.teamA?.points || 0} πόντοι</div>
                <div className="text-sm text-foreground/70">Αρχηγός: {ahLeaderA?.name || '—'} · Ποινή: {ahLeaderA?.penaltyStep || 0}/6</div>
              </div>
              <div className="comic-panel bg-tarot-teal p-3 text-center">
                <div className="font-heading text-xl text-tarot-gold">💎 TEAM BETA</div>
                <div className="text-2xl text-foreground">{state.teamB?.points || 0} πόντοι</div>
                <div className="text-sm text-foreground/70">Αρχηγός: {ahLeaderB?.name || '—'} · Ποινή: {ahLeaderB?.penaltyStep || 0}/6</div>
              </div>
            </div>
          )}

          {state.bombEvent && (
            <div className="comic-panel bg-destructive p-4 text-center comic-strobe">
              <div className="text-6xl mb-1">💣</div>
              <div className="font-heading text-4xl text-foreground comic-text-stroke">ΒΟΜΒΑ ΣΕ ΕΞΕΛΙΞΗ</div>
              <div className="text-lg text-foreground/80">
                Στόχος: {state.players.find((p) => p.id === state.bombEvent.targetId)?.name || '—'}
              </div>
            </div>
          )}

          {currentEvent && (
            <div className="comic-panel bg-primary text-tarot-dark p-4 comic-pop text-center">
              <div className="text-sm uppercase font-bold">🔴 Live Event</div>
              <div className="font-heading text-3xl">{formatEvent(currentEvent)}</div>
            </div>
          )}

          <div className="flex-1 flex items-center justify-center">
            {state.stage === 0 && !isPajama ? (
              <div className="text-center space-y-4">
                <div className="font-heading text-5xl comic-text-stroke text-primary">DEAL OF TEMPTATION</div>
                <div className="font-heading text-xl text-foreground/70">Αναμονή έναρξης...</div>
                <div className="flex justify-center">
                  <SessionQRCode sessionCode={session.sessionCode} size={200} />
                </div>
                <div className="text-sm text-foreground/50">Ο Game Master ετοιμάζει το παιχνίδι στο Tablet</div>
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

          {!fullscreen && state.stage > 0 && <BountyMultiplier state={state} />}

          {!fullscreen && isMarathon && state.stage > 0 && <MarathonProtocol state={state} />}

          {!fullscreen && state.stage > 0 && !isPajama && (
            <div className="comic-panel bg-card p-3">
              <div className="font-heading text-xl text-primary mb-2">👥 Παίκτριες</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {state.players?.map((p, i) => (
                  <PlayerCard key={p.id} player={p} isCurrent={i === state.currentPlayerIndex} compact />
                ))}
              </div>
            </div>
          )}

          {!fullscreen && state.stage > 0 && <DecibelMeter label="SCREAM / LAUGH METER" size="lg" />}
        </div>
      </div>

      <TVTicker items={formattedHistory} />
    </div>
  );
}