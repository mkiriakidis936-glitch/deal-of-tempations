import React, { useEffect, useRef, useState } from 'react';
import GameCard from '@/components/shared/GameCard';
import LoungeMobile from '@/components/modes/LoungeMobile';
import { modeMeta } from '@/data/modes/modeRegistry';
import { EXTENDED_CHAOS_MARKET_CARDS, GATE_TOKENS, ROUTES } from '@/data/modes/extendedContent';
import { EXIT_CODE, syncExitCode } from '@/data/modes/lockdownContent';
import { consentPending } from '@/lib/consent';
import { ConsentMobile } from '@/components/modes/ConsentCheckIn';
import { MORNING_CLUES } from '@/data/modes/extendedContent';
import ModeArt from '@/components/modes/ModeArt';
import { fmt, sfx, timerLeft, useTick, setGameStopActive } from '@/lib/modeKit';
import { enablePlayerPush } from '@/lib/push';
import GameDurationClock from '@/components/shared/GameDurationClock';
import { Header, Button, List, Row, SafetyBar } from '@/design/ui';

// Οθόνη κινητού (/play) για τα ψηφιακά modes.
export default function ModeMobile({ state, me, updateState, onChangePlayer, sessionCode }) {
  const mg = state.mg || {};
  syncExitCode(mg);
  const meta = modeMeta(state.mode);
  const players = state.players || [];
  useTick(true, 1000);

  const mission = (mg.missions || {})[me.id];
  const missionKey = mission ? `${mission.sentAt}` : null;
  const seen = useRef(null);
  const [alert, setAlert] = useState(false);
  const [pushStatus, setPushStatus] = useState('');
  const [mobileCode, setMobileCode] = useState('');

  useEffect(() => { setGameStopActive(!!(mg.stop || state.stopActive)); }, [mg.stop, state.stopActive]);

  useEffect(() => {
    if (!mission || mission.status !== 'active' || seen.current === missionKey) return;
    seen.current = missionKey;
    setAlert(true);
    sfx.buzz(400);
  }, [missionKey]);

  async function askNotif() {
    setPushStatus('Σύνδεση ειδοποιήσεων…');
    try {
      await enablePlayerPush(sessionCode, me.id);
      setPushStatus('Οι ειδοποιήσεις αποστολών είναι ενεργές.');
    } catch (error) {
      setPushStatus(error?.message || 'Δεν ήταν δυνατή η ενεργοποίηση ειδοποιήσεων.');
    }
  }

  function sendAction(type, payload = {}) {
    if (mg.stop || state.stopActive) return;
    updateState({ mg: { playerAction: { playerId: me.id, type, at: Date.now(), ...payload } } });
  }

  function panic() {
    if (mg.stop || state.stopActive) return;
    const stopAt = Date.now();
    updateState({
      mg: { stop: true, stopAt, stopBy: me.id },
      gamePausedAt: state.gamePausedAt || stopAt,
    });
  }

  const ld = mg.ld || {};
  const bb = mg.bb || {};
  const tokens = (mg.tokens || {})[me.id] || 0;
  const hand = (mg.chaosCards || {})[me.id] || [];
  const act = meta.acts[Math.min(mg.actIndex || 0, meta.acts.length - 1)];
  const isLockdown = act === 'lockdown';
  const left = timerLeft(mg.timer);
  // Στο Heist η κατάταξη είναι με τη λεία· στα άλλα modes με πόντους + tokens.
  const scoreOf = (id) => (act === 'lounge'
    ? (mg.lounge?.stats?.[id]?.loot || 0)
    : ((mg.scores || {})[id] || 0) + ((mg.tokens || {})[id] || 0));
  const scoreLabel = (id) => (act === 'lounge' ? `${Math.round(scoreOf(id)).toLocaleString('el-GR')}€` : scoreOf(id));
  const ranking = [...players].sort((a, b) => scoreOf(b.id) - scoreOf(a.id));

  // Consent check-in: πριν ξεκινήσει το παιχνίδι κάθε παίκτρια δηλώνει τα όριά της.
  if (consentPending(mg)) {
    return (
      <div className="ui-page" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 11rem)' }}>
        <div className="ui-stack">
          <Header eyebrow={me.name} title={`${meta.icon} ${meta.name}`} gold />
          <ConsentMobile mg={mg} me={me} updateState={updateState} />
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 11rem)' }}>
      <div className="ui-stack">
        <Header eyebrow={me.name} title={`${meta.icon} ${meta.name}`} gold />
        <ModeArt state={state} alt={meta.name} className="aspect-[16/9] rounded-2xl" />
        <div className="flex justify-center"><GameDurationClock state={state} inline /></div>

        {mg.timer && (
          <div className={`ui-timer text-center text-5xl ${left < 60 ? 'ui-timer--danger' : ''}`}>{fmt(left)}</div>
        )}

        {mg.stop && (
          <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ background: 'rgba(120,0,20,.96)' }}>
            <div className="font-display text-5xl text-white">⏸ ΣΤΟΠ</div>
            <div className="max-w-sm text-base text-white/95">Όλα σταμάτησαν. Λύστε αμέσως κάθε δέσιμο και ελέγξτε ότι όλες είναι καλά. Η συνέχεια γίνεται από το tablet.</div>
          </div>
        )}

        {state.mg?.vipUnrated?.active && state.mg.vipUnrated.currentCard && (
          <div className="ui-card ui-card--gold space-y-2">
            <div className="text-xs tracking-widest text-amber-300">VIP UNRATED · ΚΑΡΤΑ {(state.mg.vipUnrated.cardIndex||0)+1}/{state.mg.vipUnrated.cardCount||12}</div>
            <div className="text-[19px] font-semibold">{state.mg.vipUnrated.currentCard[0]}</div>
            <p className="text-sm">{state.mg.vipUnrated.currentCard[1]}</p>
            <div className="text-xs opacity-70">Η επιλογή και η ολοκλήρωση ελέγχονται από το tablet. Μπορείς πάντα να ζητήσεις PASS ή STOP.</div>
          </div>
        )}

        {act === 'lounge' && <LoungeMobile state={state} me={me} sendAction={sendAction} updateState={updateState} />}

        {mission && mission.status === 'active' && (
          <GameCard
            variant="compact"
            kicker="Μυστική αποστολή"
            corner="Μόνο για σένα"
            icon="🕵️"
            image={mission.image}
            title={mission.title}
            text={mission.text}
            footLeft={`Λήγει σε ${fmt((mission.expiresAt - Date.now()) / 1000)}`}
            footRight={mission.reward ? `+${mission.reward} 🪙` : null}
          />
        )}

        {isLockdown && ld.stage === 'exit' && (
          <div className="ui-card ui-card--danger space-y-2">
            <div className="text-[17px] font-semibold text-center">🔐 ΚΩΔΙΚΟΣ ΑΠΟΔΡΑΣΗΣ</div>
            <input inputMode="numeric" maxLength={4} value={mobileCode} onChange={(e) => setMobileCode(e.target.value.replace(/\D/g, '').slice(0, 4))} className="ui-input ui-input--code" placeholder="••••" />
            <button disabled={mobileCode.length !== 4 || !!mg.playerAction} onClick={() => { sendAction('lockdown_exit_code', { code: mobileCode }); setMobileCode(''); }} className="ui-btn ui-btn--danger ui-btn--block">ΥΠΟΒΟΛΗ ΚΩΔΙΚΟΥ</button>
          </div>
        )}

        {isLockdown && (
          <div className="ui-card ui-card--danger text-center space-y-2">
            <div className="text-xs opacity-70">Level: {{ init: 'Εκκίνηση', l1: '1 · Hostage', l2: '2 · Sensory Cipher', l3: '3 · Sabotage', exit: 'Exit Code', won: 'ΑΠΟΔΡΑΣΗ!', lost: 'ΑΠΟΤΥΧΙΑ' }[ld.stage || 'init']}</div>
            <div className="flex justify-center gap-2">
              {EXIT_CODE.split('').map((d, i) => (
                <div key={i} className="w-11 h-14 flex items-center justify-center font-display text-3xl rounded" style={{ border: `2px solid ${(ld.revealed || [])[i] ? '#E8C26B' : '#FF453A'}`, color: '#E8C26B' }}>{(ld.revealed || [])[i] ? d : '🔒'}</div>
              ))}
            </div>
          </div>
        )}

        {act === 'board' && (
          <div className="ui-card ui-card--gold space-y-2">
            <div className="text-[17px] font-semibold">🎮 ΧΕΙΡΙΣΤΗΡΙΟ ΤΑΜΠΛΟ</div>
            {!mg.card && !mg.branch && players[(mg.turn || 0) % Math.max(1, players.length)]?.id === me.id && (
              <button disabled={!!mg.playerAction} onClick={() => sendAction('board_roll')} className="ui-btn ui-btn--primary ui-btn--block">🎲 ΡΙΞΕ ΤΟ ΖΑΡΙ</button>
            )}
            {mg.branch === me.id && <div className="grid grid-cols-2 gap-2">
              <button disabled={!!mg.playerAction} onClick={() => sendAction('board_route', { route: 'glam' })} className="ui-btn ui-btn--primary">💅 GLAM ROUTE</button>
              <button disabled={!!mg.playerAction} onClick={() => sendAction('board_route', { route: 'chaos' })} className="ui-btn ui-btn--primary">⚡ CHAOS ROUTE</button>
            </div>}
            {mg.card?.playerId === me.id && <div className="grid grid-cols-2 gap-2">
              <button disabled={!!mg.playerAction} onClick={() => sendAction('board_complete')} className="ui-btn ui-btn--success">ΟΛΟΚΛΗΡΩΣΑ</button>
              <button disabled={!!mg.playerAction} onClick={() => sendAction('board_pass')} className="ui-btn">PASS</button>
            </div>}
            <div className="text-xs opacity-70">Οι επιλογές σου μεταφέρονται στην κεντρική οθόνη και ενημερώνουν την εξέλιξη του γύρου.</div>
          </div>
        )}

        {act === 'midnight' && players[(mg.seat || 0) % Math.max(1, players.length)]?.id === me.id && (
          <div className="ui-card ui-card--gold space-y-2">
            <div className="text-[17px] font-semibold">🌙 MIDNIGHT · Η ΣΕΙΡΑ ΣΟΥ</div>
            <button disabled={!!mg.playerAction} onClick={() => sendAction('midnight_pass')} className="ui-btn ui-btn--primary ui-btn--block">PASS / ΕΠΟΜΕΝΗ ΣΕΙΡΑ</button>
          </div>
        )}

        {act === 'morning' && (
          <div className="ui-card ui-card--gold space-y-2">
            <div className="text-[17px] font-semibold">☀️ MORNING ESCAPE · ΚΙΝΗΤΟ</div>
            <div className="grid grid-cols-2 gap-2">
              {MORNING_CLUES.map((clue, index) => (
                <button key={clue.id} disabled={!!mg.playerAction || (mg.morningFound || []).includes(index)} onClick={() => sendAction('morning_clue', { index })} className="ui-btn">
                  {(mg.morningFound || []).includes(index) ? '✓ ' : ''}Ψήγμα {index + 1}
                </button>
              ))}
            </div>
            <input inputMode="numeric" maxLength={4} value={mobileCode} onChange={(e) => setMobileCode(e.target.value.replace(/\D/g, '').slice(0, 4))} className="ui-input ui-input--code" placeholder="Κωδικός 4 ψηφίων" />
            <button disabled={mobileCode.length !== 4 || !!mg.playerAction || mg.vaultUnlocked} onClick={() => { sendAction('morning_code', { code: mobileCode }); setMobileCode(''); }} className="ui-btn ui-btn--primary ui-btn--block">ΥΠΟΒΟΛΗ ΚΩΔΙΚΟΥ</button>
          </div>
        )}

        {act === 'beach' && bb.phase === 'finale' && bb.finalChallenge?.card && (
          <div className="ui-card ui-card--gold space-y-2">
            <GameCard variant="compact" kicker="Τελικό ομαδικό challenge" icon="🏖️" image={bb.finalChallenge.card.image} accent="#E8C26B" title={bb.finalChallenge.card.title} text={bb.finalChallenge.card.text} />
            {bb.finalChallenge.responses?.[me.id] ? <div className="text-center text-sm">Η επιλογή σου καταχωρήθηκε: {bb.finalChallenge.responses[me.id] === 'done' ? 'Ολοκλήρωσα' : 'PASS'}</div> : (
              <div className="grid grid-cols-2 gap-2">
                <button disabled={!!mg.playerAction} onClick={() => sendAction('beach_finale_response', { value: 'done' })} className="ui-btn ui-btn--success">ΟΛΟΚΛΗΡΩΣΑ</button>
                <button disabled={!!mg.playerAction} onClick={() => sendAction('beach_finale_response', { value: 'pass' })} className="ui-btn">PASS</button>
              </div>
            )}
          </div>
        )}

        {act === 'beach' && bb.phase === 'checkin' && (
          <div className="ui-card ui-card--gold space-y-2">
            <div className="text-[17px] font-semibold">🩴 BEACH BAR · CHECK-IN</div>
            <div className="text-sm">{bb.checkin?.[me.id] ? 'Το check-in σου ολοκληρώθηκε.' : 'Επιβεβαίωσε ότι είσαι έτοιμη.'}</div>
            <button disabled={!!mg.playerAction || !!bb.checkin?.[me.id]} onClick={() => sendAction('beach_checkin')} className="ui-btn ui-btn--primary ui-btn--block">ΕΠΙΒΕΒΑΙΩΣΗ CHECK-IN</button>
          </div>
        )}

        {(act === 'board' || act === 'midnight' || act === 'morning') && (
          <div className="ui-card space-y-2">
            <div className="flex justify-between"><b>🪙 Tokens</b><b className="font-display text-xl">{tokens}</b></div>
            <div className="text-xs opacity-70">Πύλη: {Math.min(tokens, GATE_TOKENS)}/{GATE_TOKENS}{(mg.immune || []).includes(me.id) ? ' · 🛡️ έχεις ασυλία' : ''}</div>
            {hand.length > 0 && (
              <div className="text-xs">🃏 Chaos Cards (κρυφές): {hand.map((id) => EXTENDED_CHAOS_MARKET_CARDS.find((x) => x.id === id)?.name).join(', ')} — πες στη διοργανώτρια πότε θες να παίξεις.</div>
            )}
            {mg.card && mg.card.playerId === me.id && <GameCard variant="compact" kicker={ROUTES[mg.card.route]?.name || 'Κάρτα'} icon={ROUTES[mg.card.route]?.icon} image={mg.card.image} accent={ROUTES[mg.card.route]?.color} title={mg.card.title} text={mg.card.text} footLeft={mg.card.secs ? `⏱ ${mg.card.secs}″` : ''} />}
            {mg.branch === me.id && <div className="rounded bg-yellow-900/60 p-2 text-sm">🔀 Σε διακλάδωση! Διάλεξε Glam ή Chaos Route στο tablet.</div>}
            {(mg.pos || {})[me.id] != null && <div className="text-xs opacity-60">Θέση ταμπλό: #{(mg.pos || {})[me.id] || 0}</div>}
          </div>
        )}

        {act === 'beach' && (
          <div className="ui-card space-y-2">
            <div className="text-sm">🩴 Σαγιονάρες: {(bb.flops || {})[me.id] === false ? 'έχασες! 😱' : 'ΟΚ'} · 🥃 {(bb.drinks || {})[me.id] || 0}</div>
            {bb.freeze && <div className="ui-card ui-card--gold text-center space-y-2">📯 {bb.freeze.cmd}<button disabled={!!mg.playerAction || !!bb.loser} onClick={() => sendAction('beach_freeze_loser')} className="ui-btn ui-btn--danger ui-btn--block">ΕΙΜΑΙ Η ΤΕΛΕΥΤΑΙΑ</button></div>}
            {bb.loser === me.id && !bb.wheel && <button disabled={!!mg.playerAction} onClick={() => sendAction('beach_wheel_spin')} className="ui-btn ui-btn--danger ui-btn--block">🎡 ΓΥΡΝΑ ΤΟΝ ΤΡΟΧΟ</button>}
            {bb.wheel && bb.wheel.pid === me.id && <div className="space-y-2"><GameCard variant="compact" kicker="Τροχός ποινών" icon="🎡" image={bb.wheel.card.image} accent="#F0B85A" title={bb.wheel.card.title} text={bb.wheel.card.text} footLeft={bb.wheel.card.secs ? `⏱ ${bb.wheel.card.secs}″` : ''} /><div className="grid grid-cols-2 gap-2"><button disabled={!!mg.playerAction} onClick={() => sendAction('beach_wheel_done')} className="ui-btn ui-btn--success">ΕΓΙΝΕ</button><button disabled={!!mg.playerAction} onClick={() => sendAction('beach_wheel_again')} className="ui-btn">ΝΕΑ ΠΕΡΙΣΤΡΟΦΗ</button></div></div>}
            {bb.truth && bb.truth.who === me.id && <div className="ui-card ui-card--gold text-sm space-y-2"><b>🥃 SHOT & TRUTH</b><div>{bb.truth.question || 'Η ερώτηση εμφανίζεται στην κεντρική οθόνη.'}</div>{bb.truth.status === 'decide' && <div className="grid grid-cols-2 gap-2"><button disabled={!!mg.playerAction} onClick={() => sendAction('beach_truth_response', { value: 'truth' })} className="ui-btn ui-btn--success">TRUTH</button><button disabled={!!mg.playerAction} onClick={() => sendAction('beach_truth_response', { value: 'mocktail' })} className="ui-btn ui-btn--primary">🥃 DRINK</button></div>}</div>}
            {bb.queen === me.id && <div className="text-center font-display text-2xl" style={{ color: '#E8C26B' }}>👑 Beach Queen!</div>}
          </div>
        )}

        <div className="ui-section-title">Βαθμολογία</div>
        <List>
          {ranking.map((p, i) => (
            <Row key={p.id} left={<span className="w-5 text-center ui-subtitle">{i + 1}</span>} title={p.id === me.id ? <b>{p.name} (εσύ)</b> : p.name} value={scoreLabel(p.id)} />
          ))}
        </List>

        <List>
          <Row onClick={askNotif} left="🔔" title="Ενεργοποίηση ειδοποιήσεων" value="›" />
          <Row onClick={onChangePlayer} left="🔄" title="Αλλαγή παίκτριας" value="›" />
        </List>
        {pushStatus && <div className="text-center text-xs opacity-80">{pushStatus}</div>}
      </div>

      <SafetyBar safeWord={state.safetyProfile?.safeWord} onStop={panic} stopped={!!(mg.stop || state.stopActive)} />

      {alert && mission && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,.94)' }}>
          <div className="ui-card ui-card--gold max-w-sm w-full text-center space-y-3">
            <div className="text-4xl">🕵️</div>
            <div className="ui-title ui-title--gold" style={{ fontSize: 24 }}>Μυστική αποστολή</div>
            <div className="text-[19px] font-semibold">{mission.title}</div>
            <p className="text-sm">{mission.text}</p>
            <Button variant="primary" block onClick={() => setAlert(false)}>Το κατάλαβα — κρύψε την οθόνη</Button>
          </div>
        </div>
      )}
    </div>
  );
}
