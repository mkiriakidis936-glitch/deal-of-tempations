import React, { useState } from 'react';
import AdminContent from '@/components/admin/AdminContent';
import AdminBoardSquares from '@/components/admin/AdminBoardSquares';
import AdminCards from '@/components/admin/AdminCards';
import AdminModes from '@/components/admin/AdminModes';
import AdminPajama from '@/components/admin/AdminPajama';
import AdminModeBuilder from '@/components/admin/AdminModeBuilder';
import { repairSanitizedContent } from '@/lib/repairContent';

const SUB_TABS = [
  { id: 'builder', label: '🛠️ Κατασκευαστής modes' },
  { id: 'new_modes', label: '✨ Ψηφιακά Modes' },
  { id: 'classic', label: '🎲 Κλασικό' },
  { id: 'marathon', label: '🏆 Marathon' },
  { id: 'arrest_heist', label: '🚨 Arrest & Heist' },
  { id: 'special', label: '🎭 Special & Bomb' },
  { id: 'board', label: '🗺️ Κουτιά 1–24' },
  { id: 'cards', label: '🃏 Κάρτες' },
  { id: 'pajama', label: '🩴 Pajama Mode' },
  { id: 'all', label: '📚 Όλο το περιεχόμενο' },
];

export default function AdminContentHub() {
  const [sub, setSub] = useState('new_modes');
  const [repairing, setRepairing] = useState(false);
  const [repairMessage, setRepairMessage] = useState('');

  async function repair() {
    if (!window.confirm('Να επανέλθουν τα αρχικά κείμενα σε όσες κάρτες είχαν αντικατασταθεί από «Safe Digital Challenge» / «Προαιρετικό ψηφιακό challenge»; Οι δικές σου αλλαγές δεν επηρεάζονται.')) return;
    setRepairing(true);
    setRepairMessage('');
    try {
      const result = await repairSanitizedContent();
      setRepairMessage(result.total
        ? `Επανήλθαν ${result.total} κάρτες (Κλασικό ${result.classic} · Pajama ${result.pajama} · Modes ${result.modes}).`
        : 'Δεν βρέθηκαν κάρτες με αντικατεστημένο κείμενο.');
    } catch (error) {
      setRepairMessage(error.message || 'Η επαναφορά απέτυχε.');
    } finally {
      setRepairing(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 p-3">
        <button type="button" className="adm-pill" disabled={repairing} onClick={repair}>{repairing ? 'Επαναφορά…' : '↺ Επαναφορά αρχικών κειμένων καρτών'}</button>
        {repairMessage && <span className="text-xs">{repairMessage}</span>}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold ${
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
      {sub === 'builder' && <AdminModeBuilder />}
      {sub === 'all' && <AdminContent />}
      {['classic', 'marathon', 'arrest_heist', 'special'].includes(sub) && (
        <AdminContent key={sub} modeFilter={sub} />
      )}
    </div>
  );
}