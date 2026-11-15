import React, { useEffect, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { GAME_MODES } from '@/data/gameConfig';
import { isNewMode, modeMeta, ACT_META } from '@/data/modes/modeRegistry';
import { PAJAMA_ACTS } from '@/data/pajamaProgram';

const UNIVERSAL_ACTIONS = [
  { key: 'showdirector', label: 'Σκηνές / Show Director' },
  { key: 'finalepres', label: 'Παρουσίαση Finale' },
  { key: 'eventqueue', label: 'Ουρά συμβάντων' },
  { key: 'synctimer', label: 'Χρονόμετρο' },
  { key: 'audio', label: 'Ήχος' },
];

const ACTIONS = [
  { key: 'showdirector', label: 'Σκηνές / Show Director' },
  { key: 'finalepres', label: 'Παρουσίαση Finale' },
  { key: 'eventqueue', label: 'Ουρά συμβάντων' },
  { key: 'synctimer', label: 'Χρονόμετρο' },
  { key: 'audio', label: 'Ήχος' },
  { key: 'trial', label: 'Δίκη' },
  { key: 'shoe', label: 'Ρουλέτα' },
  { key: 'poster', label: 'Αφίσα' },
  { key: 'news', label: 'News' },
  { key: 'slots', label: 'Κουλοχέρης' },
  { key: 'karmaslots', label: 'Φρουτάκια' },
  { key: 'wish', label: 'Επιθυμία' },
  { key: 'oracle', label: 'Μαντείο' },
  { key: 'crypt', label: 'Κρύπτα' },
  { key: 'pact', label: 'Συμβόλαιο' },
  { key: 'grandjury', label: 'Grand Jury' },
  { key: 'sealedvote', label: 'Ψηφοφορία' },
  { key: 'privatemsg', label: 'Ιδιωτικό μήνυμα' },
  { key: 'market', label: 'Blackmail' },
  { key: 'finaldeal', label: 'Final Deal' },
  { key: 'poker', label: 'Πόκερ' },
  { key: 'trivia', label: 'Trivia' },
  { key: 'turnorder', label: 'Σειρά παικτριών' },
];

function formatSeconds(value) {
  const seconds = Math.max(0, Math.floor(value || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function phaseLabel(state) {
  if (isNewMode(state.mode)) {
    const meta = modeMeta(state.mode);
    const act = meta.acts?.[state.mg?.actIndex || 0];
    return ACT_META[act]?.title || act || 'Προετοιμασία';
  }
  if (state.mode === 'marathon') return `Στάδιο ${state.marathonStage || 1} · ${state.round || 1}ος γύρος`;
  if (state.mode === 'arrest_heist') return `Στάδιο ${state.stage || 0} · ${state.round || 1}ος γύρος`;
  if (state.mode === 'pajama') {
    const act = PAJAMA_ACTS[state.pajama?.actIndex || 0];
    return act ? `${act.title} · ${state.pajama?.phase || 'σε εξέλιξη'}` : 'Pajama Show';
  }
  return ({ 0: 'Προετοιμασία', 1: 'Περιπολία', 2: 'Ανάκριση', 3: 'Φινάλε' })[state.stage] || 'Σε εξέλιξη';
}

function episodeTimeline(state) {
  if (isNewMode(state.mode)) {
    const meta = modeMeta(state.mode);
    return (meta?.acts || []).map((id, index) => ({
      id,
      label: ACT_META[id]?.title || id,
      active: id === meta?.acts?.[state.mg?.actIndex || 0],
    }));
  }
  if (state.mode === 'pajama') {
    return PAJAMA_ACTS.map((act, index) => ({ id: act.id, label: act.title, active: index === (state.pajama?.actIndex || 0) }));
  }
  if (state.mode === 'marathon') {
    const stages = ['INFILTRATION', 'VAULT', 'RAIDS', 'LOCKDOWN'];
    return stages.map((label, index) => ({ id: `marathon_${index + 1}`, label, active: index + 1 === (state.marathonStage || 1) }));
  }
  if (state.mode === 'arrest_heist') {
    const stages = ['ARREST & HEIST', 'GRAND HEIST', 'FINALE'];
    return stages.map((label, index) => ({ id: `arrest_${index + 1}`, label, active: index + 1 === (state.stage || 1) }));
  }
  const stages = ['OPENING', 'PATROL', 'INTERROGATION', 'FINALE'];
  return stages.map((label, index) => ({ id: `classic_${index}`, label, active: index === (state.stage || 0) }));
}

function scoreFor(state, player) {
  if (state.mode === 'pajama') return state.pajama?.scores?.[player.id] || 0;
  if (isNewMode(state.mode)) return (state.mg?.scores?.[player.id] || 0) + (state.mg?.tokens?.[player.id] || 0);
  return player.bounty || 0;
}

export default function ControlRoom({ state, playerProfiles = [], onStartSurprise, onRevealSurprise, onOpen, onRefresh, onEndGame, onClose }) {
  const [pendingProfile, setPendingProfile] = useState(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const players = state.players || [];
  const log = (state.history || []).slice(0, 12);
  const modeName = GAME_MODES.find((mode) => mode.id === state.mode)?.name || state.mode || '—';
  const currentIndex = isNewMode(state.mode) ? (state.mg?.turn || 0) : state.mode === 'pajama' ? (state.pajama?.turnIndex || 0) : (state.currentPlayerIndex || 0);
  const currentPlayer = players.length ? players[currentIndex % players.length] : null;
  const syncTimer = state.syncTimer || state.mg?.timer || null;
  const timerActive = typeof syncTimer?.running === 'boolean' ? syncTimer.running : !!(syncTimer?.endsAt && syncTimer.endsAt > now);
  const timerRemaining = syncTimer?.running === false
    ? syncTimer.remaining
    : syncTimer?.endsAt
    ? Math.ceil((syncTimer.endsAt - now) / 1000)
    : syncTimer?.remaining;
  const night = state.night;
  const timeline = episodeTimeline(state);
  const availableActions = isNewMode(state.mode) || state.mode === 'pajama' ? UNIVERSAL_ACTIONS : ACTIONS;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-background/95 p-3 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="mx-auto max-w-5xl space-y-3">
        <div className="comic-panel ds-sheen px-5 py-4">
          <div className="ds-eyebrow text-primary/80">DEAL OF TEMPTATION · LIVE PRODUCTION</div>
          <div className="ds-title mt-1 text-2xl text-foreground">MASTER CONTROL ROOM</div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/70">
            <span>MODE: <strong>{modeName}</strong></span>
            <span>ΠΑΙΚΤΡΙΕΣ: <strong>{players.length}</strong></span>
            <span>ΦΑΣΗ: <strong>{phaseLabel(state)}</strong></span>
            <span>ΓΥΡΟΣ: <strong>{state.round || 1}</strong></span>
          </div>
        </div>

        <ComicPanel className="bg-card">
          <div className="ds-label mb-2 text-primary/80">EPISODE TIMELINE · ΕΞΕΛΙΞΗ MODE</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {timeline.map((item, index) => (
              <div key={item.id} className={`rounded-lg border p-2 text-xs ${item.active ? 'border-primary bg-primary/15 text-primary' : 'border-border/50 bg-secondary text-foreground/55'}`}>
                <div className="font-heading">{index + 1}. {item.label}</div>
                <div className="mt-1 text-[9px]">{item.active ? 'ΤΡΕΧΟΥΣΑ ΦΑΣΗ' : 'ΣΤΑΔΙΟ'}</div>
              </div>
            ))}
          </div>
        </ComicPanel>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ComicPanel className="bg-card p-3">
            <div className="ds-label text-foreground/50">ΤΡΕΧΟΥΣΑ ΠΑΙΚΤΡΙΑ</div>
            <div className="mt-1 font-heading text-lg text-primary">{currentPlayer?.name || '—'}</div>
          </ComicPanel>
          <ComicPanel className="bg-card p-3">
            <div className="ds-label text-foreground/50">ΧΡΟΝΟΜΕΤΡΟ</div>
            <div className="mt-1 font-heading text-2xl text-primary">{syncTimer ? formatSeconds(timerRemaining) : '—'}</div>
            <div className="text-[10px] text-foreground/45">{timerActive ? 'ΕΝΕΡΓΟ' : syncTimer ? 'ΠΑΥΣΗ' : 'ΑΝΕΝΕΡΓΟ'}</div>
          </ComicPanel>
          <ComicPanel className="bg-card p-3">
            <div className="ds-label text-foreground/50">ΣΥΜΒΑΝΤΑ</div>
            <div className="mt-1 font-heading text-2xl text-primary">{(state.history || []).length}</div>
            <div className="text-[10px] text-foreground/45">Καταγεγραμμένες ενέργειες</div>
          </ComicPanel>
          <ComicPanel className="bg-card p-3">
            <div className="ds-label text-foreground/50">ΚΑΤΑΣΤΑΣΗ SHOW</div>
            <div className="mt-1 font-heading text-lg">{state.stopActive ? 'ΠΑΥΣΗ' : 'LIVE'}</div>
            <div className="text-[10px] text-foreground/45">{state.testMode ? 'TEST MODE' : 'ΠΑΡΑΓΩΓΗ'}</div>
          </ComicPanel>
        </div>

        <ComicPanel className="bg-card">
          <div className="ds-label mb-2 text-primary/80">LIVE CAST · ΚΑΤΑΣΤΑΣΗ ΠΑΙΚΤΡΙΩΝ</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {players.map((player, index) => (
              <div key={player.id || player.name} className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary p-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-primary">{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{player.name}</div>
                  <div className="text-[10px] text-foreground/55">
                    {player.team ? `Ομάδα ${player.team} · ` : ''}
                    {state.mode === 'pajama' ? `Αποτυχίες: ${state.pajama?.fails?.[player.id] || 0}` : `Ποινές: ${player.penaltyStep || 0}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-heading text-lg text-primary">{scoreFor(state, player)}</div>
                  <div className="text-[9px] text-foreground/45">{isNewMode(state.mode) || state.mode === 'pajama' ? 'ΠΟΝΤΟΙ' : 'BOUNTY'}</div>
                </div>
              </div>
            ))}
          </div>
        </ComicPanel>

        {playerProfiles.length > 0 && (
          <ComicPanel className="bg-card space-y-3">
            <div>
              <div className="ds-label text-primary/80">PLAYER INTELLIGENCE · ΙΔΙΩΤΙΚΑ ΣΤΟΙΧΕΙΑ</div>
              <div className="text-xs text-foreground/50">Οι απαντήσεις εμφανίζονται μόνο στο Tablet του παρουσιαστή. Τα προσωπικά όρια δεν χρησιμοποιούνται για τη δημιουργία δοκιμασιών.</div>
            </div>
            {playerProfiles.map((profile) => {
              const answers = profile.vipProfile?.answers || {};
              const preferences = answers.activityPreferences || {};
              const wish = String(answers.surpriseWish || '').trim();
              return (
                <div key={profile.playerId} className="rounded-lg border border-primary/20 bg-secondary p-3 space-y-2">
                  <div className="font-heading text-base text-primary">{profile.name}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Προσωπικότητα: <strong>{answers.personality === 'bold' ? 'Τολμηρή' : answers.personality === 'reserved' ? 'Συγκρατημένη' : '—'}</strong></div>
                    <div>Ανταγωνιστικότητα: <strong>{answers.competitiveness || '—'}/5</strong></div>
                    <div>Δυσκολία: <strong>{answers.difficulty || '—'}/5</strong></div>
                    <div>Απρόβλεπτη πρόκληση: <strong>{answers.unexpectedChallenge === 'yes' ? 'ΝΑΙ' : answers.unexpectedChallenge === 'no' ? 'ΟΧΙ' : '—'}</strong></div>
                  </div>
                  {answers.preferredTestType && <div className="text-xs">Προτιμώμενο είδος: <strong>{answers.preferredTestType}</strong></div>}
                  <div className="text-xs text-foreground/65">
                    Προτιμήσεις: {['questions', 'missions', 'surprises'].filter((key) => preferences[key] === 'yes').map((key) => ({ questions: 'Ερωτήσεις', missions: 'Αποστολές', surprises: 'Εκπλήξεις' }[key])).join(' · ') || 'Δεν δήλωσε'}
                  </div>
                  {answers.boundaries && (
                    <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2 text-xs">
                      <strong className="text-amber-300">ΠΡΟΣΩΠΙΚΑ ΟΡΙΑ – ΜΟΝΟ ΓΙΑ ΤΟΝ ΠΑΡΟΥΣΙΑΣΤΗ</strong>
                      <div className="mt-1 whitespace-pre-wrap">{answers.boundaries}</div>
                    </div>
                  )}
                  {wish && (
                    <div className="rounded border border-primary/20 p-2 text-xs">
                      <strong>Επιθυμητή έκπληξη:</strong>
                      <div className="mt-1 whitespace-pre-wrap">{wish}</div>
                      <ComicButton
                        variant="purple"
                        size="sm"
                        className="mt-2 w-full"
                        disabled={answers.activeParticipation === 'no' || !onStartSurprise || !onRevealSurprise}
                        onClick={() => { setPendingProfile(profile); onStartSurprise?.(profile); }}
                      >
                        ΠΡΟΕΤΟΙΜΑΣΙΑ ΠΡΟΣΩΠΙΚΗΣ ΕΚΠΛΗΞΗΣ
                      </ComicButton>
                    </div>
                  )}
                </div>
              );
            })}
            {pendingProfile && (
              <div className="rounded-lg border-2 border-primary bg-primary/10 p-3 space-y-2">
                <div className="font-heading text-sm text-primary">ΕΤΟΙΜΗ ΓΙΑ ΑΠΟΚΑΛΥΨΗ · {pendingProfile.name}</div>
                <div className="text-xs text-foreground/70">Η TV βρίσκεται σε φάση build-up. Η απάντηση θα εμφανιστεί μόνο όταν πατήσεις αποκάλυψη.</div>
                <div className="flex gap-2">
                  <ComicButton variant="yellow" size="md" className="flex-1" onClick={() => { onRevealSurprise?.(pendingProfile); setPendingProfile(null); }}>
                    ΑΠΟΚΑΛΥΨΕ ΤΩΡΑ
                  </ComicButton>
                  <ComicButton variant="dark" size="md" onClick={() => setPendingProfile(null)}>ΑΚΥΡΩΣΗ</ComicButton>
                </div>
              </div>
            )}
          </ComicPanel>
        )}

        {night?.program?.length > 0 && (
          <ComicPanel className="bg-card space-y-2">
            <div className="ds-label text-primary/80">ΠΡΟΓΡΑΜΜΑ ΕΠΕΙΣΟΔΙΟΥ</div>
            {night.program.map((item, index) => (
              <div key={item.id} className={`rounded border p-2 ${index === (night.roundIdx || 0) ? 'border-primary bg-primary/10' : 'border-border/50'}`}>
                <div className="flex justify-between gap-2 text-sm">
                  <strong>{index + 1}. {item.title}</strong>
                  <span className="text-xs text-foreground/55">{item.start}′–{item.end}′</span>
                </div>
                <div className="text-xs text-foreground/60">{item.desc}</div>
              </div>
            ))}
          </ComicPanel>
        )}

        <ComicPanel>
          <div className="ds-label mb-2 text-primary/80">ΣΚΗΝΕΣ & ΕΝΕΡΓΕΙΕΣ</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {availableActions.map((action) => (
              <button key={action.key} onClick={() => onOpen(action.key)} className="comic-boom bg-secondary px-2 py-3 text-left text-xs leading-tight text-foreground">
                {action.label}
              </button>
            ))}
          </div>
        </ComicPanel>

        <div className="grid grid-cols-2 gap-2">
          <ComicButton variant="green" size="sm" onClick={onRefresh}>Επαναφορά σύνδεσης</ComicButton>
          <ComicButton variant="red" size="sm" onClick={onEndGame}>Τέλος παιχνιδιού</ComicButton>
        </div>

        <ComicPanel>
          <div className="ds-label mb-2 text-primary/80">ΕΙΔΟΠΟΙΗΣΕΙΣ & ΣΥΜΒΑΝΤΑ</div>
          {log.length === 0 ? (
            <div className="ds-lede text-sm">Δεν έχουν καταγραφεί συμβάντα.</div>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {log.map((event, index) => (
                <div key={`${event.timestamp || index}-${index}`} className="flex items-baseline gap-2 border-b border-primary/10 pb-1 text-[11px] last:border-0">
                  <span className="shrink-0 text-primary/80">{event.type}</span>
                  <span className="flex-1 text-foreground/75">{event.detail || event.description || event.message || event.player || ''}</span>
                  <span className="shrink-0 text-foreground/35">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
              ))}
            </div>
          )}
        </ComicPanel>

        <ComicButton variant="red" size="sm" onClick={onClose} className="w-full">ΚΛΕΙΣΙΜΟ CONTROL ROOM</ComicButton>
      </div>
    </div>
  );
}
