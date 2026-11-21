import React, { useRef, useState } from 'react';
import { Card, Button, Badge, Input } from '@/design/ui';
import { isGolden } from '@/lib/boardEngine';
import { DOSSIER_QUESTIONS, playerTitle, BET_REWARD, BETRAY_SHARE } from '@/lib/showEngine';

const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('el-GR')}€`;

// Κινητό: όλα τα παιχνίδια της εκπομπής. Ό,τι στέλνει η παίκτρια πάει στο δικό της «γραμματοκιβώτιο».
export default function ShowMobile({ state, me, updateState }) {
  const lg = state.mg?.lounge || {};
  const players = state.players || [];
  const others = players.filter((p) => p.id !== me.id);
  const now = Date.now();
  const [sent, setSent] = useState({});
  const [news, setNews] = useState('');
  const [confess, setConfess] = useState('');
  const [answers, setAnswers] = useState(['', '', '']);
  const nameOf = (id) => players.find((p) => p.id === id)?.name || '';

  const queue = useRef(null);
  const send = (entry, flag) => {
    // Ουρά έως 10 μηνυμάτων: τίποτα δεν χάνεται αν σταλούν πολλά γρήγορα.
    const own = state.loungeInbox?.[me.id];
    const base = queue.current || (Array.isArray(own) ? own : []);
    const at = Math.max(Date.now(), (base[base.length - 1]?.at || 0) + 1);
    queue.current = [...base, { ...entry, at }].slice(-10);
    updateState({ loungeInbox: { [me.id]: queue.current } });
    if (flag) setSent((s) => ({ ...s, [flag]: true }));
  };

  if (lg.ceremony) return <KeepsakeCard lg={lg} me={me} players={players} />;

  const myBet = lg.bets?.[me.id];
  const myDossier = lg.dossier?.[me.id];
  const q = lg.dossierQ;
  const betrayCard = lg.betrayCard === me.id && !lg.betrayUsed;
  const newsUsed = lg.newsUsed?.[me.id] || sent.news;

  return (
    <div className="space-y-3">
      {isGolden(lg, now) && (
        <Card tone="gold" className="text-center">
          <div className="font-bold" style={{ color: 'var(--ui-gold-hi)' }}>✨ Χρυσό λεπτό — κάθε λεία μετράει διπλή!</div>
          <div className="ui-timer text-3xl">{Math.ceil((lg.golden.until - now) / 1000)}″</div>
        </Card>
      )}

      {q && !q.revealed && q.owner === undefined && (
        <Card tone="gold" className="space-y-2">
          <div className="ui-eyebrow" style={{ color: 'var(--ui-gold)' }}>🗂️ Φάκελος υπόπτου · {q.question}</div>
          <div className="text-[19px] font-semibold">«{q.text}»</div>
          {sent[`guess:${q.id}`]
            ? <div className="ui-subtitle">Η μαντεψιά σου καταχωρήθηκε ✓</div>
            : <>
              <div className="ui-subtitle">Ποια το είπε; (+1.000€ αν βρεις)</div>
              <div className="flex flex-wrap gap-2">{others.map((p) => <Button key={p.id} onClick={() => send({ type: 'guess', qid: q.id, target: p.id }, `guess:${q.id}`)}>{p.name}</Button>)}</div>
            </>}
        </Card>
      )}

      {betrayCard && (
        <Card tone="danger" className="space-y-2">
          <div className="ui-eyebrow" style={{ color: 'var(--ui-red)' }}>🗡️ Μυστική κάρτα προδοσίας · μόνο εσύ τη βλέπεις</div>
          <div className="ui-subtitle">Κλέψε στα κρυφά το {Math.round(BETRAY_SHARE * 100)}% της λείας μιας παίκτριας. Μόνο μία φορά. Θα αποκαλυφθεί στην τελετή…</div>
          {sent.betray
            ? <div className="ui-subtitle">Έγινε. Σιωπή… 🤫</div>
            : <div className="flex flex-wrap gap-2">{others.map((p) => <Button key={p.id} variant="danger" onClick={() => { if (window.confirm(`Να κλέψεις από την ${p.name};`)) send({ type: 'betray', target: p.id }, 'betray'); }}>{p.name}</Button>)}</div>}
        </Card>
      )}

      {!lg.firstArrest && !myBet && !sent.bet && others.length > 0 && (
        <Card className="space-y-2">
          <div className="ui-eyebrow">🎯 Στοίχημα έναρξης</div>
          <div className="ui-subtitle">Ποια θα συλληφθεί πρώτη; Αν το βρεις: +{money(BET_REWARD)}</div>
          <div className="flex flex-wrap gap-2">{others.map((p) => <Button key={p.id} onClick={() => send({ type: 'bet', target: p.id }, 'bet')}>{p.name}</Button>)}</div>
        </Card>
      )}
      {(myBet || sent.bet) && !lg.betsPaid && <div className="ui-subtitle text-center">🎯 Το στοίχημά σου: {nameOf(myBet) || 'καταχωρήθηκε'}</div>}

      {lg.dossierSet && !myDossier && !sent.dossier && (
        <Card className="space-y-2">
          <div className="ui-eyebrow">🗂️ Ο φάκελός σου</div>
          <div className="ui-subtitle">Απάντησε σύντομα. Η TV θα διαβάσει μία απάντηση και οι άλλες θα μαντεύουν αν είσαι εσύ.</div>
          {lg.dossierSet.map((qi, i) => (
            <div key={qi} className="space-y-1">
              <div className="text-[14px]">{DOSSIER_QUESTIONS[qi]}</div>
              <Input value={answers[i]} maxLength={80} onChange={(e) => setAnswers((a) => a.map((v, j) => (j === i ? e.target.value : v)))} placeholder="Η απάντησή σου" />
            </div>
          ))}
          <Button variant="primary" block disabled={answers.some((a) => !a.trim())} onClick={() => send({ type: 'dossier', answers: answers.map((a) => a.trim()) }, 'dossier')}>Αποστολή φακέλου</Button>
        </Card>
      )}

      <Card className="space-y-2">
        <div className="ui-eyebrow">📰 Breaking news · μία φορά τη βραδιά</div>
        {newsUsed
          ? <div className="ui-subtitle">Η είδησή σου στάλθηκε στην TV ✓</div>
          : <>
            <Input value={news} maxLength={90} onChange={(e) => setNews(e.target.value)} placeholder="π.χ. Η Ελένη έκρυψε σαγιονάρα!" />
            <Button variant="primary" block disabled={!news.trim()} onClick={() => { send({ type: 'news', text: news.trim() }, 'news'); setNews(''); }}>Στείλε στο δελτίο</Button>
          </>}
      </Card>

      <Card className="space-y-2">
        <div className="ui-eyebrow">💌 Εξομολογητήριο · ανώνυμο</div>
        <div className="ui-subtitle">Πηγαίνει μόνο στη διοργανώτρια, χωρίς το όνομά σου. Αν το εγκρίνει, βγαίνει στην TV.</div>
        <Input value={confess} maxLength={200} onChange={(e) => setConfess(e.target.value)} placeholder="Γράψε κάτι…" />
        <Button block disabled={!confess.trim()} onClick={() => { send({ type: 'confess', text: confess.trim() }); setConfess(''); setSent((s) => ({ ...s, confessAt: Date.now() })); }}>Αποστολή</Button>
        {sent.confessAt && <div className="ui-subtitle text-center">Στάλθηκε ανώνυμα ✓</div>}
      </Card>
    </div>
  );
}

// Αναμνηστική κάρτα της βραδιάς — αποθηκεύεται ως εικόνα.
function KeepsakeCard({ lg, me, players }) {
  const awards = lg.ceremony?.awards || [];
  const title = playerTitle(awards, me.id);
  const mine = awards.filter((a) => a.pid === me.id);
  const s = lg.stats?.[me.id] || {};
  const t = lg.tally?.[me.id] || {};
  const rank = [...players].sort((a, b) => (lg.stats?.[b.id]?.loot || 0) - (lg.stats?.[a.id]?.loot || 0)).findIndex((p) => p.id === me.id) + 1;
  const lines = [
    ['Θέση', `${rank}η από ${players.length}`],
    ['Λεία', money(s.loot)],
    ['Συλλήψεις', t.arrests || 0],
    ['Αλήθειες / ψέματα', `${t.truths || 0} / ${t.lies || 0}`],
    ['Κάρτες', t.cardsDone || 0],
  ];

  async function save() {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const c = canvas.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, 1080, 1350);
    c.strokeStyle = '#E8C26B'; c.lineWidth = 6; c.strokeRect(40, 40, 1000, 1270);
    c.textAlign = 'center';
    c.fillStyle = '#E8C26B'; c.font = '600 34px -apple-system, system-ui, sans-serif'; c.fillText('DEAL OF TEMPTATION · PAJAMA HEIST', 540, 140);
    c.fillStyle = '#F5F1E8'; c.font = '800 96px -apple-system, system-ui, sans-serif'; c.fillText(me.name, 540, 300);
    c.fillStyle = '#F7E3A8'; c.font = '700 54px -apple-system, system-ui, sans-serif'; c.fillText(title, 540, 400);
    c.font = '500 44px -apple-system, system-ui, sans-serif';
    lines.forEach(([label, value], i) => {
      c.fillStyle = 'rgba(235,235,245,0.66)'; c.textAlign = 'left'; c.fillText(label, 140, 560 + i * 90);
      c.fillStyle = '#F5F1E8'; c.textAlign = 'right'; c.fillText(String(value), 940, 560 + i * 90);
    });
    c.textAlign = 'center'; c.fillStyle = '#E8C26B'; c.font = '600 40px -apple-system, system-ui, sans-serif';
    mine.slice(0, 3).forEach((a, i) => c.fillText(`${a.icon} ${a.title}`, 540, 1070 + i * 60));
    c.fillStyle = 'rgba(235,235,245,0.42)'; c.font = '400 30px -apple-system, system-ui, sans-serif';
    c.fillText(new Date().toLocaleDateString('el-GR'), 540, 1270);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], `deal-of-temptation-${me.name}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Deal of Temptation' }).catch(() => {}); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  return (
    <Card tone="gold" className="space-y-3 text-center">
      <div className="ui-eyebrow" style={{ color: 'var(--ui-gold)' }}>Η αναμνηστική σου κάρτα</div>
      <div className="ui-title">{me.name}</div>
      <div className="text-[20px] font-bold" style={{ color: 'var(--ui-gold-hi)' }}>{title}</div>
      <div className="ui-list text-left">
        {lines.map(([label, value]) => <div key={label} className="ui-row"><span className="ui-row__title">{label}</span><span className="ui-row__value">{value}</span></div>)}
      </div>
      {mine.length > 0 && <div className="flex flex-wrap justify-center gap-2">{mine.map((a) => <Badge key={a.id} tone="gold">{a.icon} {a.title}</Badge>)}</div>}
      <Button variant="primary" block onClick={save}>💾 Αποθήκευση εικόνας</Button>
    </Card>
  );
}
