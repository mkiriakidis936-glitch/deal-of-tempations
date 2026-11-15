import React from 'react';

export default function Extra4MobileCard({ state }) {
  const card = state?.extra4?.cards?.activeCard;
  if (!card) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 left-3 right-3 z-[75] mx-auto max-w-md rounded-xl border-2 border-primary bg-black/95 p-4 text-center shadow-2xl">
      <div className="text-3xl">{card.icon || '🎴'}</div>
      <div className="mt-1 font-heading text-lg text-primary">{card.name}</div>
      <div className="mt-2 text-sm text-white">{card.desc || card.text || ''}</div>
    </div>
  );
}
