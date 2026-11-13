import React, { useState } from 'react';
import AdminContent from '@/components/admin/AdminContent';
import AdminBoardSquares from '@/components/admin/AdminBoardSquares';
import AdminCards from '@/components/admin/AdminCards';
import AdminModes from '@/components/admin/AdminModes';
import AdminPajama from '@/components/admin/AdminPajama';

const SUB_TABS = [
  { id: 'classic', label: '🎲 Κλασικό' },
  { id: 'marathon', label: '🏆 Marathon' },
  { id: 'arrest_heist', label: '🚨 Arrest & Heist' },
  { id: 'special', label: '🎭 Special & Bomb' },
  { id: 'board', label: '🗺️ Κουτιά 1–24' },
  { id: 'cards', label: '🃏 Κάρτες' },
  { id: 'pajama', label: '🩴 Pajama Mode' },
  { id: 'new_modes', label: '✨ Νέα Modes' },
];

export default function AdminContentHub() {
  const [sub, setSub] = useState('classic');

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 flex-wrap">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${
              sub === t.id ? 'bg-primary text-tarot-dark border-primary' : 'bg-card border-border/40 hover:bg-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'board' && <AdminBoardSquares />}
      {sub === 'cards' && <AdminCards />}
      {sub === 'pajama' && <AdminPajama />}
      {sub === 'new_modes' && <AdminModes />}
      {['classic', 'marathon', 'arrest_heist', 'special'].includes(sub) && (
        <AdminContent key={sub} modeFilter={sub} />
      )}
    </div>
  );
}