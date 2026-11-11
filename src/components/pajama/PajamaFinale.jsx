import React, { useState } from 'react';
import { PAJAMA_FINALE_RULES } from '@/data/pajamaContent';
import PajamaTimer from '@/components/pajama/PajamaTimer';
import CertificateDownload from '@/components/pajama/CertificateDownload';

const EMPTY_BD = { main: 0, confessions: 0, sabotage: 0 };

export default function PajamaFinale({ players, pj, onEnd, onRematch }) {
  const [verdictStarted, setVerdictStarted] = useState(false);

  const ranking = [...players].sort((a, b) => (pj.scores[b.id] || 0) - (pj.scores[a.id] || 0));
  const winner = ranking[0];
  const loser = ranking[ranking.length - 1];
  const second = ranking.length > 1 ? ranking[ranking.length - 2] : null;
  const medal = ['🥇', '🥈', '🥉'];
  const bd = (id) => ({ ...EMPTY_BD, ...(pj.breakdown?.[id] || {}) });
  const teamTotal = (t) => players.filter((p) => pj.teams?.[p.id] === t).reduce((s, p) => s + (pj.scores[p.id] || 0), 0);
  const teamA = teamTotal('A');
  const teamB = teamTotal('B');

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-pink-950 to-slate-950 text-pink-50 p-4 pb-16">
      <div className="max-w-xl mx-auto space-y-3">
        <div className="text-center pt-4">
          <div className="text-5xl">👑🩴</div>
          <div className="font-heading text-2xl text-pink-100 mt-1">Βασίλισσα του Pedi-Glam</div>
          <div className="font-heading text-3xl text-pink-300 drop-shadow-[0_0_18px_rgba(255,105,180,0.85)] animate-pulse">
            {winner?.name}
          </div>
          <div className="text-sm text-pink-300">{pj.scores[winner?.id] || 0} πόντοι · απόλυτη ασυλία</div>
        </div>

        {pj.teamMode && (
          <div className="rounded-xl border-2 border-amber-400/60 bg-amber-950/40 p-3">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-300">⚔️ Ομαδικό αποτέλεσμα</div>
            <div className="font-heading text-2xl text-amber-100">
              ΟΜΑΔΑ {teamA >= teamB ? 'A' : 'B'} · {Math.max(teamA, teamB)} πόντοι
            </div>
            <div className="text-xs text-amber-200/80">A {teamA} — B {teamB}</div>
          </div>
        )}

        <div className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3 space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-pink-300">Ψηφιακή Βαθμολογία</div>
          {ranking.map((p, i) => {
            const b = bd(p.id);
            return (
              <div key={p.id} className="border-t border-pink-500/20 pt-1.5 first:border-0 first:pt-0">
                <div className="flex items-center justify-between text-lg">
                  <span>{medal[i] || `${i + 1}.`} {p.name}</span>
                  <b className="text-pink-100">{pj.scores[p.id] || 0}</b>
                </div>
                <div className="text-[11px] text-pink-300/80">
                  Δοκιμασίες & ερωτήσεις {b.main} · Confessions {b.confessions} · Σαμποτάζ {b.sabotage}
                </div>
              </div>
            );
          })}
        </div>

        {pj.gift && (
          <div className={`rounded-xl border p-3 text-sm ${pj.gift.success ? 'border-fuchsia-400/60 bg-fuchsia-950/50 text-fuchsia-100' : 'border-rose-500/50 bg-rose-950/50 text-rose-100'}`}>
            🎁 Ομαδικό δώρο: {pj.gift.success ? `ξεκλειδώθηκε (η ${pj.gift.sacrificedName} άντεξε)` : 'έμεινε σφραγισμένο'}
          </div>
        )}

        {pj.boardFinish && (
          <div className="rounded-xl border border-yellow-300/60 bg-yellow-400/15 px-3 py-2 text-sm text-yellow-100">
            🏁 Τερματισμός ταμπλό: <b>{pj.boardFinish.name}</b> έφτασε πρώτη στο 44 (γύρος {pj.boardFinish.round}, +5)
          </div>
        )}

        {pj.saboteurId && (
          <div className="rounded-xl border-2 border-fuchsia-500/60 bg-fuchsia-950/50 p-3 space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-fuchsia-300">😈 Αποκάλυψη: Secret Saboteur</div>
            <div className="font-heading text-2xl text-fuchsia-100">
              {players.find((p) => p.id === pj.saboteurId)?.name || '—'}
            </div>
            {pj.secretOrders?.length > 0 && (
              <div className="text-xs text-fuchsia-200/80">
                🔒 Κρυφές οδηγίες: {pj.secretOrders.length} · {pj.secretOrders.map((o) => o.icon).join(' ')}
              </div>
            )}
            {pj.sabotages?.length > 0 ? (
              <div className="text-xs text-fuchsia-200/80 space-y-0.5">
                {pj.sabotages.map((s, i) => (
                  <div key={i}>Γύρος {s.round}: {s.icon} {s.action} → {s.targetName}</div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-fuchsia-200/80">Δεν σαμπόταρε καμία — κρατήθηκε καθαρή όλο το βράδυ.</div>
            )}
          </div>
        )}

        <div className="rounded-xl border-2 border-rose-500/70 bg-rose-950/60 p-3 space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-rose-300">⚠️ Tickle Penalty &amp; Pedi-Care Alert</div>
          <div className="font-heading text-xl text-rose-200">The Bound Tickle Penalty — {loser?.name}</div>
          <p className="text-sm text-rose-100">
            Δένεται χειροπόδαρα με τις σατέν ζώνες πάνω στο κρεβάτι και δέχεται 60 δευτερόλεπτα αλύπητου
            γαργαλητού στα πέλματα από όλες τις συμπαίκτριες ταυτόχρονα.
          </p>
          {verdictStarted ? (
            <PajamaTimer seconds={60} autoStart />
          ) : (
            <button
              onClick={() => setVerdictStarted(true)}
              className="w-full py-3 rounded-lg font-heading text-lg bg-yellow-400 text-slate-900 shadow-[0_0_35px_rgba(255,215,0,0.6)]"
            >
              👑 Η {winner?.name} ΠΑΤΑΕΙ ΤΟ ΚΟΥΜΠΙ ΤΗΣ ΠΟΙΝΗΣ
            </button>
          )}
        </div>

        {second && (
          <div className="rounded-xl border border-amber-400/50 bg-amber-950/40 p-3 space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-300">☕ Morning Coffee Duty</div>
            <div className="font-heading text-xl text-amber-100">{second.name}</div>
            <p className="text-sm text-amber-100/80">
              Σερβίρει τον πρώτο καφέ ή χυμό στα κρεβάτια των υπόλοιπων, φορώντας υποχρεωτικά τις πιο άσχημες,
              παραταιριαστές ή τρύπιες κάλτσες και παντόφλες του «καλαθιού ντροπής».
            </p>
          </div>
        )}

        <div className="rounded-xl border border-pink-500/30 bg-pink-950/40 p-3 text-xs text-pink-100/80 space-y-1">
          {PAJAMA_FINALE_RULES.map((line) => <div key={line}>• {line}</div>)}
        </div>

        <CertificateDownload name={winner?.name} score={pj.scores[winner?.id] || 0} breakdown={bd(winner?.id)} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button onClick={onRematch} className="py-3 rounded-lg font-heading text-lg bg-fuchsia-600 text-white">
            🔁 REMATCH
          </button>
          <button onClick={onEnd} className="py-3 rounded-lg font-heading text-lg bg-pink-600 text-white">
            ΤΕΛΟΣ ΠΑΙΧΝΙΔΙΟΥ
          </button>
        </div>
        <div className="text-center text-[11px] text-pink-300/70">
          Rematch: νέα παρτίδα με τις ίδιες παίκτριες, μηδενικά σκορ.
        </div>
      </div>
    </div>
  );
}