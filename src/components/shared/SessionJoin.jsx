import { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import QRScanner from '@/components/play/QRScanner';

function parseCodeFromScan(text) {
  try {
    const url = new URL(text);
    const code = url.searchParams.get('code');
    if (code) return code;
  } catch {
    // not a URL — treat as raw code
  }
  return text;
}

export default function SessionJoin({ onJoin, loading, title = '📱 ΣΥΝΔΕΣΗ ΣΕ ΠΑΙΧΝΙΔΙ' }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  async function handleJoin(rawCode) {
    const parsed = (rawCode || code).trim().toUpperCase();
    if (!parsed) return;
    setError(false);
    const ok = await onJoin(parsed);
    if (!ok) setError(true);
  }

  return (
    <div className="min-h-screen comic-dots flex items-center justify-center p-4">
      <ComicPanel className="max-w-md w-full text-center py-8 bg-card">
        <div className="font-heading text-3xl mb-2 text-foreground">{title}</div>
        <div className="text-sm mb-4 text-foreground/70 font-body">Εισήγαγε τον κωδικό ή σκάναρε το QR από την οθόνη Tablet</div>
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          placeholder="πχ. AB3X"
          maxLength={6}
          className="comic-panel-sm w-full max-w-xs px-4 py-3 text-2xl font-heading text-center bg-secondary text-foreground tracking-widest mb-3"
          autoFocus
        />
        {error && <div className="text-tarot-crimson font-bold mb-2">❌ Δεν βρέθηκε παιχνίδι με αυτόν τον κωδικό.</div>}
        <ComicButton variant="magenta" size="lg" onClick={() => handleJoin()} disabled={!code.trim() || loading}>
          🔗 ΣΥΝΔΕΣΗ
        </ComicButton>

        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 h-0.5 bg-foreground/20" />
          <span className="text-xs font-bold text-foreground/50">Ή</span>
          <div className="flex-1 h-0.5 bg-foreground/20" />
        </div>

        {!showScanner ? (
          <ComicButton variant="cyan" size="md" onClick={() => setShowScanner(true)} className="w-full">
            📷 ΣΚΑΝΑΡΕ QR ΚΩΔΙΚΟ
          </ComicButton>
        ) : (
          <QRScanner
            label="📷 QR SCANNER — Σκάναρε το QR του Tablet"
            onScan={(text) => {
              const parsed = parseCodeFromScan(text);
              setCode(parsed);
              handleJoin(parsed);
            }}
          />
        )}
      </ComicPanel>
    </div>
  );
}