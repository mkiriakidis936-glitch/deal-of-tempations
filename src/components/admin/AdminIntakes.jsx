import React, { useState, useEffect, useCallback } from 'react';
import { base44, request } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { GAME_MODES } from '@/data/gameConfig';
import PajamaIntakeList from '@/components/admin/PajamaIntakeList';

const SHOE_LABELS = { boots: '👢 Μπότες', sneakers: '👟 Sneakers', sandals: '👡 Πέδιλα', barefoot: '🦶 Ξυπόλυτη' };
const INTENSITY_LABELS = { soft: '🟢 Soft', medium: '🟡 Medium', hardcore: '🔴 Hardcore' };
const NAIL_LABELS = { red: '🔴 Κόκκινο', pink: '🩷 Ροζ', white: '⚪ Άσπρο', black: '⚫ Μαύρο', nude: '🤎 Nude', french: '💅 Γαλλικό', blue: '🔵 Γαλάζιο', purple: '🟣 Μωβ', green: '🟢 Πράσινο', orange: '🟠 Πορτοκαλί', gold: '✨ Χρυσό', silver: '🤍 Ασημί', none: '⭕ Χωρίς' };
const COMFORT_LABELS = { comfortTruth: '💬 Αλήθειες', comfortDare: '🔥 Θάρρη', comfortTickle: '🍃 Αύρα', comfortBondage: '🌙 Σκοτάδι', comfortDrinking: '🍹 Ποτό' };
const ACCOMMODATION_LABELS = { house: '🏠 Μένει', oneday: '🕐 Μία μέρα' };
const MODE_NAMES = Object.fromEntries(GAME_MODES.map((mode) => [mode.id, mode.name]));

export default function AdminIntakes() {
  const [intakes, setIntakes] = useState([]);
  const [bachIntakes, setBachIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subtab, setSubtab] = useState('players');
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [playerRes, bachRes] = await Promise.all([
        base44.entities.PlayerIntake.filter({}, { sort: '-created_date', limit: 100 }),
        base44.entities.BacheloretteIntake.filter({}, { sort: '-created_date', limit: 50 }),
      ]);
      setIntakes(playerRes.items || []);
      setBachIntakes(bachRes.items || []);
    } catch (e) {
      console.error('Intake load error', e);
      setMsg({ ok: false, text: e.message || 'Δεν φορτώθηκαν τα ερωτηματολόγια.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(item) {
    try {
      await request('POST', '/api/entities/intake-approvals/PlayerIntake/' + item.id, {});
      setIntakes((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, approved: true, approvalStatus: 'approved' } : entry));
      setMsg({ ok: true, text: 'Το προφίλ της ' + item.name + ' εγκρίθηκε και είναι διαθέσιμο στο Setup.' });
    } catch (e) { setMsg({ ok: false, text: e.message || 'Η έγκριση απέτυχε.' }); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Να διαγραφεί η αίτηση και οι συνδεδεμένες επιβεβαιώσεις συμμετοχής;')) return;
    try {
      await request('DELETE', `/api/entities/player-intakes/${id}`);
      setIntakes((prev) => prev.filter((i) => i.id !== id));
      setMsg({ ok: true, text: 'Το ερωτηματολόγιο διαγράφηκε.' });
    } catch (e) { console.error('Delete error', e); setMsg({ ok: false, text: e.message || 'Η διαγραφή απέτυχε.' }); }
  }

  async function handleDeleteBach(id) {
    if (!window.confirm('Να διαγραφεί οριστικά το Bachelorette intake;')) return;
    try {
      await base44.entities.BacheloretteIntake.delete(id);
      setBachIntakes((prev) => prev.filter((i) => i.id !== id));
      setMsg({ ok: true, text: 'Το intake διαγράφηκε.' });
    } catch (e) { console.error('Delete error', e); setMsg({ ok: false, text: e.message || 'Η διαγραφή απέτυχε.' }); }
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
      {msg && <ComicPanel className={msg.ok ? 'bg-tarot-forest' : 'bg-tarot-crimson'}><div className="text-sm font-bold">{msg.text}</div></ComicPanel>}

      {/* Compact counter strip */}
      <ComicPanel className="bg-primary/20 p-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-heading text-lg">📝 {intakes.length} παίκτριες · {bachIntakes.length} intake</div>
          <ComicButton variant="dark" size="sm" onClick={load}>🔄 ΑΝΑΝΕΩΣΗ</ComicButton>
        </div>
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
                      {(i.gameMode || i.vipGameMode) && <span className="text-xs bg-primary/20 border border-primary/40 px-2 py-0.5 rounded font-bold">{MODE_NAMES[i.gameMode || i.vipGameMode] || i.gameMode || i.vipGameMode}</span>}
                      <span className="text-xs bg-background text-primary px-2 py-0.5 rounded font-bold">{SHOE_LABELS[i.shoeType]}</span>
                      {i.shoeSize && <span className="text-xs bg-tarot-teal/30 px-2 py-0.5 rounded font-bold">🔢 {i.shoeSize}</span>}
                      {i.nailColor && <span className="text-xs bg-tarot-wine/40 px-2 py-0.5 rounded font-bold">💅 {NAIL_LABELS[i.nailColor]}</span>}
                      <span className="text-xs bg-tarot-wine text-foreground px-2 py-0.5 rounded font-bold">{INTENSITY_LABELS[i.intensity]}</span>
                      {i.accommodation && <span className="text-xs bg-tarot-royal text-foreground px-2 py-0.5 rounded font-bold">{ACCOMMODATION_LABELS[i.accommodation]}</span>}
                      {i.safeWordConfirmed && <span className="text-xs bg-tarot-forest text-foreground px-2 py-0.5 rounded font-bold">✓ Λέξη ασφαλείας</span>}
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
                    <details className="text-xs border border-border/40 rounded-lg p-2">
                      <summary className="cursor-pointer font-bold">ΟΛΕΣ ΟΙ ΑΠΑΝΤΗΣΕΙΣ ΤΗΣ ΦΟΡΜΑΣ</summary>
                      <div className="mt-2 space-y-1">{Object.entries(i).filter(([key]) => !['id', 'created_date', 'updated_date'].includes(key)).map(([key, value]) => <div key={key} className="break-words"><strong>{key}:</strong> {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '—')}</div>)}</div>
                    </details>
                    <div className="flex items-center gap-2 flex-wrap"><span className="text-xs font-bold">{i.approved ? '✅ ΕΓΚΕΚΡΙΜΕΝΗ' : '⏳ ΣΕ ΑΝΑΜΟΝΗ ΕΓΚΡΙΣΗΣ'}</span>{!i.approved && <ComicButton variant="green" size="sm" onClick={() => handleApprove(i)}>✅ ΕΓΚΡΙΣΗ & ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΦΙΛ</ComicButton>}</div>
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
                      <span className="font-heading text-lg">⭐ Αρχηγός Άλφα: {i.leaderName}</span>
                      {i.opponentName && <span className="text-xs bg-tarot-teal/30 px-2 py-0.5 rounded font-bold">🛡️ Αρχηγός Βήτα: {i.opponentName}</span>}
                      <span className="text-xs bg-background text-primary px-2 py-0.5 rounded font-bold">Κωδικός: {i.sessionCode}</span>
                      <span className="text-xs bg-tarot-wine text-foreground px-2 py-0.5 rounded font-bold">{INTENSITY_LABELS[i.intensity]}</span>
                      {i.accommodation && <span className="text-xs bg-tarot-royal text-foreground px-2 py-0.5 rounded font-bold">{ACCOMMODATION_LABELS[i.accommodation]}</span>}
                      {i.safeWordConfirmed && <span className="text-xs bg-tarot-forest text-foreground px-2 py-0.5 rounded font-bold">✓ Λέξη ασφαλείας</span>}
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