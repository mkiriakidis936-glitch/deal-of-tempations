import React, { useState } from 'react';
import { Panel, Btn, RestraintNote } from '@/components/modes/ModeShell';
import MissionPanel from '@/components/modes/MissionPanel';
import {
  GATE_TOKENS, EXT_END, EXT_PORTAL, EXT_ZONES, squareType, zoneOf, ROUTES,
  EXTENDED_GLAM_CARDS, EXTENDED_CHAOS_CARDS, EXTENDED_CHAOS_MARKET_CARDS, SHOP, EXTENDED_SECRET_MISSIONS,
} from '@/data/modes/extendedContent';
import { pick, sfx, useLocalCountdown } from '@/lib/modeKit';

const ICON = { start: '🚩', card: '🎴', rest: '🛋️', branch: '🔀', portal: '🚪', finish: '👑' };

// Act 1 — The Glam & Chaos Board
export default function ActBoard({ ctx, onDone }) {
  const { players, mg, setMg, log, nameOf, stopped } = ctx;
  const pos = mg.pos || {};
  const routes = mg.routes || {};
  const tokens = mg.tokens || {};
  const finished = mg.finished || [];
  const chaosCards = mg.chaosCards || {};
  const turn = players.length ? (mg.turn || 0) % players.length : 0;
  const cur = players[turn];
  const allDone = players.length > 0 && finished.length >= players.length;
  const gateOpen = players.filter((p) => (tokens[p.id] || 0) >= GATE_TOKENS).length;

  function nextTurn(fromIdx, fin, skipList) {
    const skip = [...skipList];
    const sockConfiscation = { ...(mg.sockConfiscation || {}) };
    const silenceCurses = { ...(mg.silenceCurses || {}) };
    const justPlayed = players[fromIdx]?.id;
    if (justPlayed && sockConfiscation[justPlayed] > 0) sockConfiscation[justPlayed] -= 1;
    if (justPlayed && silenceCurses[justPlayed] > 0) silenceCurses[justPlayed] -= 1;
    let idx = fromIdx;
    for (let n = 0; n < players.length * 2; n += 1) {
      idx = (idx + 1) % players.length;
      const p = players[idx];
      if (fin.includes(p.id)) continue;
      const si = skip.indexOf(p.id);
      if (si >= 0) { skip.splice(si, 1); continue; }
      return { turn: idx, skip, sockConfiscation, silenceCurses };
    }
    return { turn: fromIdx, skip, sockConfiscation, silenceCurses };
  }

  function draw(player, forcedRoute) {
    const r = routes[player.id];
    const route = forcedRoute || (r && r.left > 0 ? r.route : 'glam');
    const deck = route === 'chaos' ? EXTENDED_CHAOS_CARDS : EXTENDED_GLAM_CARDS;
    let used = mg.usedCards || [];
    let pool = deck.filter((c) => !used.includes(c.id));
    if (!pool.length) { used = used.filter((id) => !deck.some((c) => c.id === id)); pool = deck; }
    const drawn = pick(pool);
    const doubled = !!(mg.doublePenaltyNext || {})[player.id] && !!drawn.secs;
    const card = doubled ? { ...drawn, secs: drawn.secs * 2 } : drawn;
    const patch = { card: { ...card, route, playerId: player.id, at: Date.now() }, usedCards: [...used, card.id] };
    if (doubled) { const nextDouble = { ...(mg.doublePenaltyNext || {}) }; delete nextDouble[player.id]; patch.doublePenaltyNext = nextDouble; }
    if (forcedRoute) patch.routes = { ...routes, [player.id]: { route: forcedRoute, left: ROUTES[forcedRoute].steps - 1 } };
    else if (r && r.left > 0) patch.routes = { ...routes, [player.id]: { ...r, left: r.left - 1 } };
    if (route === 'chaos') patch.chaosUsed = { ...(mg.chaosUsed || {}), [player.id]: true };
    return patch;
  }

  function finishFor(player, extra = {}) {
    const fin = [...finished, player.id];
    const pts = (finished.length === 0 ? 15 : 10) * ((mg.chaosUsed || {})[player.id] ? 2 : 1);
    const scores = { ...(mg.scores || {}), [player.id]: ((mg.scores || {})[player.id] || 0) + pts };
    log(`👑 ${player.name} τερμάτισε! +${pts} πόντοι${(mg.chaosUsed || {})[player.id] ? ' (διπλοί — Chaos Route)' : ''}`);
    return { finished: fin, scores, ...nextTurn(turn, fin, mg.skip || []), ...extra };
  }

  function roll() {
    if (!cur || mg.card || mg.branch || allDone || stopped) return;
    const d = 1 + Math.floor(Math.random() * 6);
    const from = pos[cur.id] || 0;
    let np = from + d;
    let gated = false;
    if (np > EXT_PORTAL && (tokens[cur.id] || 0) < GATE_TOKENS) { np = EXT_PORTAL; gated = true; }
    np = Math.min(np, EXT_END);
    const patch = { pos: { ...pos, [cur.id]: np }, lastRoll: { id: cur.id, d, gated, at: Date.now() } };
    const t = squareType(np);
    sfx.click();
    if (t === 'branch') patch.branch = cur.id;
    else if (t === 'card' || t === 'portal') Object.assign(patch, draw(cur));
    else if (t === 'finish') Object.assign(patch, finishFor(cur));
    else Object.assign(patch, nextTurn(turn, finished, mg.skip || []));
    setMg(patch);
    log(`${cur.name} 🎲 ${d}${gated ? ` — η πύλη θέλει ${GATE_TOKENS} tokens` : ''}`);
  }

  function chooseRoute(route) {
    const p = players.find((x) => x.id === mg.branch);
    if (!p) return;
    setMg({ branch: null, ...draw(p, route) });
    log(`🔀 ${p.name} διάλεξε «${ROUTES[route].name}»`);
  }

  function resolve(ok) {
    const c = mg.card;
    if (!c) return;
    const p = players.find((x) => x.id === c.playerId);
    const reward = c.reward || (c.free ? 1 : ROUTES[c.route].reward);
    const t = { ...tokens };
    const scores = { ...(mg.scores || {}) };
    const patch = { card: null };
    const immune = [...(mg.immune || [])];
    const shielded = !ok && immune.includes(p.id);
    if (shielded) { immune.splice(immune.indexOf(p.id), 1); patch.immune = immune; }
    if (ok) {
      t[p.id] = (t[p.id] || 0) + reward;
      scores[p.id] = (scores[p.id] || 0) + reward * 5;
      if (c.giveChaos) patch.chaosCards = { ...chaosCards, [p.id]: [...(chaosCards[p.id] || []), pick(EXTENDED_CHAOS_MARKET_CARDS).id] };
    } else if (!shielded && c.route === 'chaos') {
      t[p.id] = Math.max(0, (t[p.id] || 0) - 1);
    }
    Object.assign(patch, { tokens: t, scores }, nextTurn(turn, finished, mg.skip || []));
    setMg(patch);
    log(`${ok ? '✅' : '❌'} ${p.name}: «${c.title}»${ok ? ` +${reward} 🪙` : c.route === 'chaos' ? ' −1 🪙' : ''}`);
    sfx[ok ? 'ok' : 'fail']();
  }

  function payImmunity(useItem) {
    const c = mg.card;
    const t = { ...tokens };
    const immune = [...(mg.immune || [])];
    if (useItem) immune.splice(immune.indexOf(c.playerId), 1);
    else t[c.playerId] = Math.max(0, (t[c.playerId] || 0) - 2);
    setMg({ card: null, tokens: t, immune, ...nextTurn(turn, finished, mg.skip || []) });
    log(`🛡️ ${nameOf(c.playerId)} γλίτωσε από «${c.title}»`);
  }

  return (
    <div className="space-y-3">
      {mg.attack && (
        <div className="rounded-lg border-2 border-red-500 bg-red-950/70 p-3 text-center">
          <div className="font-heading text-xl">🪶 Επίθεση Chaos Card!</div>
          <div className="text-sm">{nameOf(mg.attack.from)} → {nameOf(mg.attack.to)}: 15″ γαργάλημα στα πέλματα.</div>
          <Btn className="mt-2" color="bg-secondary" onClick={() => setMg({ attack: null })}>Έγινε</Btn>
        </div>
      )}

      <Panel title={`🗺️ Ταμπλό — σειρά: ${cur?.name || '—'}`}>
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: EXT_END + 1 }, (_, i) => {
            const z = zoneOf(i);
            const here = players.filter((p) => (pos[p.id] || 0) === i);
            return (
              <div
                key={i}
                className="relative aspect-square rounded-sm flex flex-col items-center justify-center text-[10px] sm:text-xs"
                style={{ background: `${z.color}22`, border: `1px solid ${z.color}${here.length ? 'ff' : '55'}` }}
                title={`${i} · ${z.name}`}
              >
                <span className="opacity-70">{ICON[squareType(i)]}</span>
                <span className="flex flex-wrap justify-center leading-none">
                  {here.map((p) => (
                    <b key={p.id} className="px-[2px] rounded-sm" style={{ background: p.id === cur?.id ? '#FFD700' : '#fff', color: '#000' }}>
                      {(p.name || '?')[0]}
                    </b>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] opacity-80">
          {EXT_ZONES.map((z) => <span key={z.id}><i className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: z.color }} />{z.name}</span>)}
          <span>🔀 Διακλάδωση · 🚪 Πύλη (θέλει {GATE_TOKENS} 🪙)</span>
        </div>
      </Panel>

      {mg.branch && (
        <Panel title={`🔀 ${nameOf(mg.branch)}: διάλεξε δρόμο για τα επόμενα 3 τετράγωνα`} accent="#FFD700">
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.values(ROUTES).map((r) => (
              <button
                key={r.id}
                onClick={() => chooseRoute(r.id)}
                className="comic-boom p-3 text-left"
                style={{ background: `${r.color}33`, border: `2px solid ${r.color}` }}
              >
                <div className="font-heading text-lg">{r.icon} {r.name}</div>
                <div className="text-xs opacity-80">{r.desc}</div>
              </button>
            ))}
          </div>
        </Panel>
      )}

      {mg.card && <CardStage card={mg.card} who={nameOf(mg.card.playerId)} players={players} tokens={tokens} immune={(mg.immune || []).includes(mg.card.playerId)} onResolve={resolve} onImmunity={payImmunity} stopped={stopped} onRansom={(buyerId) => { const nextTokens = { ...tokens, [buyerId]: Math.max(0, (tokens[buyerId] || 0) - 2) }; setMg({ card: null, tokens: nextTokens, ...nextTurn(turn, finished, mg.skip || []) }); log(nameOf(buyerId) + ' εξαγόρασε την κάρτα Hogtie Ransom με 2 Tokens.'); }} canPay={(tokens[mg.card.playerId] || 0) >= 2} />}

      {!mg.card && !mg.branch && !allDone && (
        <div className="text-center">
          <Btn color="bg-primary text-black" className="!text-lg !px-8 !py-4" onClick={roll}>
            🎲 ΖΑΡΙ — {cur?.name}
          </Btn>
          {mg.lastRoll && <div className="text-sm mt-1 opacity-80">Τελευταίο: {nameOf(mg.lastRoll.id)} → {mg.lastRoll.d}</div>}
        </div>
      )}

      <Panel title="🪙 Glam Tokens & θέσεις">
        <div className="space-y-1">
          {players.map((p) => {
            const t = tokens[p.id] || 0;
            const r = routes[p.id];
            return (
              <div key={p.id} className={`flex items-center gap-2 text-sm rounded px-2 py-1 ${p.id === cur?.id ? 'bg-primary/20' : 'bg-background/40'}`}>
                <b className="flex-1 truncate">{p.name}{finished.includes(p.id) ? ' 👑' : ''}{(mg.sockConfiscation || {})[p.id] > 0 ? ' 🧦' : ''}{(mg.silenceCurses || {})[p.id] > 0 ? ' 🤫' : ''}</b>
                <span className="opacity-70 text-xs">#{pos[p.id] || 0}{r?.left > 0 ? ` · ${ROUTES[r.route].icon}` : ''}</span>
                <span className="font-heading">{t}🪙</span>
                <span className="w-16 h-2 rounded bg-foreground/10 overflow-hidden"><i className="block h-full bg-yellow-400" style={{ width: `${Math.min(100, (t / GATE_TOKENS) * 100)}%` }} /></span>
                <span className="flex gap-1">
                  <button className="px-1.5 rounded bg-secondary" onClick={() => setMg({ tokens: { ...tokens, [p.id]: t + 1 } })}>+</button>
                  <button className="px-1.5 rounded bg-secondary" onClick={() => setMg({ tokens: { ...tokens, [p.id]: Math.max(0, t - 1) } })}>−</button>
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-xs opacity-70">Πύλη Act 2 / Lockdown: χρειάζονται {GATE_TOKENS} tokens ανά παίκτρια ({gateOpen}/{players.length} έτοιμες). 🧦 = Sock Confiscation · 🤫 = Silence Curse.</div>
      </Panel>

      <Market ctx={ctx} cur={cur} />
      <ChaosHand ctx={ctx} />

      <MissionPanel
        ctx={ctx}
        pool={EXTENDED_SECRET_MISSIONS}
        onSuccess={(m, pid) => {
          const t = { ...(ctx.mg.tokens || {}) };
          t[pid] = (t[pid] || 0) + m.reward;
          if (m.bothReward) {
            const other = pick(players.filter((p) => p.id !== pid));
            if (other) { t[other.id] = (t[other.id] || 0) + m.reward; log(`🤝 ${other.name} παίρνει επίσης +${m.reward} 🪙`); }
          }
          setMg({ tokens: t });
        }}
        onFail={(m, pid) => ctx.addTokens(pid, -1)}
      />

      {(allDone || gateOpen === players.length) && (
        <div className="text-center">
          <Btn color="bg-emerald-700" className="!text-lg !px-8 !py-4" onClick={onDone}>
            {allDone ? '✅ Όλες τερμάτισαν — επόμενη φάση →' : '🚪 Όλες έχουν 5 tokens — επόμενη φάση →'}
          </Btn>
        </div>
      )}
      {!allDone && gateOpen < players.length && (
        <div className="text-center"><Btn onClick={onDone}>Επόμενη φάση (χειροκίνητα)</Btn></div>
      )}
    </div>
  );
}

function CardStage({ card, who, players, tokens, immune, onResolve, onImmunity, onRansom, canPay, stopped }) {
  const [run, setRun] = useState(false);
  const [ransomBuyer, setRansomBuyer] = useState(card.playerId);
  const left = useLocalCountdown(card.secs || 0, run, () => { sfx.alarm(); setRun(false); });
  const r = ROUTES[card.route];
  return (
    <Panel accent={r.color}>
      <div className="text-xs opacity-70">{r.icon} {r.name} · {who}</div>
      <div className="font-heading text-2xl">{card.title}</div>
      <p className="font-body text-base sm:text-lg leading-snug">{card.text}</p>
      {card.restraint && <RestraintNote />}
      {card.secs ? (
        <div className="flex items-center gap-3">
          <Btn color="bg-sky-700" onClick={() => setRun(true)} disabled={run || stopped}>⏱ {Math.ceil(run ? left : card.secs)}″</Btn>
        </div>
      ) : null}
      {card.title === 'The Hogtie Ransom' && (
        <div className="flex flex-wrap gap-2 items-center">
          <select value={ransomBuyer} onChange={(e) => setRansomBuyer(e.target.value)} disabled={stopped} className="rounded bg-background border border-border p-2 text-sm">
            {players.map((p) => <option key={p.id} value={p.id}>{p.name} ({tokens[p.id] || 0}🪙)</option>)}
          </select>
          <Btn color="bg-yellow-700" disabled={stopped || (tokens[ransomBuyer] || 0) < 2} onClick={() => onRansom(ransomBuyer)}>ΕΞΑΓΟΡΑ · 2 TOKENS</Btn>
        </div>
      )}
      {card.trap && (
        <div className="flex flex-wrap gap-2">
          <Btn color="bg-yellow-600 text-black" disabled={stopped || !canPay} onClick={() => onImmunity(false)}>🪙 Πλήρωσε 2 για ασυλία</Btn>
          {immune && <Btn color="bg-yellow-600 text-black" onClick={() => onImmunity(true)} disabled={stopped}>🛡️ Χρήση ασυλίας</Btn>}
        </div>
      )}
      <div className="flex gap-2">
        <Btn color="bg-emerald-700" onClick={() => onResolve(true)} disabled={stopped}>✅ Επιτυχία</Btn>
        <Btn color="bg-red-800" onClick={() => onResolve(false)} disabled={stopped}>❌ Αποτυχία</Btn>
      </div>
    </Panel>
  );
}

function Market({ ctx, cur }) {
  const { players, mg, setMg, log, nameOf } = ctx;
  const [buyer, setBuyer] = useState('');
  const [target, setTarget] = useState('');
  const b = buyer || cur?.id;
  const tokens = mg.tokens || {};

  function buy(item) {
    if (!b || (tokens[b] || 0) < item.cost) return;
    const t = { ...tokens, [b]: tokens[b] - item.cost };
    const patch = { tokens: t };
    if (item.id === 'immunity') patch.immune = [...(mg.immune || []), b];
    if (item.id === 'chaos') patch.chaosCards = { ...(mg.chaosCards || {}), [b]: [...((mg.chaosCards || {})[b] || []), pick(EXTENDED_CHAOS_MARKET_CARDS).id] };
    if (item.id === 'skip') patch.skips = { ...(mg.skips || {}), [b]: ((mg.skips || {})[b] || 0) + 1 };
    if (item.id === 'hint') patch.hints = { ...(mg.hints || {}), [b]: ((mg.hints || {})[b] || 0) + 1 };
    if (item.id === 'bribe') {
      const tg = target || players.find((p) => p.id !== b)?.id;
      if (!tg) return;
      t[tg] = (t[tg] || 0) + 1;
      log(`💸 ${nameOf(b)} δωροδόκησε την ${nameOf(tg)} να πάρει τη θέση της στο επόμενο δύσκολο δέσιμο`);
    } else log(`🛒 ${nameOf(b)} αγόρασε «${item.name}»`);
    setMg(patch);
    sfx.ok();
  }

  return (
    <Panel title="🛒 Market Glam Tokens">
      <div className="flex flex-wrap gap-2 items-center text-sm">
        Αγοράζει:
        <select value={b || ''} onChange={(e) => setBuyer(e.target.value)} className="px-2 py-1.5 rounded bg-background border border-border">
          {players.map((p) => <option key={p.id} value={p.id}>{p.name} ({tokens[p.id] || 0}🪙)</option>)}
        </select>
        Δωροδοκία προς:
        <select value={target} onChange={(e) => setTarget(e.target.value)} className="px-2 py-1.5 rounded bg-background border border-border">
          <option value="">(τυχαία)</option>
          {players.filter((p) => p.id !== b).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {SHOP.map((it) => (
          <button
            key={it.id}
            disabled={!b || (tokens[b] || 0) < it.cost}
            onClick={() => buy(it)}
            className="comic-boom bg-secondary p-2 text-left disabled:opacity-40"
          >
            <div className="font-heading text-sm">{it.icon} {it.name} — {it.cost}🪙</div>
            <div className="text-xs opacity-70">{it.desc}</div>
          </button>
        ))}
      </div>
      <div className="text-xs opacity-70">
        Ασυλίες: {(mg.immune || []).map(nameOf).join(', ') || '—'} · Hints/Skips: {players.map((p) => `${p.name} ${((mg.hints || {})[p.id] || 0)}💡/${((mg.skips || {})[p.id] || 0)}⏩`).join(' · ')}
      </div>
    </Panel>
  );
}

function ChaosHand({ ctx }) {
  const { players, mg, setMg, log, nameOf } = ctx;
  const hands = mg.chaosCards || {};
  const [targets, setTargets] = useState({});
  const owners = players.filter((p) => (hands[p.id] || []).length);
  if (!owners.length) return null;

  function use(owner, idx) {
    const powerId = hands[owner.id][idx];
    const power = EXTENDED_CHAOS_MARKET_CARDS.find((x) => x.id === powerId);
    const target = targets[owner.id] || players.find((p) => p.id !== owner.id)?.id;
    if (!power || !target) return;
    const rest = hands[owner.id].filter((_, i) => i !== idx);
    const patch = { chaosCards: { ...hands, [owner.id]: rest } };
    if (power.id === 'reverse') {
      patch.reverseNextPenalty = { ...(mg.reverseNextPenalty || {}), [owner.id]: true };
      if (mg.attack?.to === owner.id) patch.attack = { ...mg.attack, from: owner.id, to: mg.attack.from, reversed: true };
    }
    if (power.id === 'token_tax') {
      const richest = players.filter((p) => p.id !== owner.id).sort((a, b) => ((mg.tokens || {})[b.id] || 0) - ((mg.tokens || {})[a.id] || 0))[0];
      const balances = { ...(mg.tokens || {}) };
      if (richest) {
        const taken = Math.min(2, balances[richest.id] || 0);
        balances[richest.id] = (balances[richest.id] || 0) - taken;
        balances[owner.id] = (balances[owner.id] || 0) + taken;
      }
      patch.tokens = balances;
    }
    if (power.id === 'double_tickle') patch.doublePenaltyNext = { ...(mg.doublePenaltyNext || {}), [target]: true };
    if (power.id === 'forced_route') patch.routes = { ...(mg.routes || {}), [target]: { route: 'chaos', left: 3 } };
    if (power.id === 'sock_confiscation') patch.sockConfiscation = { ...(mg.sockConfiscation || {}), [target]: 3 };
    if (power.id === 'hostage_swap') {
      const pos = { ...(mg.pos || {}) };
      const a = pos[owner.id] || 0;
      pos[owner.id] = pos[target] || 0;
      pos[target] = a;
      patch.pos = pos;
    }
    if (power.id === 'silence_curse') patch.silenceCurses = { ...(mg.silenceCurses || {}), [target]: 2 };
    if (power.id === 'glam_shield') patch.immune = [...(mg.immune || []), owner.id];
    setMg(patch);
    log(`🃏 ${owner.name} έπαιξε «${power.name}» στην ${nameOf(target)}`);
  }

  return (
    <Panel title="🃏 Chaos Cards (κρυφές — μόνο η κάτοχος τις βλέπει στο κινητό)">
      {owners.map((o) => (
        <div key={o.id} className="flex flex-wrap items-center gap-2 text-sm">
          <b>{o.name}</b>
          <select
            value={targets[o.id] || ''}
            onChange={(e) => setTargets({ ...targets, [o.id]: e.target.value })}
            className="px-2 py-1 rounded bg-background border border-border"
          >
            <option value="">Στόχος…</option>
            {players.filter((p) => p.id !== o.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {hands[o.id].map((pid, i) => {
            const pw = EXTENDED_CHAOS_MARKET_CARDS.find((x) => x.id === pid);
            return <Btn key={i} className="!py-1" color="bg-red-900" onClick={() => use(o, i)}>{pw?.icon} {pw?.name}</Btn>;
          })}
        </div>
      ))}
    </Panel>
  );
}
