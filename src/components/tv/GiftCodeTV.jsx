import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GIFT_CODE } from '@/data/giftVault';

export default function GiftCodeTV({ state }) {
  const gift = state?.pajama?.gift;
  if (!gift?.success) return null;

  const url = `${window.location.origin}/gift-unlock`;
  const phase = state?.pajama?.phase;
  const big = phase === 'gift' || phase === 'morning';

  if (!big) {
    return (
      <div className="fixed bottom-16 left-4 z-40 comic-panel bg-fuchsia-900 p-2 text-center">
        <div className="text-[10px] tracking-[0.25em] font-bold text-fuchsia-200">ΚΩΔΙΚΟΣ ΚΡΥΨΩΝΑ</div>
        <div className="font-heading text-xl tracking-[0.12em] text-yellow-300">{GIFT_CODE}</div>
        <div className="text-[10px] text-fuchsia-200/80">/gift-unlock</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-gradient-to-b from-fuchsia-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-3xl">
        <div className="text-6xl animate-bounce">🎁✨</div>
        <div className="font-heading text-4xl text-fuchsia-100 drop-shadow-[0_0_28px_rgba(255,105,180,0.95)]">
          ΤΟ ΔΩΡΟ ΞΕΚΛΕΙΔΩΘΗΚΕ
        </div>
        <div className="text-lg text-pink-200">
          Σκανάρετε το QR με το κινητό σας και βάλτε τον κωδικό στο Vault.
        </div>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <div className="bg-white p-3 rounded-xl">
            <QRCodeSVG value={url} size={220} level="M" />
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-pink-300">Μυστικός κωδικός</div>
            <div className="font-heading text-5xl tracking-[0.15em] text-yellow-300 drop-shadow-[0_0_26px_rgba(255,215,0,0.9)] animate-pulse mt-2">
              {GIFT_CODE}
            </div>
          </div>
        </div>
        <div className="text-sm text-pink-200/80">
          Η θυσία της βραδιάς πληκτρολογεί τον κωδικό στο κινητό της. Το link: {url}
        </div>
      </div>
    </div>
  );
}