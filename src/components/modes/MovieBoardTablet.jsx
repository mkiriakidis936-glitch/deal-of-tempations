import React, { useState } from 'react';
import { Panel, Btn } from '@/components/modes/ModeShell';
import { useWheelTools } from '@/components/modes/MovieGamesTablet';
import { PlayerAvatar, colorOf } from '@/components/modes/MovieGameUI';
import * as B from '@/lib/movieBoardEngine';
import * as G from '@/lib/movieGamesEngine';
import { TRIALS, MOVIE_CARDS } from '@/data/modes/campaignContent';
import { BOARD_SQUARES, SQUARE_KINDS, squareOf } from '@/data/modes/movieBoard';
import { fillAll, wheelOf } from '@/data/modes/movieGames';

// Η ΤΑΙΝΙΑ · Tablet — Οθόνη 8: Ταμπλό & Ζάρι. Οι παίκτριες ρίχνουν από το κινητό· εδώ η σκηνοθέτρια
// βλέπει ποια παίζει, σε ποιο τετράγωνο έπεσε, και με ΕΝΑ πάτημα ξεκινά τη σκηνή του τετραγώνου.
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export default function MovieBoardTablet({ ctx, cg, up, players, allowed, startTrial, sendCard, setScreen }) {
  const { nameOf, log } = ctx;
  const { spin } = useWheelTools({ ctx, cg, up, allowed });
  const [trialId, setTrialId] = useState('');
  const [cardId, setCardId] = useState('');
  const b = cg.board;
  const on = B.boardOn(cg);
  const turn = B.turnPid(cg);
  const pending = b?.pending;
  const sq = pending ? squareOf(pending.index) : null;
  const okTrials = (pid) => TRIALS.filter((t) => t.id !== 'nightsock' && allowed(pid, t));
  const okCards = (pid) => MOVIE_CARDS.filter((c) => !['final', 'risk'].includes(c.vote) && allowed(pid, c));
  const chosenTrial = pending && (TRIALS.find((t) => t.id === trialId && okTrials(pending.pid).includes(t)) || null);
  const chosenCard = pending && (MOVIE_CARDS.find((c) => c.id === cardId) || null);

  const roll = () => {
    if (!turn) return;
    const v = B.rollDie();
    up((c) => B.boardRoll(c, turn, v).cg);
    log(`🎲 ${nameOf(turn)} έφερε ${v} → ${squareOf(Math.min(BOARD_SQUARES.length - 1, (b.pos[turn] || 0) + v)).title}`);
    setTrialId(''); setCardId('');
  };
  const next = () => { up((c) => B.boardResolve(c)); setTrialId(''); setCardId(''); };

  // Η ενέργεια του τετραγώνου (ένα πάτημα).
  const SquareAction = () => {
    if (!pending || !sq) return null;
    const pid = pending.pid;
    if (sq.kind === 'trial') {
      const list = okTrials(pid);
      const t = chosenTrial || null;
      if (!list.length) return <p className="text-sm opacity-70">Καμία δοκιμασία εντός ορίων — πάτα «Επόμενη σειρά».</p>;
      return (
        <div className="flex flex-wrap gap-2">
          {!t && <Btn color="bg-amber-500" onClick={() => setTrialId(pick(list).id)}>🎲 Κλήρωσε δοκιμασία</Btn>}
          {t && <Btn color="bg-red-600" onClick={() => startTrial(t.id, pid, [])}>{t.icon} Ξεκίνα: {t.title}</Btn>}
          {t && <Btn onClick={() => setTrialId(pick(list).id)}>🔀 Άλλη</Btn>}
        </div>
      );
    }
    if (sq.kind === 'card') {
      const list = okCards(pid);
      const c = chosenCard;
      if (!list.length) return <p className="text-sm opacity-70">Καμία κάρτα εντός ορίων.</p>;
      return (
        <div className="flex flex-wrap gap-2">
          {!c && <Btn color="bg-amber-500" onClick={() => setCardId(pick(list).id)}>🎴 Τράβα κάρτα</Btn>}
          {c && <Btn color="bg-amber-500" onClick={() => sendCard(c.id, pid)}>🎴 Στείλε στην TV: {c.title}</Btn>}
          {c && <Btn onClick={() => setCardId(pick(list).id)}>🔀 Άλλη</Btn>}
        </div>
      );
    }
    if (sq.kind === 'wheel') {
      const w = wheelOf(Number(sq.value) || 1);
      return <Btn color="bg-red-600" onClick={() => spin(w.id, pid, 'board')}>🎡 Γύρνα {w.name}: {w.subtitle}</Btn>;
    }
    if (sq.kind === 'game') {
      return <Btn color="bg-amber-500" onClick={() => { up((c) => G.todStart(c, pid)); log(`🎭 Θάρρος ή Αλήθεια: ${nameOf(pid)}`); setScreen(7); }}>🎭 Ξεκίνα Θάρρος ή Αλήθεια → «Τροχοί, Deal & Παιχνίδια»</Btn>;
    }
    if (sq.kind === 'chair') {
      const blocked = players.find((p) => p.id === pid)?.movieProfile?.chairOk === false || !allowed(pid, { title: 'Καρέκλα Ανάκρισης δέσιμο', text: 'δέσιμο χέρια πόδια' });
      if (blocked) return <p className="text-sm opacity-70">Η Καρέκλα είναι εκτός ορίων της — πάτα «Επόμενη σειρά» (PASS).</p>;
      return <Btn color="bg-red-600" onClick={() => { up((c) => G.todStart(G.chairIn(c, pid), pid)); log(`🪑 ${nameOf(pid)} στην Καρέκλα`); setScreen(7); }}>🪑 Στην Καρέκλα + Θάρρος ή Αλήθεια → «Τροχοί, Deal & Παιχνίδια»</Btn>;
    }
    if (sq.kind === 'mission') {
      return <Btn color="bg-amber-500" onClick={() => setScreen(1)}>📲 Στείλε μυστική αποστολή («Πράξεις & ΣΤΟΠ»)</Btn>;
    }
    return null;
  };

  return (
    <Panel title="🎲 Ταμπλό & Ζάρι" accent="gold">
      <p className="text-sm opacity-75">Οι παίκτριες ρίχνουν το ζάρι από το κινητό τους, με τη σειρά. Το πιόνι προχωρά στην TV και το τετράγωνο λέει τι ακολουθεί. Τα αυτόματα τετράγωνα (πόντοι, λεία, ένταλμα, ασφαλές, ξαναρίχνεις, χάνεις σειρά, τέλος) γίνονται μόνα τους.</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold">
          <input type="checkbox" checked={!!cg.boardMode} onChange={(e) => up((c) => B.setBoardMode(c, e.target.checked))} />
          Ζάρι σε κάθε νέα πράξη
        </label>
        {!on && <Btn color="bg-amber-500" disabled={!players.length} onClick={() => { up((c) => B.boardStart(c, players)); log('🎲 Ξεκίνησε το ταμπλό'); }}>▶ Ξεκίνα ταμπλό τώρα</Btn>}
        {on && <Btn onClick={() => { if (window.confirm('Σταμάτημα ταμπλό; (οι θέσεις χάνονται)')) up((c) => B.boardStop(c)); }}>⏹ Σταμάτα ταμπλό</Btn>}
      </div>

      {on && b.allDone && (
        <div className="mvg-glass space-y-2 p-3">
          <div className="font-bold">👑 Όλες τερμάτισαν την ήπειρο.</div>
          <Btn color="bg-red-600" onClick={() => setScreen(1)}>■ Πήγαινε να κλείσεις την πράξη («Πράξεις & ΣΤΟΠ»)</Btn>
        </div>
      )}

      {on && !b.allDone && (
        <div className="mvg-glass mvg-3d space-y-3 p-3">
          <div className="flex items-center gap-3">
            {turn && <PlayerAvatar name={nameOf(turn)} color={colorOf(players, turn)} size={48} />}
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-widest opacity-60">Σειρά</div>
              <div className="text-xl font-black">{turn ? nameOf(turn) : '—'}{b.extra ? ' · ξαναρίχνει' : ''}</div>
              <div className="text-xs opacity-60">{pending ? 'Περιμένει τη σκηνή του τετραγώνου' : 'Ρίχνει από το κινητό της'}</div>
            </div>
            {!pending && <Btn className="ml-auto" color="bg-amber-500" onClick={roll}>🎲 Ρίξε για εκείνη</Btn>}
            {!pending && <Btn onClick={() => { up((c) => B.boardPass(c)); log(`⏭ PASS σειράς: ${nameOf(turn)}`); }}>⏭ PASS</Btn>}
          </div>
          {b.roll && <div className="text-sm opacity-80">Τελευταία ζαριά: <b>{nameOf(b.roll.pid)}</b> έφερε <b className="text-[#E8C26B]">{b.roll.value}</b> → {squareOf(b.roll.to).title}</div>}
          {pending && sq && (
            <div className="space-y-2 rounded-2xl p-3" style={{ background: `${SQUARE_KINDS[sq.kind]?.color || '#333'}22`, border: `1px solid ${SQUARE_KINDS[sq.kind]?.color || '#555'}88` }}>
              <div className="text-xs font-bold uppercase tracking-widest opacity-70">Τετράγωνο {pending.index} · {SQUARE_KINDS[sq.kind]?.label}</div>
              <div className="text-lg font-black">{SQUARE_KINDS[sq.kind]?.icon} {sq.title} · {nameOf(pending.pid)}</div>
              <p className="text-sm opacity-80">{fillAll(sq.tv, { name: nameOf(pending.pid) })}</p>
              <SquareAction />
              <div className="flex flex-wrap gap-2 pt-1">
                <Btn color="bg-emerald-600" onClick={next}>✅ Επόμενη σειρά</Btn>
                <Btn onClick={() => { up((c) => B.boardPass(c)); log(`⏭ PASS τετραγώνου: ${nameOf(pending.pid)}`); }}>⏭ PASS</Btn>
              </div>
            </div>
          )}
        </div>
      )}

      {on && (
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
          {BOARD_SQUARES.map((s, i) => {
            const here = b.order.filter((id) => (b.pos[id] || 0) === i);
            const k = SQUARE_KINDS[s.kind] || {};
            return (
              <div key={s.id} className="min-h-[64px] rounded-xl p-1 text-center" style={{ background: `${k.color}22`, border: `1px solid ${k.color}66` }} title={s.title}>
                <div className="text-[10px] opacity-60">{i}</div>
                <div className="text-lg leading-none">{k.icon}</div>
                <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">{here.map((id) => <PlayerAvatar key={id} name={nameOf(id)} color={colorOf(players, id)} size={18} />)}</div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
