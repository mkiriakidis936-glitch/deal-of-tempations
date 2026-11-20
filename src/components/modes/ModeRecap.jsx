import React, { useRef, useState } from 'react';
import { Btn } from '@/components/modes/ModeShell';

// Recap & awards στο τέλος κάθε ψηφιακού mode (μαύρο/χρυσό, κοινοποιήσιμο ως εικόνα ή PDF).
export function computeAwards({ players = [], mg = {} }) {
  const awards = [];
  const by = (fn) => [...players].sort((a, b) => fn(b) - fn(a));
  const tokens = (p) => (mg.tokens || {})[p.id] || 0;
  const score = (p) => (mg.scores || {})[p.id] || 0;
  const total = (p) => tokens(p) + score(p);
  const top = by(total)[0];
  if (top && total(top) > 0) awards.push({ icon: '🥇', title: 'Νικήτρια', who: top.name, note: `${total(top)} πόντοι` });
  const tk = by(tokens)[0];
  if (tk && tokens(tk) > 0 && tk.id !== top?.id) awards.push({ icon: '🪙', title: 'Tokens Queen', who: tk.name, note: `${tokens(tk)} tokens` });
  const sc = by(score)[0];
  if (sc && score(sc) > 0 && sc.id !== top?.id) awards.push({ icon: '⭐', title: 'Score Star', who: sc.name, note: `${score(sc)} σκορ` });
  const queen = mg.bb?.queen && players.find((p) => p.id === mg.bb.queen);
  if (queen) awards.push({ icon: '👑', title: 'Last Queen', who: queen.name, note: 'Beach Bar finale' });
  if (mg.lockdownResult) awards.push({ icon: mg.lockdownResult === 'won' ? '🔓' : '🔒', title: 'Lockdown', who: mg.lockdownResult === 'won' ? 'Απόδραση!' : 'Δεν ξεκλειδώθηκε', note: '' });
  return awards;
}

export default function ModeRecap({ state, players, mg, ranking }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState('');
  const awards = computeAwards({ players, mg });
  const startedAt = mg.consent?.startedAt || mg.startedAt;
  const minutes = startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 60000)) : 0;
  const duration = `${Math.floor(minutes / 60)}ω ${String(minutes % 60).padStart(2, '0')}′`;

  async function capture() {
    const { default: html2canvas } = await import('html2canvas');
    return html2canvas(cardRef.current, { backgroundColor: '#000000', scale: 2 });
  }
  async function exportImage() {
    setBusy('png');
    try {
      const canvas = await capture();
      const link = document.createElement('a');
      link.download = `deal-of-temptation-${state?.sessionCode || 'recap'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally { setBusy(''); }
  }
  async function exportPdf() {
    setBusy('pdf');
    try {
      const [canvas, { jsPDF }] = await Promise.all([capture(), import('jspdf')]);
      const width = canvas.width / 2;
      const height = canvas.height / 2;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [width, height] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);
      pdf.save(`deal-of-temptation-${state?.sessionCode || 'recap'}.pdf`);
    } finally { setBusy(''); }
  }

  return (
    <div className="space-y-2">
      <div ref={cardRef} className="mx-auto rounded-3xl p-5" style={{ width: 440, maxWidth: '100%', background: 'radial-gradient(120% 60% at 50% -10%, rgba(232,194,107,.22), transparent 60%), #000', border: '1px solid rgba(232,194,107,.6)' }}>
        <div className="text-center">
          <div className="text-[10px] tracking-[.4em]" style={{ color: '#E8C26B' }}>DEAL OF TEMPTATION</div>
          <div className="font-display text-3xl" style={{ color: '#F7E3A8' }}>The Recap</div>
          <div className="text-xs opacity-60 mt-1">Συνεδρία {state?.sessionCode || '—'} · {players.length} παίκτριες · {duration}</div>
        </div>
        {awards.length > 0 && (
          <div className="mt-4 space-y-2">
            {awards.map((a) => (
              <div key={a.title} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: 'rgba(232,194,107,.09)', border: '1px solid rgba(232,194,107,.35)' }}>
                <span className="text-2xl">{a.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] uppercase tracking-widest" style={{ color: '#E8C26B' }}>{a.title}</div>
                  <div className="font-heading truncate">{a.who}</div>
                </div>
                {a.note && <span className="text-xs opacity-70">{a.note}</span>}
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 space-y-1">
          {ranking.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between text-sm border-b pb-1" style={{ borderColor: 'rgba(232,194,107,.18)' }}>
              <span>{['🥇', '🥈', '🥉'][i] || `${i + 1}.`} {p.name}</span>
              <b style={{ color: '#F7E3A8' }}>{((mg.scores || {})[p.id] || 0) + ((mg.tokens || {})[p.id] || 0)}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Btn color="bg-amber-700" disabled={!!busy} onClick={exportImage}>{busy === 'png' ? '⏳…' : '🖼️ Recap (εικόνα)'}</Btn>
        <Btn color="bg-amber-700" disabled={!!busy} onClick={exportPdf}>{busy === 'pdf' ? '⏳…' : '📄 Recap (PDF)'}</Btn>
      </div>
    </div>
  );
}
