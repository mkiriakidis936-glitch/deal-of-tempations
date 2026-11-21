import { useState } from 'react';
import QRScanner from '@/components/play/QRScanner';
import { Page, Header, Card, Button, Input } from '@/design/ui';

function parseCodeFromScan(text) {
  try {
    const url = new URL(text);
    const code = url.searchParams.get('code');
    if (code) return code;
  } catch {
    // όχι URL — σκέτος κωδικός
  }
  return text;
}

export default function SessionJoin({ onJoin, loading, title = 'Σύνδεση σε παιχνίδι' }) {
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
    <Page center>
      <div className="flex justify-center"><img src="/icons/icon-192.png" alt="" className="h-20 w-20 rounded-[22px]" /></div>
      <Header eyebrow="Deal of Temptation" title={title} subtitle="Γράψε τον κωδικό ή σκάναρε το QR από την οθόνη του Tablet." />
      <Card className="space-y-3">
        <Input
          code
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          placeholder="AB3X"
          maxLength={6}
          aria-label="Κωδικός παιχνιδιού"
          autoFocus
        />
        {error && <div className="text-center text-[15px] font-semibold" style={{ color: 'var(--ui-red)' }}>Δεν βρέθηκε παιχνίδι με αυτόν τον κωδικό.</div>}
        <Button variant="primary" block onClick={() => handleJoin()} disabled={!code.trim() || loading}>Σύνδεση</Button>
      </Card>
      {!showScanner ? (
        <Button block onClick={() => setShowScanner(true)}>📷 Σκανάρισμα QR</Button>
      ) : (
        <Card>
          <QRScanner
            label="Σκάναρε το QR του Tablet"
            onScan={(text) => {
              const parsed = parseCodeFromScan(text);
              setCode(parsed);
              handleJoin(parsed);
            }}
          />
          <Button variant="ghost" block onClick={() => setShowScanner(false)}>Άκυρο</Button>
        </Card>
      )}
    </Page>
  );
}
