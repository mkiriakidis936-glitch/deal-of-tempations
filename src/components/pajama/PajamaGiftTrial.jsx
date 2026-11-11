import React, { useEffect, useState } from 'react';
import { GIFT_CODE } from '@/data/giftVault';

export default function PajamaGiftTrial({ players, onDone }) {
  const [sacrificedId, setSacrificedId] = useState('');
  const [left, setLeft] = useState(30);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!running || left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [running, left]);

  const sacrificed = players.find((p) => p.id === sacrificedId);
  const done = left <= 0;
  const link = `${window.location.origin}/gift-unlock`;

  function finish(ok) {
    setRunning(false);
    setResult(ok ? 'success' : 'fail');
  }

  function handOver() {
    onDone({
      success: result === 'success',
      sacrificedName: sacrificed?.name || '',
      unlockedAt: Date.now(),
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-950 via-purple-950 to-slate-950 text-pink-50 p-4 pb-16">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="text-center pt-2">
          <div className="text-5xl">🎁</div>
          <div className="font-heading text-2xl text-fuchsia-200 drop-shadow-[0_0_18px_rgba(255,105,180,0.85)]">
            ΟΜΑΔΙΚΟ ΔΩΡΟ
          </div>
          <div className="text-xs text-pink-300">Τελευταία πράξη · πριν το φινάλε</div>
        </div>

        <div className="rounded-xl border border-fuchsia-500/50 bg-fuchsia-950/40 p-3 space-y-2">
          <div className="font-heading text-lg text-fuchsia-100">THE ULTIMATE GROUP GIFT TRIAL</div>
          <p className="text-sm text-pink-50/90">
            Η ομάδα επιλέγει <b>ομόφωνα ή με κλήρο</b> μία παίκτρια που θα θυσιαστεί. Δένεται αυστηρά —
            hogtie με κλειστά μάτια, ή χέρια ψηλά σε δοκάρι με τα πόδια ενωμένα, ώστε να στέκεται μόνο στις μύτες.
          </p>
          <p className="text-sm text-pink-50/90">
            Οι υπόλοιπες φοράνε τις ειδικές κάλτσες, παίρνουν μικρόφωνο για καραόκε, χορεύουν γύρω της και
            γαργαλάνε τα πέλματα ασταμάτητα. Η δεμένη πρέπει να κρατήσει <b>ισορροπία, χωρίς να πέσει και χωρίς να λυθεί</b>.
          </p>
        </div>

        <div className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3">
          <div className="text-xs font-bold uppercase tracking-widest text-pink-300 mb-2">Η θυσία</div>
          <div className="grid grid-cols-2 gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => setSacrificedId(p.id)}
                disabled={!!result}
                className={`py-2 rounded-lg text-sm font-bold border ${sacrificedId === p.id ? 'bg-fuchsia-600 border-fuchsia-300 text-white' : 'bg-slate-900/60 border-pink-500/30 text-pink-200'} disabled:opacity-60`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3">
          <div className="flex items-center justify-between">
            <span className={`font-heading text-4xl ${done ? 'text-rose-400 animate-pulse' : 'text-pink-100'}`}>
              {String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}
            </span>
            <button
              onClick={() => setRunning((r) => !r)}
              disabled={done || !!result || !sacrificedId}
              className="px-4 py-2 rounded-lg font-heading text-sm bg-fuchsia-600 text-white disabled:opacity-40"
            >
              {running ? '⏸ ΠΑΥΣΗ' : '▶ ΕΝΑΡΞΗ 30"'}
            </button>
          </div>
          <div className="h-2 mt-2 rounded bg-pink-900 overflow-hidden">
            <div className="h-full bg-fuchsia-400 transition-all" style={{ width: `${(left / 30) * 100}%` }} />
          </div>
          {!sacrificedId && <div className="text-[11px] text-pink-300 mt-2">Διάλεξε πρώτα τη θυσία.</div>}
        </div>

        {!result && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => finish(true)}
              disabled={!sacrificedId || done}
              className="py-3 rounded-lg font-heading text-lg bg-emerald-600 text-white disabled:opacity-40"
            >
              ✅ ΤΑ ΚΑΤΑΦΕΡΑΝ
            </button>
            <button
              onClick={() => finish(false)}
              disabled={!sacrificedId}
              className="py-3 rounded-lg font-heading text-lg bg-rose-700 text-white disabled:opacity-40"
            >
              ❌ ΕΣΠΑΣΕ
            </button>
          </div>
        )}

        {result === 'success' && (
          <div className="rounded-xl border-2 border-fuchsia-300 bg-fuchsia-500/20 p-4 text-center space-y-3 shadow-[0_0_45px_rgba(255,105,180,0.65)]">
            <div className="text-4xl animate-pulse">🎁✨</div>
            <div className="font-heading text-2xl text-fuchsia-100 drop-shadow-[0_0_18px_rgba(255,105,180,0.9)]">
              ΤΟ ΔΩΡΟ ΞΕΚΛΕΙΔΩΘΗΚΕ
            </div>
            <div className="text-sm text-pink-100">
              Η {sacrificed?.name} άντεξε. Μυστικός κωδικός για το Vault:
            </div>
            <div className="font-heading text-2xl tracking-[0.25em] text-yellow-300 drop-shadow-[0_0_18px_rgba(255,215,0,0.8)]">
              {GIFT_CODE}
            </div>
            <div className="text-xs text-pink-200">Το link για τα κινητά:</div>
            <div className="text-xs break-all bg-slate-950/70 rounded-lg p-2 border border-fuchsia-400/50 text-fuchsia-100">
              {link}
            </div>
            <button
              onClick={() => window.open(link, '_blank')}
              className="w-full py-2 rounded-lg font-heading text-sm bg-fuchsia-600 text-white"
            >
              🔓 ΑΝΟΙΓΜΑ ΑΠΟΚΑΛΥΨΗΣ
            </button>
          </div>
        )}

        {result === 'fail' && (
          <div className="rounded-xl border border-rose-500/60 bg-rose-950/60 p-4 text-center space-y-1">
            <div className="font-heading text-xl text-rose-200">Η δοκιμασία έσπασε</div>
            <div className="text-sm text-rose-100">Το δώρο μένει σφραγισμένο. Κανείς δεν ανοίγει το link.</div>
          </div>
        )}

        {result && (
          <button
            onClick={handOver}
            className="w-full py-3 rounded-lg font-heading text-lg bg-pink-600 text-white"
          >
            ΣΥΝΕΧΕΙΑ: ΦΙΝΑΛΕ →
          </button>
        )}
        {!result && done && (
          <div className="text-center text-sm text-rose-200 font-bold bg-rose-950/60 border border-rose-500/40 rounded-lg p-2">
            ⏱ Ο χρόνος τελείωσε — πάτα «ΕΣΠΑΣΕ».
          </div>
        )}
      </div>
    </div>
  );
}