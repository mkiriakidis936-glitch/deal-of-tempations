import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const GOLD = '#d4af37';
const CREAM = '#f6ecd4';

export default function CertificateDownload({ name, score, breakdown, mode = 'Pajama Pedi-Glam' }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const date = new Date().toLocaleDateString('el-GR');

  async function download() {
    if (!ref.current || busy) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: '#14060a', useCORS: true });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = 297;
      const H = 210;
      const ratio = canvas.width / canvas.height;
      let w = W - 16;
      let h = w / ratio;
      if (h > H - 16) {
        h = H - 16;
        w = h * ratio;
      }
      pdf.addImage(img, 'JPEG', (W - w) / 2, (H - h) / 2, w, h);
      pdf.save(`pajama-pedi-glam-${(name || 'winner').replace(/\s+/g, '-')}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={download}
        disabled={busy}
        className="w-full py-3 rounded-lg font-heading text-lg border border-tarot-gold/60 bg-tarot-gold/15 text-tarot-gold disabled:opacity-50"
      >
        {busy ? 'ΔΗΜΙΟΥΡΓΙΑ...' : '📜 ΠΙΣΤΟΠΟΙΗΤΙΚΟ PDF'}
      </button>

      <div style={{ position: 'fixed', left: -20000, top: 0, pointerEvents: 'none' }}>
        <div
          ref={ref}
          style={{
            width: 1123,
            height: 794,
            padding: 40,
            background: '#14060a',
            color: CREAM,
            fontFamily: 'Georgia, serif',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ width: '100%', height: '100%', border: `3px solid ${GOLD}`, padding: 8, boxSizing: 'border-box' }}>
            <div style={{ width: '100%', height: '100%', border: `1px solid ${GOLD}`, padding: 40, boxSizing: 'border-box', textAlign: 'center' }}>
              <div style={{ letterSpacing: 8, fontSize: 13, color: GOLD }}>DEAL OF TEMPTATION</div>
              <div style={{ fontSize: 15, letterSpacing: 5, marginTop: 26, color: CREAM }}>ΠΙΣΤΟΠΟΙΗΤΙΚΟ</div>
              <div style={{ fontSize: 40, letterSpacing: 4, marginTop: 10, color: GOLD }}>ΒΑΣΙΛΙΣΣΑ ΤΟΥ PEDI-GLAM</div>
              <div style={{ width: 120, height: 1, background: GOLD, margin: '26px auto' }} />
              <div style={{ fontSize: 46, color: CREAM }}>{name || '—'}</div>
              <div style={{ fontSize: 17, marginTop: 20, color: '#e6d6b4' }}>
                ολοκλήρωσε το {mode} με {score || 0} πόντους
              </div>
              {breakdown && (
                <div style={{ fontSize: 14, marginTop: 8, color: '#bda882' }}>
                  Δοκιμασίες {breakdown.main || 0} · Confessions {breakdown.confessions || 0} · Σαμποτάζ {breakdown.sabotage || 0}
                </div>
              )}
              <div style={{ fontSize: 15, marginTop: 32, color: '#e6d6b4', fontStyle: 'italic' }}>
                «Άντεξε δεσίματα, γαργαλητό και μία νύχτα γεμάτη μυστικά.»
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 56, fontSize: 13, color: '#bda882' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ width: 200, borderTop: `1px solid ${GOLD}`, paddingTop: 6 }}>Η διοργανώτρια</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ width: 200, borderTop: `1px solid ${GOLD}`, paddingTop: 6 }}>{date}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}