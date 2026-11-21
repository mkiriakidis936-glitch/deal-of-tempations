import React from 'react';
import { isGolden } from '@/lib/boardEngine';
import { weatherReport } from '@/lib/showEngine';

// Στοιχεία εκπομπής για την TV του PAJAMA HEIST. Όλα στατικά (χωρίς κινήσεις), στο ενιαίο design system.
const WEATHER_EVERY = 30 * 60 * 1000;
const WEATHER_FOR = 15000;

export function GoldenBand({ lg, now }) {
  if (!isGolden(lg, now)) return null;
  return (
    <div className="ui-tv-bar" style={{ background: '#2a2008', borderColor: 'var(--ui-gold)' }}>
      <span className="ui-tv-live" style={{ background: 'var(--ui-gold)', color: '#000' }}>✨ ΧΡΥΣΟ ΛΕΠΤΟ</span>
      <span className="ui-tv-text">Κάθε λεία μετράει <b style={{ color: 'var(--ui-gold-hi)' }}>διπλή</b>!</span>
      <span className="ml-auto ui-tv-num ui-tv-title ui-tv-title--gold">{Math.ceil((lg.golden.until - now) / 1000)}″</span>
    </div>
  );
}

export function VoteBar({ tally }) {
  const truth = tally?.truth || 0;
  const lie = tally?.lie || 0;
  const total = truth + lie;
  if (!total) return <div className="ui-tv-muted">Οι ψήφοι του κοινού εμφανίζονται εδώ live…</div>;
  const pct = Math.round((truth / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between ui-tv-text"><span style={{ color: 'var(--ui-green)' }}>Αλήθεια {truth}</span><span style={{ color: 'var(--ui-red)' }}>{lie} Ψέμα</span></div>
      <div className="flex h-5 overflow-hidden rounded-full" style={{ background: 'var(--ui-surface-3)' }}>
        <div style={{ width: `${pct}%`, background: 'var(--ui-green)' }} />
        <div style={{ width: `${100 - pct}%`, background: 'var(--ui-red)' }} />
      </div>
    </div>
  );
}

export function DossierCard({ lg, nameOf }) {
  const q = lg.dossierQ;
  if (!q) return null;
  return (
    <div className="ui-card ui-card--gold space-y-3 text-center">
      <div className="ui-tv-eyebrow ui-tv-eyebrow--gold">🗂️ Φάκελος υπόπτου</div>
      <div className="ui-tv-muted">{q.question}</div>
      <div className="ui-tv-title">«{q.text}»</div>
      {q.revealed
        ? <div className="ui-tv-title ui-tv-title--gold">Το είπε η {nameOf(q.owner)}!{q.winners?.length ? <div className="ui-tv-text mt-2">Το βρήκαν: {q.winners.map(nameOf).join(', ')}</div> : null}</div>
        : <div className="ui-tv-text">Ποια το είπε; Μαντέψτε στο κινητό · {q.guesses || 0} μαντεψιές</div>}
    </div>
  );
}

export function OnAirTakeover({ lg, now }) {
  if (!lg.onAir || now > lg.onAir.until) return null;
  return (
    <div className="ui-tv-takeover" style={{ borderTop: '12px solid #BF5AF2', borderBottom: '12px solid #BF5AF2' }}>
      <div className="ui-tv-live" style={{ background: '#BF5AF2' }}>💌 ΑΠΟ ΤΟ ΕΞΟΜΟΛΟΓΗΤΗΡΙΟ</div>
      <div className="ui-tv-title max-w-6xl" style={{ fontSize: 'calc(var(--tv-unit) * 4.5)' }}>«{lg.onAir.text}»</div>
      <div className="ui-tv-muted">Ανώνυμα · ποια να το έγραψε;</div>
    </div>
  );
}

// Δελτίο καιρού: αυτόματα κάθε 30′ (για 15″) ή όποτε το ζητήσει το Tablet.
export function WeatherTakeover({ lg, players, now, startedAt }) {
  const manual = lg.weatherAt && now - lg.weatherAt < WEATHER_FOR;
  const elapsed = startedAt ? now - startedAt : 0;
  const auto = elapsed > WEATHER_EVERY && elapsed % WEATHER_EVERY < WEATHER_FOR;
  if ((!manual && !auto) || lg.ceremony) return null;
  const report = weatherReport(lg, players);
  return (
    <div className="ui-tv-takeover" style={{ borderTop: '12px solid #64D2FF', borderBottom: '12px solid #64D2FF' }}>
      <div className="ui-tv-live" style={{ background: '#64D2FF', color: '#000' }}>📊 ΔΕΛΤΙΟ ΚΑΙΡΟΥ ΤΗΣ ΒΡΑΔΙΑΣ</div>
      <div className="flex items-center gap-8">
        <div style={{ fontSize: 'calc(var(--tv-unit) * 9)' }}>{report.sky.icon}</div>
        <div className="text-left">
          <div className="ui-tv-title ui-tv-title--xl">{report.temperature}°</div>
          <div className="ui-tv-text">{report.sky.label}</div>
        </div>
      </div>
      <div className="space-y-2 text-left">{report.lines.map((line) => <div key={line.text} className="ui-tv-text">{line.icon} {line.text}</div>)}</div>
    </div>
  );
}

export function CeremonyTakeover({ lg }) {
  const c = lg.ceremony;
  if (!c) return null;
  const award = c.awards?.[c.step];
  return (
    <div className="ui-tv-takeover" style={{ borderTop: '12px solid var(--ui-gold)', borderBottom: '12px solid var(--ui-gold)' }}>
      <div className="ui-tv-live" style={{ background: 'var(--ui-gold)', color: '#000' }}>🏆 ΤΕΛΕΤΗ ΑΠΟΝΟΜΗΣ</div>
      {c.stage === 'awards' && award && (
        <>
          <div style={{ fontSize: 'calc(var(--tv-unit) * 8)' }}>{award.icon}</div>
          <div className="ui-tv-title ui-tv-title--gold">{award.title}</div>
          {c.revealed
            ? <><div className="ui-tv-title ui-tv-title--xl">{award.name}</div><div className="ui-tv-text">{award.line}</div></>
            : <div className="ui-tv-text">Και το βραβείο πάει σε…</div>}
          <div className="ui-tv-muted">{c.step + 1} / {c.awards.length}</div>
        </>
      )}
      {c.stage === 'highlights' && (
        <>
          <div className="ui-tv-title ui-tv-title--gold">Οι μεγάλες στιγμές της βραδιάς</div>
          <div className="space-y-3 text-left">{(c.highlights || []).map((h) => <div key={h.text} className="ui-tv-text">{h.icon} {h.text}</div>)}</div>
        </>
      )}
      {c.stage === 'records' && (
        <>
          <div className="ui-tv-title ui-tv-title--gold">🏅 Νέα ρεκόρ όλων των εποχών!</div>
          <div className="space-y-3 text-left">{(c.records || []).map((r) => <div key={r.id} className="ui-tv-text">{r.label}: <b style={{ color: 'var(--ui-gold-hi)' }}>{r.value}</b> — {r.name}{r.previous ? <span className="ui-tv-muted"> (πριν: {r.previous})</span> : null}</div>)}</div>
        </>
      )}
      {c.stage === 'done' && (
        <>
          <div className="ui-tv-title ui-tv-title--xl ui-tv-title--gold">Καληνύχτα!</div>
          <div className="ui-tv-text">Η αναμνηστική σας κάρτα σας περιμένει στο κινητό.</div>
        </>
      )}
    </div>
  );
}

export function newsTicker(lg, nameOf) {
  return (lg.news || []).slice(0, 3).map((item) => `📰 ${nameOf(item.pid)}: ${item.text}`);
}
