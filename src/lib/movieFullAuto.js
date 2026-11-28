// 12.1.0 · Πλήρης αυτόματη πρόβα της Ταινίας: όλη η βραδιά τρέχει μόνη της ώστε να τη βλέπεις στην TV.
// ΑΣΦΑΛΕΙΑ: δουλεύει ΜΟΝΟ όταν ΟΛΕΣ οι παίκτριες είναι εικονικές (player.bot). Αν μπει αληθινή, σταματά (isFullAutoAllowed).
// Χρησιμοποιεί τις ίδιες συναρτήσεις του μηχανισμού με τα κουμπιά της διοργανώτριας.
// Οι εικονικές παίκτριες (rehearsalBots) κάνουν τις δικές τους κινήσεις· εδώ γίνονται μόνο όσα θα έκανε η διοργανώτρια.
// Καθαρή συνάρτηση: επιστρέφει { key, wait, label, run(cg) } ή null.

import * as E from './campaignEngine.js';
import * as BD from './movieBoardEngine.js';
import * as G from './movieGamesEngine.js';
import { TRIALS, MOVIE_CARDS } from '../data/modes/campaignContent.js';
import { WHEELS, wheelOf } from '../data/modes/movieGames.js';
import { squareOf } from '../data/modes/movieBoard.js';
import { VILLA_QUESTIONS, VILLA_DARES } from '../data/modes/villaContent.js';

export const isFullAutoAllowed = (players = []) => players.length >= 2 && players.every((p) => p.bot);

const SPEED = { normal: 1, fast: 0.3 };
const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length) % arr.length];

export function fullAutoStep({ cg, players = [], now = Date.now(), speed = 'normal', rnd = Math.random, stopped = false } = {}) {
  if (!cg || stopped || !isFullAutoAllowed(players)) return null;
  const k = SPEED[speed] || 1;
  const wait = (ms) => Math.round(ms * k);
  const status = cg.status || 'transition';
  const step = (key, ms, label, run) => ({ key, wait: wait(ms), label, run });

  if (status === 'finale') return null; // τέλος ταινίας
  if (status === 'standby') return step('standby', 8000, '▶ Επιστροφή από το διάλειμμα', (c) => E.setStandby(c, false, now));

  // 1) Ό,τι «παίζει» τώρα στην TV ολοκληρώνεται πρώτο.
  if (cg.trial && !cg.trial.done) {
    return step(`trial:${cg.trial.at}`, 12000, '⛓️ Αποτέλεσμα δοκιμασίας', (c) => {
      if (!c.trial || c.trial.done) return c;
      const t = TRIALS.find((x) => x.id === c.trial.id);
      const r = rnd(); const outcome = r < 0.6 ? 'win' : r < 0.9 ? 'lose' : 'pass';
      return E.logLine(E.resolveTrial(c, outcome), `${outcome === 'win' ? '✅' : outcome === 'lose' ? '❌' : '⏭'} ${t?.title || 'Δοκιμασία'} · πρόβα`, now);
    });
  }
  const w = cg.wheel;
  if (w && !w.done) {
    if (!w.confirmed && now - w.at < 4500 + wait(6000)) return null; // περιμένει την επιβεβαίωση της εικονικής
    return step(`wheel:${w.at}`, 4500 + 8000, '🎡 Ολοκλήρωση Τροχού', (c) => G.endWheel(c, now));
  }
  if (cg.game === 'tod' && cg.tod) {
    const t = cg.tod;
    if (!t.choice) return null; // διαλέγει η εικονική
    if (!t.cardTitle) return step(`tod-card:${t.at}`, 2500, '🎭 Κάρτα Θάρρους/Αλήθειας', (c) => G.todCard(c, pick(t.choice === 'dare' ? VILLA_DARES : VILLA_QUESTIONS, rnd)));
    if (!t.result) return step(`tod-res:${t.at}`, 9000, '🎭 Αποτέλεσμα', (c) => G.todResult(c, rnd() < 0.75 ? 'ok' : 'refuse', now));
    return step(`tod-end:${t.at}`, 4000, '■ Τέλος παιχνιδιού', (c) => G.gameEnd(c.chair?.active ? G.chairOut(c, now) : c));
  }
  if (cg.game === 'dond' && cg.dond) {
    const d = cg.dond;
    if (d.status === 'offer_wait') return step(`dond-offer:${d.round}`, 3000, '☎️ Προσφορά τραπεζίτη', (c) => G.dondOffer(c, pick(['+5 πόντοι', '+1 token', '+2 λεία', 'Ασυλία από τον επόμενο Τροχό'], rnd), now));
    if (d.status === 'final') return step(`dond-final:${d.at}`, 5000, '🎁 Άνοιγμα κουτιού', (c) => G.dondReveal(c, now));
    if (['revealed', 'deal'].includes(d.status) && !d.awardedAt) return step(`dond-award:${d.status}:${d.at}`, 6000, '🏆 Απονομή Deal', (c) => G.dondAward(c, rnd() < 0.5, now));
    if (['revealed', 'deal', 'won', 'lost'].includes(d.status)) return step(`dond-end:${d.status}:${d.at}`, 6000, '■ Τέλος Deal', (c) => G.gameEnd(c));
    return null; // ανοίγει κουτιά η εικονική
  }
  if (cg.game) return step(`game:${cg.game}`, 8000, '■ Τέλος παιχνιδιού', (c) => G.gameEnd(c));
  const v = cg.votes;
  if (v?.open) {
    const all = Object.values(v.ballots || {}).every((x) => x != null);
    return step(`vote:${v.at}:${all}`, all ? 3000 : 20000, '🗳️ Κλείσιμο ψηφοφορίας', (c) => E.closeVote(c));
  }
  if (cg.card && !cg.card.autoDone) {
    const card = MOVIE_CARDS.find((x) => x.id === cg.card.id);
    return step(`card:${cg.card.at}`, 7000, '🎴 Αποτέλεσμα κάρτας', (c) => {
      if (!c.card) return c;
      let out = { ...c, card: { ...c.card, autoDone: true } };
      if (card && c.card.pid && (card.win || card.lose)) {
        const ok = rnd() < 0.6;
        out = E.logLine(E.applyDelta(out, c.card.pid, ok ? card.win : card.lose, { penalty: !ok }), `${ok ? '✅' : '❌'} ${card.title} · πρόβα`);
      }
      return out;
    });
  }

  // 2) Υποχρεωτική κλήρωση + Τροχός.
  if (cg.mandatory?.pending) {
    if (!cg.mandatory.pid) return step(`mand-draw:${cg.mandatory.at}`, 5000, '🎲 Υποχρεωτική κλήρωση', (c) => G.mandatoryDraw(c, players, { rng: rnd, now }).cg);
    return step(`mand-spin:${cg.mandatory.drawnAt}`, 4000, '🎡 Υποχρεωτικός Τροχός', (c) => G.spinWheel(c, pick(WHEELS, rnd).id, c.mandatory.pid, { reason: 'mandatory', rng: rnd, now }).cg);
  }

  // 3) Μεταβάσεις πράξεων.
  if (status === 'transition') {
    const closed = (cg.conquered || {})[cg.act || 0];
    if (closed) {
      const last = (cg.act || 0) >= E.actsOf(cg).length - 1;
      return last ? step('to-finale', 6000, '👑 Φινάλε', (c) => E.toFinale(c, now)) : step(`next:${cg.act}`, 9000, '➡️ Επόμενη ήπειρος', (c) => E.goNext(c, now));
    }
    return step(`start:${cg.act}`, 9000, '▶ Έναρξη πράξης', (c) => { const o = E.startAct(c, players, now); return BD.boardStart(o, players, { rng: rnd, now }); });
  }

  // 4) Ενεργή πράξη: ταμπλό.
  const b = cg.board;
  if (!b?.on) return step(`board-start:${cg.act}`, 3000, '🎲 Έναρξη ταμπλό', (c) => BD.boardStart(c, players, { rng: rnd, now }));
  if (b.allDone) return step(`close:${cg.act}`, 6000, '■ Κλείσιμο πράξης', (c) => E.closeAct(c, players, now));
  const p = b.pending;
  if (!p) return null; // σειρά εικονικής να ρίξει
  if (!p.autoAt) {
    const sq = squareOf(p.index);
    const mark = (c) => ({ ...c, board: { ...c.board, pending: { ...c.board.pending, autoAt: now } } });
    const pid = p.pid;
    if (sq.kind === 'trial') {
      const list = TRIALS.filter((t) => t.id !== 'nightsock' && !t.needsBare);
      return step(`sq:${p.index}:${b.rolls}`, 3500, '⛓️ Δοκιμασία τετραγώνου', (c) => mark(E.logLine(E.startTrial({ ...c, card: null }, pick(list, rnd).id, pid, { now }), '⛓️ Δοκιμασία · πρόβα')));
    }
    if (sq.kind === 'card') {
      const list = MOVIE_CARDS.filter((x) => !['final', 'risk'].includes(x.vote));
      return step(`sq:${p.index}:${b.rolls}`, 3500, '🎴 Κάρτα τετραγώνου', (c) => {
        const card = pick(list, rnd);
        let out = { ...c, trial: null, card: { id: card.id, pid, pid2: '', prompt: '', at: now } };
        if (card.vote) out = E.openVote(out, { kind: card.vote, q: card.title, cardId: card.id, pid }, now);
        return mark(E.logLine(out, `🎴 ${card.title} · πρόβα`));
      });
    }
    if (sq.kind === 'wheel') return step(`sq:${p.index}:${b.rolls}`, 3500, '🎡 Τροχός τετραγώνου', (c) => mark(G.spinWheel(c, wheelOf(Number(sq.value) || 1).id, pid, { reason: 'board', rng: rnd, now }).cg));
    if (sq.kind === 'game') return step(`sq:${p.index}:${b.rolls}`, 3500, '🎭 Θάρρος ή Αλήθεια', (c) => mark(G.todStart(c, pid, now)));
    if (sq.kind === 'chair') return step(`sq:${p.index}:${b.rolls}`, 3500, '🪑 Καρέκλα', (c) => mark(G.todStart(G.chairIn(c, pid, now), pid, now)));
    return step(`sq:${p.index}:${b.rolls}`, 4000, '➡️ Επόμενη σειρά', (c) => BD.boardResolve(c));
  }
  return step(`resolve:${p.index}:${b.rolls}`, 4000, '➡️ Επόμενη σειρά', (c) => BD.boardResolve({ ...c, card: c.card?.autoDone ? null : c.card }));
}
