mport React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { isIntakeEnabled, setIntakeEnabled } from '@/lib/intakeFlag';
import PajamaIntakeList from '@/components/admin/PajamaIntakeList';

const SHOE_LABELS = { boots: '👢 Μπότες', sneakers: '👟 Sneakers', sandals: '👡 Πέδιλα', barefoot: '🦶 Ξυπόλυτη' };
const INTENSITY_LABELS = { soft: '🟢 Soft', medium: '🟡 Medium', hardcore: '🔴 Hardcore' };
const NAIL_LABELS = { red: '🔴 Κόκκινο', pink: '🩷 Ροζ', white: '⚪ Άσπρο', black: '⚫ Μαύρο', nude: '🤎 Nude', french: '💅 Γαλλικό', blue: '🔵 Γαλάζιο', purple: '🟣 Μωβ', green: '🟢 Πράσινο', orange: '🟠 Πορτοκαλί', gold: '✨ Χρυσό', silver: '🤍 Ασημί', none: '⭕ Χωρίς' };
const COMFORT_LABELS = { comfortTruth: '💬 Αλήθειες', comfortDare: '🔥 Θάρρη', comfortTickle: '🍃 Αύρα', comfortBondage: '🌙 Σκοτάδι', comfortDrinking: '🍹 Ποτό' };
const ACCOMMODATION_LABELS = { house: '🏠 Μένει', oneday: '🕐 Μία μέρα' };

export default function AdminIntakes() {
  const [intakes, setIntakes] = useState([]);
  const [bachIntakes, setBachIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subtab, setSubtab] = useState('players');
  const [bachEnabled, setBachEnabled] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [playerRes, bachRes, enabled] = await Promise.all([
        base44.entities.PlayerIntake.filter({}, { sort: '-created_date', limit: 100 }),
        base44.entities.BacheloretteIntake.filter({}, { sort: '-created_date', limit: 50 }),
        isIntakeEnabled(),
      ]);
      setIntakes(playerRes.items || []);
      setBachIntakes(bachRes.items || []);
      setBachEnabled(enabled);
    } catch (e) {
      console.error('Intake load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleBach() {
    const next = !bachEnabled;
    setBachEnabled(next);
    await setIntakeEnabled(next);
  }

  async function handleDelete(id) {
    try {
      await base44.entities.PlayerIntake.delete(id);
      setIntakes((prev) => prev.filter((i) => i.id !== id));
    } catch (e) { console.error('Delete error', e); }
  }

  async function handleDeleteBach(id) {
    try {
      await base44.entities.BacheloretteIntake.delete(id);
      setBachIntakes((prev) => prev.filter((i) => i.id !== id));
    } catch (e) { console.error('Delete error', e); }
  }

  // Compact summary
  const nailCounts = {};
  intakes.forEach((i) => { if (i.nailColor) nailCounts[i.nailColor] = (nailCounts[i.nailColor] || 0) + 1; });
  const shoeSizes = intakes.map((i) => i.shoeSize).filter(Boolean);
  const shoeMin = shoeSizes.length ? Math.min(...shoeSizes) : null;
  const shoeMax = shoeSizes.length ? Math.max(...shoeSizes) : null;
  const shoeCounts = {};
  intakes.forEach((i) => { if (i.shoeType) shoeCounts[i.shoeType] = (shoeCounts[i.shoeType] || 0) + 1; });

  if (loading) {
    return <div className="text-center font-heading text-xl comic-pulse">ΦΟΡΤΩΣΗ...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Compact counter strip */}
      <ComicPanel className="bg-primary/20 p-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-heading text-lg">📝 {intakes.length} παίκτριες · {bachIntakes.length} intake</div>
          <ComicButton variant="dark" size="sm" onClick={load}>🔄 ΑΝΑΝΕΩΣΗ</ComicButton>
        </div>
        <button
          onClick={toggleBach}
          disabled={bachEnabled === null}
          className={`comic-panel-sm w-full mt-2 p-2 flex items-center justify-between transition-all ${bachEnabled ? 'bg-tarot-forest' : 'bg-secondary'} disabled:opacity-50`}
        >
          <span className="font-heading text-sm">📝 A&H INTAKE ΦΟΡΜΑ</span>
          <span className="font-bold text-sm">{bachEnabled === null ? '…' : bachEnabled ? '🟢 ΕΝΕΡΓΟΠΟΙΗΜΕΝΟ' : '🔴 ΑΠΕΝΕΡΓΟΠΟΙΗΜΕΝΟ'}</span>
        </button>
        {intakes.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-bold">
            <span>👟 Παπούτσια: {Object.entries(shoeCounts).map(([k, v]) => `${SHOE_LABELS[k]?.split(' ')[0] || k}×${v}`).join(' ')}</span>
            {shoeMin && <span>🔢 Νούμερα: {shoeMin}–{shoeMax}</span>}
            {Object.keys(nailCounts).length > 0 && (
              <span>💅 Νύχια: {Object.entries(nailCounts).map(([k, v]) => `${NAIL_LABELS[k]?.split(' ')[0] || k}×${v}`).join(' ')}</span>
            )}
          </div>
        )}
      </ComicPanel>

      {/* Sub-tab toggle */}
      <div className="flex gap-2">
        <ComicButton variant={subtab === 'players' ? 'magenta' : 'white'} size="sm" onClick={() => setSubtab('players')}>
          👥 Παίκτριες ({intakes.length})
        </ComicButton>
        <ComicButton variant={subtab === 'intake' ? 'magenta' : 'white'} size="sm" onClick={() => setSubtab('intake')}>
          📝 Arrest & Heist ({bachIntakes.length})
        </ComicButton>
        <ComicButton variant={subtab === 'pajama' ? 'magenta' : 'white'} size="sm" onClick={() => setSubtab('pajama')}>
          🩴 Pajama Party
        </ComicButton>
      </div>

      {/* Players sub-tab */}
      {subtab === 'players' && (
        <>
          {intakes.length === 0 ? (
            <ComicPanel className="bg-card text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <div className="font-heading text-lg">Δεν υπάρχουν ερωτηματολόγια ακόμα</div>
              <div className="text-xs mt-2 text-foreground/60">
                Στείλε το link: {window.location.origin}/welcome
              </div>
            </ComicPanel>
          ) : (
            intakes.map((i) => (
              <ComicPanel key={i.id} className="bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading text-lg">{i.name}</span>
                      <span className="text-xs bg-background text-primary px-2 py-0.5 rounded font-bold">{SHOE_LABELS[i.shoeType]}</span>
                      {i.shoeSize && <span className="text-xs bg-tarot-teal/30 px-2 py-0.5 rounded font-bold">🔢 {i.shoeSize}</span>}
                      {i.nailColor && <span className="text-xs bg-tarot-wine/40 px-2 py-0.5 rounded font-bold">💅 {NAIL_LABELS[i.nailColor]}</span>}
                      <span className="text-xs bg-tarot-wine text-foreground px-2 py-0.5 rounded font-bold">{INTENSITY_LABELS[i.intensity]}</span>
                      {i.accommodation && <span className="text-xs bg-tarot-royal text-foreground px-2 py-0.5 rounded font-bold">{ACCOMMODATION_LABELS[i.accommodation]}</span>}
                      {i.safeWordConfirmed && <span className="text-xs bg-tarot-forest text-foreground px-2 py-0.5 rounded font-bold">✓ Safe Word</span>}
                    </div>
                    <div className="flex gap-3 flex-wrap text-xs">
                      {Object.entries(COMFORT_LABELS).map(([key, label]) => (
                        <span key={key} className="font-bold">
                          {label}: <span className="text-tarot-wine">{'●'.repeat(i[key] || 0)}{'○'.repeat(5 - (i[key] || 0))}</span>
                        </span>
                      ))}
                    </div>
                    {i.secrets && <div className="text-xs bg-secondary p-1.5 rounded border border-border/20">🤫 {i.secrets}</div>}
                    {i.musicPreferences && <div className="text-xs">🎵 {i.musicPreferences}</div>}
                    {i.allergies && <div className="text-xs bg-destructive/30 p-1.5 rounded border border-border/20">⚠️ {i.allergies}</div>}
                    {i.dressCode && <div className="text-xs bg-tarot-sienna/30 p-1.5 rounded border border-border/20">👗 {i.dressCode}</div>}
                  </div>
                  <ComicButton variant="red" size="sm" onClick={() => handleDelete(i.id)}>🗑️</ComicButton>
                </div>
              </ComicPanel>
            ))
          )}
        </>
      )}

      {/* A&H Intake sub-tab */}
      {subtab === 'intake' && (
        <>
          {bachIntakes.length === 0 ? (
            <ComicPanel className="bg-card text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <div className="font-heading text-lg">Δεν υπάρχουν Arrest & Heist intakes ακόμα</div>
              <div className="text-xs mt-2 text-foreground/60">
                Στείλε το link: {window.location.origin}/intake
              </div>
            </ComicPanel>
          ) : (
            bachIntakes.map((i) => (
              <ComicPanel key={i.id} className="bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading text-lg">⭐ Αρχηγός Alpha: {i.leaderName}</span>
                      {i.opponentName && <span className="text-xs bg-tarot-teal/30 px-2 py-0.5 rounded font-bold">🛡️ Αρχηγός Beta: {i.opponentName}</span>}
                      <span className="text-xs bg-background text-primary px-2 py-0.5 rounded font-bold">Κωδικός: {i.sessionCode}</span>
                      <span className="text-xs bg-tarot-wine text-foreground px-2 py-0.5 rounded font-bold">{INTENSITY_LABELS[i.intensity]}</span>
                      {i.accommodation && <span className="text-xs bg-tarot-royal text-foreground px-2 py-0.5 rounded font-bold">{ACCOMMODATION_LABELS[i.accommodation]}</span>}
                      {i.safeWordConfirmed && <span className="text-xs bg-tarot-forest text-foreground px-2 py-0.5 rounded font-bold">✓ Safe Word</span>}
                    </div>
                    {i.secrets && <div className="text-xs bg-secondary p-1.5 rounded border border-border/20">🤫 {i.secrets}</div>}
                    {i.musicPreferences && <div className="text-xs">🎵 {i.musicPreferences}</div>}
                    {i.dressCode && <div className="text-xs bg-tarot-sienna/30 p-1.5 rounded border border-border/20">👗 {i.dressCode}</div>}
                    {i.favoriteDrink && <div className="text-xs">🍹 {i.favoriteDrink}</div>}
                    {i.boundaries && <div className="text-xs bg-destructive/30 p-1.5 rounded border border-border/20">🚫 {i.boundaries}</div>}
                    {i.funFact && <div className="text-xs bg-tarot-royal/30 p-1.5 rounded border border-border/20">✨ {i.funFact}</div>}
                  </div>
                  <ComicButton variant="red" size="sm" onClick={() => handleDeleteBach(i.id)}>🗑️</ComicButton>
                </div>
              </ComicPanel>
            ))
          )}
        </>
      )}

      {/* Pajama Party sub-tab */}
      {subtab === 'pajama' && <PajamaIntakeList />}
    </div>
  );
}