import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import ContentCrudTab from '@/components/admin/content/ContentCrudTab';
import { CONTENT_CATEGORIES } from '@/components/admin/content/contentSchemas';
import { reseedGameContent } from '@/lib/reseedContent';

// Δομικές/διαμορφωτικές κατηγορίες — όχι κάρτες περιεχομένου.
const STRUCTURAL_IDS = new Set([
  'board',
  'square_types',
  'penalties',
  'footwear_levels',
  'hidden_roles',
  'toenail_perks',
  'game_modes',
  'intensity_levels',
  'marathon_stages',
  'arrest_heist_ladder',
  'arrest_heist_intensity',
]);

const CARD_CATEGORIES = CONTENT_CATEGORIES.filter((c) => !STRUCTURAL_IDS.has(c.id));

export default function AdminCards() {
  const [tab, setTab] = useState(CARD_CATEGORIES[0].id);
  const [reseeding, setReseeding] = useState(false);
  const [reseedMsg, setReseedMsg] = useState('');
  const active = CARD_CATEGORIES.find((c) => c.id === tab);

  async function handleReseed() {
    if (!confirm('Επανασπορά: όλο το τρέχον περιεχόμενο θα διαγραφεί και θα ξαναφορτωθεί από τα static αρχεία. Σίγουρος;')) return;
    setReseeding(true);
    setReseedMsg('');
    try {
      const n = await reseedGameContent();
      setReseedMsg(`✓ Επανασπάρθηκαν ${n} εγγραφές.`);
    } catch (e) {
      setReseedMsg('✗ Σφάλμα: ' + (e.message || 'αποτυχία'));
    } finally {
      setReseeding(false);
    }
  }

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-tarot-wine/40">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="font-heading text-xl comic-text-stroke">🃏 ΔΙΑΧΕΙΡΙΣΗ ΚΑΡΤΩΝ</div>
            <div className="text-xs font-bold mt-1">
              Προσθήκη, επεξεργασία και διαγραφή για κάθε κατηγορία καρτών (Αλήθειες, Πάντα, Warrant, Glitch, κλπ).
            </div>
          </div>
          <ComicButton variant="red" size="sm" onClick={handleReseed} disabled={reseeding}>
            {reseeding ? '… ΕΠΑΝΑΣΠΟΡΑ' : '🔄 ΕΠΑΝΑΣΠΟΡΑ ΑΡΧΕΙΩΝ'}
          </ComicButton>
        </div>
        {reseedMsg && <div className="text-xs font-bold mt-2">{reseedMsg}</div>}
      </ComicPanel>

      <div className="flex gap-1 flex-wrap">
        {CARD_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setTab(c.id)}
            className={`text-xs px-2 py-1 rounded border-2 border-border font-bold ${tab === c.id ? 'bg-tarot-wine text-foreground' : 'bg-card'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ComicPanel className="bg-card">
        {active && <ContentCrudTab category={active} />}
      </ComicPanel>
    </div>
  );
}