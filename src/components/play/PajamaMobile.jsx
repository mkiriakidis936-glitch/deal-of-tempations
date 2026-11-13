import React, { useState } from 'react';
import { PAJAMA_BOARD, SQUARE_META } from '@/data/pajamaBoard';
import { PAJAMA_ACTS } from '@/data/pajamaProgram';
import PediPassport from '@/components/play/PediPassport';

const PHASE_LABEL = {
  setup: 'SETUP',
  dashboard: '🗺️ ΤΑΜΠΛΟ',
  wheel: '🎡 ΤΡΟΧΟΣ',
  confessions: '🤫 ΕΞΟΜΟΛΟΓΗΣΕΙΣ',
  morning: '☀️ ΠΡΩΙΝΗ ΦΑΣΗ',
  finale: '👑 ΦΙΝΑΛΕ',
};

export default function PajamaMobile({ pj = {}, players = [], me, updateState, onChangePlayer }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const positions = pj.positions || {};
  const scores = pj.scores || {};
  const bindings = pj.bindings || {};
  const confessions = pj.confessions || [];
  const current = players[pj.turnIndex ?? 0];
  const myPos = positions[me.id] || 0;
  const myBinding = bindings[me.id];
  const mySecret = confessions.find((c) => c.playerId === me.id);
  const writing = pj.phase === 'confessions' && !(pj.order?.length > 0);
  const ranking = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const act = PAJAMA_ACTS[Math.min(pj.actIndex || 0, PAJAMA_ACTS.length - 1)];

  async function sendSecret() {
    if (!draft.trim() || sending) return;
    setSending(true);
    const next = [...confessions.filter((c) => c.playerId !== me.id), { playerId: me.id, text: draft.trim() }];
    await updateState({ pajama: { ...pj, confessions: next } });
    setDraft('');
    setSending(false);
  }

  return (
    <div className="min-h-screen comic-dots p-3 pb-10">
      <div className="max-w-md mx-auto space-y-3">
        <div className="text-center text-[10px] uppercase tracking-[0.3em] text-foreground/60">
          {PHASE_LABEL[pj.phase] || PHASE_LABEL.dashboard}
        </div>

        <PediPassport pj={pj} players={players} me={me} />

        {pj.phase === 'dashboard' && current?.id === me.id && (
          <div className="comic-panel bg-destructive text-center py-2 comic-pulse">
            <div className="font-heading text-xl text-foreground">🎲 ΣΕΙΡΑ ΣΟΥ</div>
            <div className="text-xs text-foreground/80">Πάρε το tablet και ρίξε τα ζάρια.</div>
          </div>
        )}

        {myBinding && (
          <div className="comic-panel bg-rose-950/70 p-3">
            <div className="font-heading text-base text-rose-200">🎀 Δεμένη</div>
            <div className="text-xs text-rose-100">{myBinding.label}</div>
          </div>
        )}

        {pj.activeCard && (
          <div className="comic-panel bg-fuchsia-950/70 p-3">
            <div className="text-[10px] uppercase tracking-widest text-pink-300">Ενεργή κάρτα</div>
            {pj.activeCard.title && (
              <div className="font-heading text-lg text-pink-100">{pj.activeCard.title}</div>
            )}
            <p className="text-sm text-pink-50 font-body leading-snug">{pj.activeCard.text}</p>
          </div>
        )}

        {writing && (
          <div className="comic-panel bg-card p-3 space-y-2">
            <div className="font-heading text-lg text-primary">🤫 Το μυστικό σου</div>
            {mySecret ? (
              <div className="text-sm bg-emerald-900/40 rounded px-2 py-1 text-emerald-200">
                ✓ Καταχωρήθηκε — καμία άλλη δεν το βλέπει.
              </div>
            ) : (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  placeholder="Γράψε εδώ το μυστικό σου..."
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={sendSecret}
                  disabled={!draft.trim() || sending}
                  className="w-full py-2.5 rounded-lg font-heading bg-primary text-primary-foreground disabled:opacity-40"
                >
                  {sending ? 'ΑΠΟΣΤΟΛΗ...' : 'ΚΑΤΑΧΩΡΗΣΗ'}
                </button>
              </>
            )}
            <div className="text-[10px] text-foreground/60">
              {confessions.length}/{players.length} μυστικά έχουν καταχωρηθεί.
            </div>
          </div>
        )}

        <div className="comic-panel bg-card p-3">
          <div className="font-heading text-sm text-primary mb-1">Βαθμολογία</div>
          {ranking.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm text-foreground">
              <span className={p.id === me.id ? 'font-bold' : ''}>{p.name}</span>
              <b>{scores[p.id] || 0}</b>
            </div>
          ))}
        </div>

        <div className="comic-panel bg-secondary p-2">
          <div className="font-heading text-xs text-foreground/80 mb-1">🗺️ Ταμπλό 44</div>
          <div className="grid grid-cols-11 gap-0.5">
            {PAJAMA_BOARD.map((sq) => {
              const meta = SQUARE_META[sq.type] || SQUARE_META.nails;
              return (
                <div
                  key={sq.index}
                  className={`aspect-square rounded-sm flex items-center justify-center text-[7px] ${
                    sq.type === 'finish' ? 'bg-yellow-300 text-tarot-dark' : 'bg-background/70'
                  } ${sq.index === myPos ? 'ring-2 ring-primary' : ''}`}
                >
                  {sq.index === myPos ? '●' : meta.icon}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onChangePlayer}
          className="w-full py-2 rounded-lg font-heading text-sm border-2 border-border bg-secondary text-foreground"
        >
          🔄 ΑΛΛΑΓΗ ΠΑΙΚΤΡΙΑΣ
        </button>
      </div>
    </div>
  );
}