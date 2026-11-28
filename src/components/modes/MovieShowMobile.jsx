import React, { useState } from 'react';
import { BOARD_SQUARES, BOARD_TEXT, SQUARE_KINDS, squareOf } from '@/data/modes/movieBoard';
import { turnPid } from '@/lib/movieBoardEngine';
import {
  wheelItem, WHEEL_LABEL, WHEEL_MOBILE, fillAll, CHAIR_TEXT, TOD_TEXT, DOND_TEXT, GUESS_TEXT, MANDATORY_STAGES,
  WARRANT_TEXT, WANTED_TEXT, MOST_WANTED_TEXT, ARREST_WHEEL_TEXT,
} from '@/data/modes/movieGames';
import { continentOf } from '@/data/modes/campaignContent';

// Η ΤΑΙΝΙΑ · κινητό: προσωπικές διαταγές του show (Τροχός, παιχνίδια, κλήρωση, εντάλματα). Χωρίς animations.
const Box = ({ kicker, children, tone = '#3A0A12' }) => (
  <section className="mvg-glass mvg-3d p-4" style={{ background: `linear-gradient(160deg, ${tone}ee, #0b0b10cc)` }}>
    {kicker && <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.18em] text-[#FF8A9C]">{kicker}</div>}
    {children}
  </section>
);
const big = 'mvg-btn h-14 rounded-2xl text-base font-black';

export default function MovieShowMobile({ cg, me, nameOf, sendAction }) {
  const now = Date.now();
  const out = [];
  const name = nameOf(me.id);
  const idx = Object.keys(cg.conquered || {}).map(Number).sort((a, b) => b - a)[0];
  const continent = continentOf((cg.conquered || {})[idx]?.continent || 'classic').name;
  const f = (t, extra = {}) => fillAll(t, { name, continent, ...extra });
  const [rolledAt, setRolledAt] = useState(0);

  // 🎲 Ταμπλό & Ζάρι: η σειρά μου, η θέση μου, το τετράγωνο όπου έπεσα.
  const bd = cg.board;
  if (bd?.on && (cg.status || 'active') === 'active') {
    const turn = turnPid(cg);
    const mine = turn === me.id;
    const pos = bd.pos?.[me.id] || 0;
    const myRoll = bd.roll && bd.roll.pid === me.id && now - bd.roll.at < 30000 ? bd.roll : null;
    const sq = myRoll ? squareOf(myRoll.to) : null;
    const canRoll = mine && !bd.pending && !bd.allDone && now - rolledAt > 5000; // 5″ κλείδωμα: όχι διπλό πάτημα
    out.push(
      <Box key="board" kicker={`🎲 ΤΑΜΠΛΟ · ΤΕΤΡΑΓΩΝΟ ${pos} / ${BOARD_SQUARES.length - 1}`} tone={mine && !bd.pending ? '#2A2112' : '#14141C'}>
        {bd.allDone ? <p className="font-semibold">{BOARD_TEXT.allDone}</p> : mine && !bd.pending ? (
          <>
            <div className="mb-3 text-xl font-black text-[#F7E3A8]">{BOARD_TEXT.yourTurn}</div>
            <button type="button" disabled={!canRoll} onClick={() => { setRolledAt(Date.now()); sendAction('cg_roll', {}); }}
              className="mvg-btn flex h-24 w-full items-center justify-center gap-3 rounded-3xl text-2xl font-black text-black disabled:opacity-50"
              style={{ background: 'linear-gradient(180deg,#FFF1C7,#E8C26B 55%,#C99B2E)' }}>
              <span className="text-5xl" aria-hidden="true">🎲</span> ΡΙΞΕ
            </button>
          </>
        ) : (
          <p className="font-semibold text-white/80">{turn ? BOARD_TEXT.waitTurn(nameOf(turn)) : '—'}</p>
        )}
        {myRoll && sq && (
          <div className="mt-3 rounded-2xl bg-black/40 p-3">
            <div className="text-xs font-bold uppercase tracking-widest text-[#E8C26B]">Έφερες {myRoll.value} · {SQUARE_KINDS[sq.kind]?.icon} {sq.title}</div>
            <div className="font-semibold">{f(sq.mobile)}</div>
          </div>
        )}
      </Box>,
    );
  }

  const wl = cg.wheel;
  if (wl && !wl.done && wl.pid === me.id) {
    const item = wheelItem(wl.id, wl.itemId);
    const spinning = now - wl.at < 4500;
    out.push(
      <Box key="wheel" kicker={`🎡 ${WHEEL_LABEL[wl.id]}`}>
        {spinning ? <div className="text-lg font-bold">{wl.reason === 'mandatory' ? f(MANDATORY_STAGES.spin.mobile) : wl.reason === 'arrest' ? ARREST_WHEEL_TEXT.mobile : 'Ο Τροχός γυρίζει για σένα — κοίτα την TV.'}</div> : item ? (
          <>
            <div className="text-2xl font-black text-[#F7E3A8]">{item.title}</div>
            <p className="mt-1 text-white/85">{f(item.mobile)}</p>
            <p className="mt-1 text-sm text-white/60">{wl.reason === 'mandatory' ? MANDATORY_STAGES.spin.mobileResult(item.title) : WHEEL_MOBILE.result(item)}</p>
            {wl.until && <div className="mt-2 text-5xl font-black tabular-nums text-[#E8C26B]">{Math.max(0, Math.ceil((wl.until - now) / 1000))}″</div>}
            {wl.confirmed ? <p className="mt-2 text-sm text-[#7BE495]">✓ {WHEEL_MOBILE.active}</p> : <button type="button" className={`${big} mt-3 w-full bg-[#30D158] text-black`} onClick={() => sendAction('cg_wheel_ok', {})}>✓ ΕΠΙΒΕΒΑΙΩΝΩ ΤΗΝ ΠΟΙΝΗ</button>}
          </>
        ) : <div className="font-semibold">PASS — καμία ποινή εντός των ορίων σου.</div>}
      </Box>,
    );
  }

  const m = cg.mandatory;
  if (m?.pending) {
    const mine = m.pid === me.id;
    out.push(<Box key="mand" kicker="⚠️ ΥΠΟΧΡΕΩΤΙΚΗ ΚΛΗΡΩΣΗ"><p className="font-semibold">{!m.pid ? f(MANDATORY_STAGES.closing.mobile) : mine ? f(MANDATORY_STAGES.drawn.mobileMine) : fillAll(MANDATORY_STAGES.drawn.mobileOthers, { name: nameOf(m.pid), continent })}</p></Box>);
  } else if (wl?.reason === 'mandatory' && wl.done && now - (wl.doneAt || 0) < 15000) {
    out.push(<Box key="mdone" kicker="✓ ΠΟΙΝΗ ΚΑΤΑΧΩΡΗΘΗΚΕ" tone="#0F2A1A"><p>{MANDATORY_STAGES.done.mobile}</p></Box>);
  }

  const an = cg.announce;
  if (an && now - an.at < 60000 && an.kind !== 'arrestwheel') {
    const mine = an.pid === me.id;
    const T = an.kind === 'warrant' ? WARRANT_TEXT : an.kind === 'wanted' ? WANTED_TEXT : MOST_WANTED_TEXT;
    out.push(<Box key="ann" kicker={an.kind === 'mostwanted' ? '🎯 ΚΑΤΑΖΗΤΟΥΜΕΝΗ' : an.kind === 'wanted' ? '⭐ WANTED LEVEL' : '🚨 ΕΝΤΑΛΜΑ'}><p className="font-semibold">{fillAll(mine ? T.mobileMine : T.mobileOthers, { name: nameOf(an.pid), continent, level: an.level ?? '' })}</p></Box>);
  }

  if (cg.chair?.pid === me.id && (cg.chair.active || now - (cg.chair.outAt || 0) < 20000)) {
    out.push(<Box key="chair" kicker="🪑 ΚΑΡΕΚΛΑ ΑΝΑΚΡΙΣΗΣ"><p className="font-semibold">{!cg.chair.active ? CHAIR_TEXT.mobileExit : now - cg.chair.at < 15000 ? CHAIR_TEXT.mobileEnter : CHAIR_TEXT.mobileLocked}</p></Box>);
  }

  if (cg.game === 'tod' && cg.tod?.pid === me.id) {
    const t = cg.tod;
    out.push(
      <Box key="tod" kicker="🎭 1ο ΠΑΙΧΝΙΔΙ · ΘΑΡΡΟΣ Ή ΑΛΗΘΕΙΑ" tone="#1A1033">
        {!t.choice ? (
          <>
            <p className="mb-3 font-semibold">{TOD_TEXT.mobileChoose}</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={`${big} bg-[#64D2FF] text-black`} onClick={() => sendAction('cg_tod', { value: 'truth' })}>ΑΛΗΘΕΙΑ</button>
              <button type="button" className={`${big} bg-[#FF3B5C]`} onClick={() => sendAction('cg_tod', { value: 'dare' })}>ΘΑΡΡΟΣ</button>
            </div>
          </>
        ) : (
          <>
            <p className="font-semibold">{t.result === 'wrong' ? TOD_TEXT.mobileWrong : t.result === 'refuse' ? TOD_TEXT.mobileRefuse : t.choice === 'truth' ? TOD_TEXT.mobileTruth : TOD_TEXT.mobileDare}</p>
            {t.cardTitle && <div className="mt-2 rounded-2xl bg-black/40 p-3"><div className="text-xs font-bold uppercase tracking-widest text-[#E8C26B]">ΔΙΑΤΑΓΗ · {t.cardTitle}</div><div className="font-semibold">{t.cardText}</div></div>}
          </>
        )}
      </Box>,
    );
  }

  if (cg.game === 'guess' && cg.guess?.pid === me.id && !cg.guess.result) {
    out.push(<Box key="guess" kicker="🙈 3ο ΠΑΙΧΝΙΔΙ · ΜΑΝΤΕΨΕ ΤΙ ΕΙΝΑΙ"><p className="font-semibold">{GUESS_TEXT.mobile}</p></Box>);
  }

  const d = cg.game === 'dond' ? cg.dond : null;
  if (d) {
    const mine = d.pid === me.id;
    const won = d.status === 'won';
    let text = mine ? (d.status === 'pick' ? DOND_TEXT.mobilePick : d.status === 'open' ? DOND_TEXT.mobileTurn : d.status === 'offer' ? DOND_TEXT.mobileOffer : d.status === 'deal' ? DOND_TEXT.mobileDeal : '') : '';
    if (mine && d.decision === 'nodeal' && d.status === 'open' && now - (d.decidedAt || 0) < 15000) text = DOND_TEXT.mobileNoDeal;
    if (mine && wl && !wl.done && wl.reason === 'dond' && wl.pid === me.id) text = now - wl.at < 4500 ? DOND_TEXT.mobileTrap : DOND_TEXT.mobileTrapActive;
    if (won) text = fillAll(DOND_TEXT.mobileWin, { name: nameOf(d.prizePid) });
    if (d.status === 'lost') text = DOND_TEXT.mobileEnd;
    if (text || mine) {
      out.push(
        <Box key="dond" kicker="💼 4ο ΠΑΙΧΝΙΔΙ · DEAL OR NO DEAL" tone="#2A2112">
          {text && <p className="mb-2 font-semibold">{text}</p>}
          {mine && ['pick', 'open'].includes(d.status) && (
            <div className="grid grid-cols-4 gap-2">
              {d.boxes.map((b) => (
                <button key={b.no} type="button" disabled={b.open || (d.status === 'open' && b.no === d.myBox)} onClick={() => sendAction('cg_dond_box', { value: b.no })}
                  className="mvg-btn h-14 rounded-xl text-sm font-black disabled:opacity-30" style={{ background: b.no === d.myBox ? '#E8C26B' : 'linear-gradient(180deg,#B8892B,#6E4E12)', color: b.no === d.myBox ? '#000' : '#fff' }}>
                  {b.open ? '✕' : `💼${b.no}`}
                </button>
              ))}
            </div>
          )}
          {mine && d.status === 'offer' && (
            <>
              <div className="mb-2 rounded-2xl bg-black/40 p-3 text-lg font-black text-[#F7E3A8]">☎️ {d.offer}</div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={`${big} bg-[#30D158] text-black`} onClick={() => sendAction('cg_dond', { value: 'deal' })}>DEAL</button>
                <button type="button" className={`${big} bg-[#FF3B5C]`} onClick={() => sendAction('cg_dond', { value: 'nodeal' })}>NO DEAL</button>
              </div>
              <p className="mt-2 text-xs text-white/60">{DOND_TEXT.mobileDecide}</p>
            </>
          )}
        </Box>,
      );
    }
  }
  return out.length ? <div className="space-y-3">{out}</div> : null;
}
