import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import ComicPanel from '@/components/comic/ComicPanel';

export default function SessionQRCode({ sessionCode, size = 200 }) {
  const joinUrl = `${window.location.origin}/play?code=${encodeURIComponent(sessionCode)}`;

  return (
    <ComicPanel className="bg-card text-center">
      <div className="font-heading text-lg mb-1 text-primary">📷 ΣΚΑΝΑΡΕ ΓΙΑ ΕΙΣΟΔΟ</div>
      <div className="text-xs mb-2 font-bold text-foreground/70 font-body">Στόλισε την κάμερα του κινητού σου</div>
      <div className="mx-auto inline-block bg-white p-2 border-2 border-border rounded-lg">
        <QRCodeSVG value={joinUrl} size={size} level="M" />
      </div>
      <div className="mt-2 font-heading text-2xl tracking-widest bg-primary/20 inline-block px-3 py-1 rounded border-2 border-border text-primary">
        {sessionCode}
      </div>
      <div className="text-xs mt-2 text-foreground/60 font-body">Ή πήγαινε στο /play και βάλε τον κωδικό</div>
    </ComicPanel>
  );
}