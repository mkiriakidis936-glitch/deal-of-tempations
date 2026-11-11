import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ComicButton from '@/components/comic/ComicButton';

// Recap καρτέλα παιχνιδιού σε PDF (εικόνα της καρτέλας).
export default function RecapExport({ state }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const players = state.players || [];
  const sorted = [...players].sort((a, b) => (b.bounty || 0) - (a.bounty || 0));
  const highlights = (state.history || [])
    .map((e) => e.detail || e.description || e.message || null)
    .filter(Boolean)
    .slice(0, 8);

  async function exportPdf() {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#1a050a', scale: 2 });
      const width = canvas.width / 2;
      const height = canvas.height / 2;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [width, height] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);
      pdf.save(`deal-of-temptation-${state.sessionCode || 'recap'}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div ref={cardRef} className="comic-panel bg-card p-4" style={{ width: 460, maxWidth: '100%' }}>
        <div className="text-center mb-3">
          <div className="font-heading text-xl text-tarot-gold">DEAL OF TEMPTATION</div>
          <div className="text-xs text-foreground/60">Σύνοδος {state.sessionCode} · {state.mode}</div>
        </div>
        <div className="space-y-1">
          {sorted.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between text-xs border-b border-border/30 pb-1">
              <span className="font-bold">{i + 1}. {p.name}</span>
              <span className="text-foreground/70">
                ${(p.bounty || 0).toLocaleString()} · ⚠️{p.penaltyStep || 0} · 🎟️{p.tokens || 0} · 🔮{p.karma || 0}
              </span>
            </div>
          ))}
        </div>
        {highlights.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-bold text-primary mb-1">ΣΤΙΓΜΕΣ</div>
            <ul className="text-[10px] text-foreground/60 space-y-0.5 list-disc pl-4">
              {highlights.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </div>
        )}
      </div>
      <ComicButton variant="cyan" size="sm" className="w-full" onClick={exportPdf} disabled={busy}>
        {busy ? '⏳ ΔΗΜΙΟΥΡΓΙΑ...' : '📄 EXPORT RECAP (PDF)'}
      </ComicButton>
    </div>
  );
}