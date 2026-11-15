import React, { useEffect, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { GAME_MODES } from '@/data/gameConfig';
import { isNewMode, modeMeta, ACT_META } from '@/data/modes/modeRegistry';

const ACTIONS = [
  { key: 'showdirector', label: 'Σκηνές / Show Director' },
  { key: 'finalepres', label: 'Παρουσίαση Finale' },
  { key: 'eventqueue', label: 'Ουρά συμβάντων' },
  { key: 'synctimer', label: 'Χρονόμετρο' },
  { key: 'audio', label: 'Ήχος' },
  { key: 'trial', label: 'Δίκη' },
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
  if (state.mode === 'pajama') return state.pajama?.phase || 'Pajama Show';
  return ({ 0: 'Προετοιμασία', 1: 'Περιπολία', 2: 'Ανάκριση', 3: 'Φινάλε' })[state.stage] || 'Σε εξέλιξη';
}

function scoreFor(state, player) {
  if (state.mode === 'pajama') return state.pajama?.scores?.[player.id] || 0;
  if (isNewMode(state.mode)) return (state.mg?.scores?.[player.id] || 0) + (state.mg?.tokens?.[player.id] || 0);
  return player.bounty || 0;
}

export default function ControlRoom({ state, onOpen, onRefresh, onEndGame, onClose }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const players = state.players || [];
  const log = (state.history || []).slice(0, 12);
  const modeName = GAME_MODES.find((mode) => mode.id === state.mode)?.name || state.mode || '—';
  const currentPlayer = players[state.currentPlayerIndex || 0];
  const syncTimer = state.syncTimer;
  const timerRemaining = syncTimer?.running && syncTimer.endsAt
    ? Math.ceil((syncTimer.endsAt - now) / 1000)
    : syncTimer?.remaining;
  const night = state.night;

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

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ComicPanel className="bg-card p-3">
            <div className="ds-label text-foreground/50">ΤΡΕΧΟΥΣΑ ΠΑΙΚΤΡΙΑ</div>
            <div className="mt-1 font-heading text-lg text-primary">{currentPlayer?.name || '—'}</div>
          </ComicPanel>
          <ComicPanel className="bg-card p-3">
            <div className="ds-label text-foreground/50">ΧΡΟΝΟΜΕΤΡΟ</div>
            <div className="mt-1 font-heading text-2xl text-primary">{syncTimer ? formatSeconds(timerRemaining) : '—'}</div>
            <div className="text-[10px] text-foreground/45">{syncTimer?.running ? 'ΕΝΕΡΓΟ' : syncTimer ? 'ΠΑΥΣΗ' : 'ΑΝΕΝΕΡΓΟ'}</div>
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
            {ACTIONS.map((action) => (
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
