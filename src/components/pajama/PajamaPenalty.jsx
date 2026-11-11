import React from 'react';
import PajamaTimer from '@/components/pajama/PajamaTimer';

export default function PajamaPenalty({ penalty, onDone }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 via-purple-950 to-slate-950 text-pink-50 p-4 pb-16">
      <div className="max-w-lg mx-auto space-y-3 pt-6">
        <div className="text-center">
          <div className="text-5xl">⛓️🦶😈</div>
          <div className="font-heading text-2xl text-rose-200 mt-1">ΣΤΑΘΜΟΣ ΑΚΙΝΗΤΟΠΟΙΗΣΗΣ</div>
          <div className="text-sm text-pink-300">
            {penalty.cardTitle || 'Αποτυχία δοκιμασίας'} · -{penalty.points || 1} πόντος
          </div>
          <div className="mt-1 text-sm font-bold text-rose-200">
            Επίπεδο ποινής {(penalty.level || 1)}/3 · {penalty.seconds || 30}″
          </div>
        </div>

        <div className="rounded-xl border-2 border-rose-500/60 bg-rose-950/60 p-4 space-y-2">
          <div className="font-heading text-2xl text-rose-100">{penalty.playerName}</div>
          <div className="text-sm font-bold">{penalty.binding}</div>
          <p className="text-xs text-pink-100/80">
            Δύο εκτελέστριες κάνουν αμείλικτο γαργαλητό στα πέλματα και στα δάχτυλα — η παίκτρια δεν μπορεί να
            προστατευτεί ούτε να τραβήξει τα πόδια της.
          </p>
        </div>

        <PajamaTimer seconds={penalty.seconds || 30} autoStart />

        <button onClick={onDone} className="w-full py-3 rounded-lg font-heading text-lg bg-rose-600 text-white">
          ΟΛΟΚΛΗΡΩΘΗΚΕ — ΕΠΟΜΕΝΗ
        </button>
      </div>
    </div>
  );
}