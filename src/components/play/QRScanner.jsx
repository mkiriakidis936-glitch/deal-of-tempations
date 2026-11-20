import React, { useState, useRef, useEffect } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, label = '📷 QR SCANNER' }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const containerId = 'qr-reader-container';

  async function startScan() {
    setError(null);
    setScanning(true);
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          onScan?.(decodedText);
          stopScan();
        },
        () => {}
      );
    } catch (e) {
      setError('Αποτυχία πρόσβασης στην κάμερα. Ελέγξε τα permissions.');
      setScanning(false);
    }
  }

  async function stopScan() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    setScanning(false);
  }

  useEffect(() => {
    return () => { stopScan(); };
  }, []);

  return (
    <ComicPanel className="bg-card">
      <div className="font-heading text-sm mb-2 text-primary">{label}</div>
      {!scanning && !error && (
        <ComicButton variant="cyan" size="sm" onClick={startScan} className="w-full">
          📷 ΑΝΟΙΓΜΑ ΚΑΜΕΡΑΣ
        </ComicButton>
      )}
      {error && (
        <div className="text-xs text-destructive font-bold mb-2 font-body">{error}</div>
      )}
      {scanning && (
        <>
          <div id={containerId} className="w-full max-w-xs mx-auto rounded-lg overflow-hidden border-2 border-border" />
          <ComicButton variant="red" size="sm" onClick={stopScan} className="w-full mt-2">
            ⏹ ΣΤΟΠ
          </ComicButton>
        </>
      )}
    </ComicPanel>
  );
}