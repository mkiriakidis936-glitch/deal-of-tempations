import React, { useState } from 'react';
import AdminContent from '@/components/admin/AdminContent';
import AdminBoardSquares from '@/components/admin/AdminBoardSquares';
import AdminCards from '@/components/admin/AdminCards';
import AdminModes from '@/components/admin/AdminModes';
import AdminModeBuilder from '@/components/admin/AdminModeBuilder';
import { repairSanitizedContent } from '@/lib/repairContent';
import { NEW_MODES } from '@/data/modes/modeRegistry';

// Ανά mode: κάθε καρτέλα δείχνει ΜΟΝΟ τις κάρτες και τα κείμενα του συγκεκριμένου mode.
const SUB_TABS = [
  { id: 'classic', label: '🎲 Classic' },
  { id: 'arrest_heist', label: '🚨 Arrest & Heist' },
  ...NEW_MODES.map((mode) => ({ id: mode.id, label: `${mode.icon} ${mode.name}`, digital: true })),
  { id: 'special', label: '🎭 Special & Bomb' },
  { id: 'builder', label: '🛠️ Κατασκευαστής modes' },
  { id: 'all', label: '📚 Όλο το περιεχόμενο' },
];
const CLASSIC_PARTS = [
  { id: 'content', label: 'Κείμενα & κανόνες' },
  { id: 'board', label: 'Κουτιά 1–24' },
  { id: 'cards', label: 'Κάρτες' },
];

export default function AdminContentHub() {
  const [sub, setSub] = useState('classic');
  const [classicPart, setClassicPart] = useState('content');
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
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Mode">
        {SUB_TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={sub === t.id} onClick={() => setSub(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold ${sub === t.id ? 'bg-white text-black' : 'bg-[#1C1C1E] text-white/80'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'classic' && (
        <>
          <div className="inline-flex rounded-xl bg-[#1C1C1E] p-1" role="tablist" aria-label="Classic">
            {CLASSIC_PARTS.map((part) => (
              <button key={part.id} type="button" role="tab" aria-selected={classicPart === part.id} onClick={() => setClassicPart(part.id)}
                className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold ${classicPart === part.id ? 'bg-[#3A3A3C] text-white' : 'text-white/60'}`}>{part.label}</button>
            ))}
          </div>
          {classicPart === 'content' && <AdminContent key="classic" modeFilter="classic" />}
          {classicPart === 'board' && <AdminBoardSquares />}
          {classicPart === 'cards' && <AdminCards />}
        </>
      )}
      {sub === 'arrest_heist' && <AdminContent key="arrest_heist" modeFilter="arrest_heist" />}
      {sub === 'special' && <AdminContent key="special" modeFilter="special" />}
      {SUB_TABS.find((t) => t.id === sub)?.digital && <AdminModes key={sub} modeId={sub} />}
      {sub === 'builder' && <AdminModeBuilder />}
      {sub === 'all' && <AdminContent />}
    </div>
  );
}