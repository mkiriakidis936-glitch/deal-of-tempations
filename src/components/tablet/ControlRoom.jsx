import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import RecapExport from '@/components/tablet/RecapExport';

const ACTIONS = [
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
  { key: 'market', label: 'Blackmail' },
  { key: 'sealedvote', label: 'Ψηφοφορία' },
  { key: 'finaldeal', label: 'Final Deal' },
  { key: 'poker', label: 'Πόκερ' },
  { key: 'trivia', label: 'Trivia' },
  { key: 'turnorder', label: 'Σειρά' },
  { key: 'synctimer', label: 'Χρονόμετρο' },
  { key: 'ainarrator', label: 'AI' },
  { key: 'showdirector', label: 'Show' },
  { key: 'privatemsg', label: 'Ψίθυρος' },
  { key: 'eventqueue', label: 'Ουρά' },
  { key: 'audio', label: 'Ήχος' },
  { key: 'finalepres', label: 'Φινάλε' },
];

export default function ControlRoom({ state, onOpen, onRefresh, onEndGame, onClose }) {
  const log = (state.history || []).slice(0, 12);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-background/95 p-3 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="mx-auto max-w-3xl space-y-3">
        <div className="comic-panel ds-sheen px-5 py-4">
          <div className="ds-eyebrow text-primary/80">Αφέντρα του Παιχνιδιού</div>
          <div className="ds-title mt-1 text-2xl text-foreground">Αίθουσα Ελέγχου</div>
          <div className="ds-label mt-2">{state.players?.length || 0} παίκτριες · όλα τα εργαλεία σε ένα σημείο</div>
        </div>

        <ComicPanel>
          <div className="ds-label mb-2">Εργαλεία</div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {ACTIONS.map((a) => (
              <button
                key={a.key}
                onClick={() => onOpen(a.key)}
                className="comic-boom bg-secondary px-1 py-2 text-[11px] leading-tight text-foreground"
              >
                {a.label}
              </button>
            ))}
          </div>
        </ComicPanel>

        <div className="grid grid-cols-2 gap-2">
          <ComicButton variant="green" size="sm" onClick={onRefresh}>Επαναφορά σύνδεσης</ComicButton>
          <ComicButton variant="red" size="sm" onClick={onEndGame}>Τέλος παιχνιδιού</ComicButton>
        </div>

        <ComicPanel>
          <div className="ds-label mb-2 text-primary/80">Log ενεργειών</div>
          {log.length === 0 ? (
            <div className="ds-lede text-sm">Καμία ενέργεια ακόμα.</div>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {log.map((e, i) => (
                <div key={i} className="flex items-baseline gap-2 border-b border-primary/10 pb-1 text-[11px] last:border-0">
                  <span className="ds-label shrink-0 text-primary/80">{e.type}</span>
                  <span className="ds-value text-right text-foreground/75">{e.detail || e.description || e.message || ''}</span>
                </div>
              ))}
            </div>
          )}
        </ComicPanel>
      </div>
    </div>
  );
}