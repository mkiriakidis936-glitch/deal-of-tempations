import React from 'react';
import ComicButton from '@/components/comic/ComicButton';
import { getCurrentPenalty } from '@/lib/gameLogic';
import { getPenaltyLadder } from '@/data/gameConfig';

export default function MugshotScreen({ player, onContinue }) {
  const ladder = getPenaltyLadder(player?.footwearLevel || 2);
  const crimes = ladder.slice(0, player?.penaltyStep || 0).map((s) => s.label);

  return (
    <div className="comic-dots-dark flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="overflow-hidden rounded-lg border border-primary/15 bg-surface-2/85">
          <div className="relative flex h-64 items-center justify-center border-b border-primary/12 bg-surface-1">
            <div className="absolute inset-0 flex flex-col">
              <div className="flex flex-1 items-center justify-center">
                <div className="text-7xl opacity-70">🚔</div>
              </div>
              <div className="absolute bottom-0 left-0 top-0 flex w-9 flex-col justify-between py-2">
                {[6, 5, 4, 3].map((h) => (
                  <div key={h} className="border-t border-primary/12 pl-1 ds-value text-[9px] leading-none text-foreground/35">
                    {h}′
                  </div>
                ))}
              </div>
              <div className="absolute right-3 top-3 rounded-sm border border-primary/20 px-2 py-0.5 ds-label text-foreground/45">
                Case file
              </div>
            </div>
            <div className="absolute bottom-2 right-2 rounded-sm border border-primary/12 bg-background/70 px-2 py-1 ds-value font-mono text-[10px] text-foreground/50">
              {new Date().toLocaleDateString('el-GR')}
            </div>
          </div>

          <div className="space-y-3 p-5">
            <div className="text-center">
              <div className="ds-eyebrow text-primary/80">Σύλληψη</div>
              <h1 className="ds-title mt-2 text-2xl">{player?.name || 'Αγνωστη'}</h1>
              <div className="ds-label mt-2 text-destructive">Συλληφθη</div>
            </div>

            <div className="rounded-sm border border-primary/12 bg-surface-1/70 p-3">
              <div className="mb-2 flex items-baseline justify-between border-b border-primary/10 pb-1.5">
                <span className="ds-label text-primary/80">Εγκλήματα</span>
                <span className="ds-value text-xs text-foreground/50">{crimes.length}</span>
              </div>
              {crimes.length > 0 ? (
                <ul className="space-y-1">
                  {crimes.map((c, i) => (
                    <li key={i} className="font-body text-[0.95rem] text-foreground/80">
                      <span className="ds-value mr-2 text-[10px] text-foreground/35">{i + 1}</span>
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="font-body text-sm text-foreground/45">Καμία ποινή ακόμα.</div>
              )}
            </div>

            <div className="flex items-baseline justify-between border-t border-primary/10 pt-2 ds-label">
              <span>Τωρινή ποινή</span>
              <span className="ds-value text-xs text-foreground/70">
                {getCurrentPenalty(player)?.label || 'Ελεύθερη'} · {player?.penaltyStep || 0}/{ladder.length}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <ComicButton variant="yellow" size="lg" onClick={onContinue}>
            📸 Συνέχεια
          </ComicButton>
        </div>
      </div>
    </div>
  );
}