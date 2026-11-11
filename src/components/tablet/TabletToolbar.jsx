import React, { useMemo, useState } from 'react';
import ComicButton from '@/components/comic/ComicButton';

// Collapsible toolbar for Tablet — hot buttons stay visible, the rest live in grouped panels.
export default function TabletToolbar({
  onQR, onNewGame, onBomb, onFlashbang, bombDisabled, onTrial, onShoeRoulette,
  onSlotMachine, onKarmaSlots, onLastWish, onBlindOracle, onBarefootCrypt,
  onMidnightPact, onGrandJury, onShowDirector, onPrivateMessage, onSealedVote,
  onEventQueue, onAudioControl, onFinalePresentation, onIntro, onSyncTimer, onTurnOrder,
  onLiarsPoker, onTrivia, onFinalDeal, onControlRoom, onMarket, onUndo, undoDisabled,
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');

  const groups = useMemo(() => ([
    {
      id: 'challenges',
      label: 'ΔΟΚΙΜΑΣΙΕΣ',
      items: [
        { label: '⚖️ ΔΙΚΗ', variant: 'purple', onClick: onTrial },
        { label: '👟 ΡΟΥΛΕΤΑ', variant: 'orange', onClick: onShoeRoulette },
        { label: '🎰 ΚΟΥΛΟΧΕΡΗΣ', variant: 'purple', onClick: onSlotMachine },
        { label: '🍒 ΦΡΟΥΤΑΚΙΑ', variant: 'magenta', onClick: onKarmaSlots },
        { label: '🃏 ΠΟΚΕΡ ΨΕΜΑΤΩΝ', variant: 'green', onClick: onLiarsPoker },
        { label: '🧠 TRIVIA', variant: 'purple', onClick: onTrivia },
        { label: '🎲 FINAL DEAL', variant: 'yellow', onClick: onFinalDeal },
        { label: '🔀 ΣΕΙΡΑ', variant: 'cyan', onClick: onTurnOrder },
      ],
    },
    {
      id: 'show',
      label: 'SHOW & TV',
      items: [
        { label: '🎬 SHOW', variant: 'magenta', onClick: onShowDirector },
        { label: '🎬 INTRO', variant: 'magenta', onClick: onIntro },
        { label: '📢 ΟΥΡΑ', variant: 'cyan', onClick: onEventQueue },
        { label: '⚖️ GRAND JURY', variant: 'red', onClick: onGrandJury },
        { label: '🏆 ΦΙΝΑΛΕ', variant: 'yellow', onClick: onFinalePresentation },
      ],
    },
    {
      id: 'manage',
      label: 'ΗΧΟΣ · ΧΡΟΝΟΣ · ΜΥΣΤΙΚΑ',
      items: [
        { label: '⏱ ΧΡΟΝΟΜΕΤΡΟ', variant: 'green', onClick: onSyncTimer },
        { label: '🎵 ΗΧΟΣ', variant: 'green', onClick: onAudioControl },
        { label: '🔮 ΜΑΝΤΕΙΟ', variant: 'purple', onClick: onBlindOracle },
        { label: '🗝️ ΚΡΥΠΤΑ', variant: 'cyan', onClick: onBarefootCrypt },
        { label: '🌙 ΣΥΜΒΟΛΑΙΟ', variant: 'dark', onClick: onMidnightPact },
        { label: '🕯️ ΕΠΙΘΥΜΙΑ', variant: 'magenta', onClick: onLastWish },
        { label: '📨 ΨΙΘΥΡΟΣ', variant: 'purple', onClick: onPrivateMessage },
        { label: '🗳️ ΨΗΦΟΦΟΡΙΑ', variant: 'red', onClick: onSealedVote },
        { label: '🪙 BLACKMAIL', variant: 'orange', onClick: onMarket },
      ],
    },
  ]), [onTrial, onShoeRoulette, onSlotMachine, onKarmaSlots, onLiarsPoker, onTrivia, onFinalDeal,
    onTurnOrder, onShowDirector, onIntro, onEventQueue,
    onGrandJury, onFinalePresentation, onSyncTimer, onAudioControl, onBlindOracle, onBarefootCrypt,
    onMidnightPact, onLastWish, onPrivateMessage, onSealedVote, onMarket]);

  const q = query.trim().toLowerCase();
  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.onClick && (!q || i.label.toLowerCase().includes(q))) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="fixed bottom-3 left-3 z-50 flex flex-col gap-2 items-start">
      {expanded && (
        <div className="comic-slide-in ds-surface comic-slide-in w-64 max-h-[60vh] overflow-y-auto p-2 space-y-3 shadow-panel">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Αναζήτηση εργαλείου"
            className="w-full rounded-md border border-primary/20 bg-input px-2.5 py-1.5 font-ui text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none"
          />
          {visible.length === 0 && (
            <div className="ds-label px-1">Κανένα εργαλείο</div>
          )}
          {visible.map((g) => (
            <div key={g.id}>
              <div className="ds-label mb-1.5 px-1 text-primary/80">{g.label}</div>
              <div className="flex flex-col gap-1">
                {g.items.map((i) => (
                  <ComicButton
                    key={i.label}
                    variant={i.variant}
                    size="sm"
                    onClick={() => { i.onClick(); setExpanded(false); }}
                  >
                    {i.label}
                  </ComicButton>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 max-w-[calc(100vw-1.5rem)] rounded-lg border border-primary/20 bg-surface-1/90 p-1.5 shadow-raised backdrop-blur">
        <ComicButton variant="cyan" size="sm" onClick={onQR}>📷 QR</ComicButton>
        {!bombDisabled && <ComicButton variant="red" size="sm" onClick={onBomb}>💣 BOMB</ComicButton>}
        <ComicButton variant="dark" size="sm" onClick={onFlashbang}>⚡ FLASHBANG</ComicButton>
        <ComicButton variant="yellow" size="sm" onClick={onControlRoom}>🎛️ CONTROL ROOM</ComicButton>
        {onUndo && (
          <ComicButton variant="white" size="sm" onClick={onUndo} disabled={undoDisabled}>↶ ΑΝΑΙΡΕΣΗ</ComicButton>
        )}
        <ComicButton variant="dark" size="sm" onClick={onNewGame}>🔄 ΝΕΟ</ComicButton>
        <ComicButton
          variant={expanded ? 'red' : 'magenta'}
          size="sm"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? '✕ ΚΛΕΙΣΙΜΟ' : '⚙️ ΕΡΓΑΛΕΙΑ'}
        </ComicButton>
      </div>
    </div>
  );
}