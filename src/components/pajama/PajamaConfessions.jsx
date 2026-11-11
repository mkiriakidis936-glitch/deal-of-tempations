import React, { useState } from 'react';
import { PAJAMA_SECRETS, PAJAMA_SCORING } from '@/data/pajamaContent';

export default function PajamaConfessions({ players, pj, secretIdeas, onSubmit, onStartGuessing, onGuess }) {
  const [drafts, setDrafts] = useState({});
  const ideas = secretIdeas && secretIdeas.length > 0 ? secretIdeas : PAJAMA_SECRETS;

  const done = pj.confessions.length >= players.length;
  const guessing = pj.order.length > 0;

  if (!guessing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-pink-950 to-slate-950 text-pink-50 p-4 pb-16">
        <div className="max-w-xl mx-auto space-y-3">
          <div className="text-center">
            <div className="font-heading text-2xl text-pink-100">🤫 SECRET CONFESSIONS</div>
            <div className="text-sm text-pink-300">{pj.confessions.length}/{players.length} μυστικά γράφτηκαν</div>
            </div>

            {pj.boardFinish && (
            <div className="rounded-xl border border-yellow-300/60 bg-yellow-400/15 px-3 py-2 text-sm text-yellow-100">
              🏁 Το ταμπλό έκλεισε: <b>{pj.boardFinish.name}</b> τερμάτισε στο 44 στον γύρο {pj.boardFinish.round} (+5)
            </div>
            )}

          <div className="rounded-xl border border-pink-500/30 bg-pink-950/40 p-3 text-xs text-pink-100/80">
            Ιδέες: {ideas[0]} · {ideas[5] || ideas[1]}
          </div>

          {players.map((p) => {
            const mine = pj.confessions.find((c) => c.playerId === p.id);
            return (
              <div key={p.id} className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3 space-y-2">
                <div className="font-heading text-lg text-pink-100">{p.name}</div>
                {mine ? (
                  <div className="text-sm bg-emerald-900/40 rounded px-2 py-1 text-emerald-200">✓ Καταχωρήθηκε</div>
                ) : (
                  <div className="flex gap-2">
                    <textarea
                      value={drafts[p.id] || ''}
                      onChange={(e) => setDrafts({ ...drafts, [p.id]: e.target.value })}
                      rows={2}
                      placeholder="Γράψε το μυστικό σου..."
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-950/60 border border-pink-500/40 text-pink-50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                    <button
                      onClick={() => { onSubmit(p.id, drafts[p.id] || ''); setDrafts({ ...drafts, [p.id]: '' }); }}
                      className="px-3 rounded-lg font-heading bg-pink-600 text-white text-sm"
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={onStartGuessing}
            disabled={!done}
            className="w-full py-3 rounded-lg font-heading text-lg bg-pink-600 text-white disabled:opacity-40"
          >
            ΑΝΑΚΑΤΕΜΑ & ΜΑΝΤΕΨΤΕ
          </button>
        </div>
      </div>
    );
  }

  const secret = pj.confessions[pj.order[pj.confessionIndex]];
  const guesser = players[pj.guesserIndex % players.length];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-pink-950 to-slate-950 text-pink-50 p-4 pb-16">
      <div className="max-w-xl mx-auto space-y-3">
        <div className="text-center">
          <div className="font-heading text-2xl text-pink-100">🤫 ΜΑΝΤΕΨΤΕ</div>
          <div className="text-sm text-pink-300">
            Κάρτα {pj.confessionIndex + 1}/{pj.order.length} · Μάντισσα: <b className="text-pink-100">{guesser?.name}</b>
          </div>
        </div>

        {pj.lastGuess && (
          <div className="rounded-lg px-3 py-2 text-sm font-bold bg-pink-900/60 text-pink-100">{pj.lastGuess}</div>
        )}

        <div className="rounded-xl border border-pink-500/50 bg-pink-950/60 p-4">
          <p className="text-lg leading-snug text-pink-50">{secret?.text}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => onGuess(p.id)}
              className="py-3 rounded-lg font-heading bg-pink-800/70 hover:bg-pink-700 text-white"
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-pink-500/30 bg-pink-950/40 p-3 text-xs text-pink-100/80 space-y-1">
          {PAJAMA_SCORING.slice(1, 3).map((line) => <div key={line}>• {line}</div>)}
        </div>
      </div>
    </div>
  );
}