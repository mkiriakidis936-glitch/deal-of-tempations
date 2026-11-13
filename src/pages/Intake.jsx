import React, { useState, useEffect } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { base44 } from '@/api/base44Client';
import { isIntakeEnabled } from '@/lib/intakeFlag';
import { ART } from '@/data/brandArt';

export default function Intake() {
  const [form, setForm] = useState({
    sessionCode: (new URLSearchParams(window.location.search).get('code') || '').toUpperCase(),
    leaderName: '',
    opponentName: '',
    accommodation: '',
    secrets: '',
    musicPreferences: '',
    dressCode: '',
    favoriteDrink: '',
    boundaries: '',
    funFact: '',
    intensity: 'medium',
    safeWordConfirmed: false,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(null);

  useEffect(() => {
    isIntakeEnabled().then(setEnabled);
  }, []);

  if (enabled === false) {
    return (
      <div className="min-h-screen comic-dots flex items-center justify-center p-4">
        <ComicPanel className="bg-background text-foreground text-center py-12 max-w-lg">
          <div className="text-6xl mb-2">🔒</div>
          <div className="font-heading text-3xl comic-text-stroke">ΜΗ ΔΙΑΘΕΣΙΜΗ</div>
          <div className="text-lg mt-2 text-foreground/80">Η φόρμα δεν είναι ενεργοποιημένη αυτή τη στιγμή.</div>
        </ComicPanel>
      </div>
    );
  }

  if (enabled === null) {
    return (
      <div className="min-h-screen comic-dots flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-border border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function handleSubmit() {
    if (!form.leaderName.trim() || !form.accommodation || !form.safeWordConfirmed || form.sessionCode.trim().length !== 4) return;
    setSaving(true);
    try {
      await base44.entities.BacheloretteIntake.create({ ...form, sessionCode: form.sessionCode.trim().toUpperCase() });
      setSaved(true);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  const progress = Math.round(([form.sessionCode.trim().length === 4, !!form.leaderName.trim(), !!form.accommodation, form.safeWordConfirmed].filter(Boolean).length / 4) * 100);

  if (saved) {
    return (
      <div className="min-h-screen comic-dots flex items-center justify-center p-4">
        <ComicPanel className="bg-tarot-forest text-center py-12 max-w-lg">
          <div className="text-6xl mb-2">✅</div>
          <div className="font-heading text-3xl">ΕΓΙΝΕ!</div>
          <div className="text-lg mt-2">Τα στοιχεία σου καταχωρήθηκαν. Τα δούμε στο πάρτι!</div>
          <div className="text-sm mt-4 comic-panel-sm p-2 bg-card inline-block">Λέξη ασφαλείας: <b>"MAYDAY"</b></div>
        </ComicPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen comic-dots p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        <ComicPanel className="text-center py-5 bg-primary overflow-hidden">
          <img src={ART.photoHeistRoom} alt="Arrest & Heist" className="w-full h-44 sm:h-56 object-cover rounded-xl mb-4" />
          <h1 className="font-heading text-3xl comic-text-stroke">ΕΡΩΤΗΜΑΤΟΛΟΓΙΟ</h1>
          <p className="text-sm">Φόρμα προετοιμασίας — Arrest &amp; Heist Mode</p>
          <div className="mt-4 flex justify-between text-xs font-bold"><span>ΠΡΟΟΔΟΣ ΦΟΡΜΑΣ</span><span>{progress}%</span></div>
          <div className="mt-2 h-2 rounded-full bg-black/20 overflow-hidden"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} /></div>
        </ComicPanel>

        <ComicPanel>
          <div className="space-y-3">
            <div>
              <label className="font-bold text-sm">Κωδικός Παιχνιδιού * (4 χαρακτήρες — φαίνεται στο Tablet)</label>
              <input type="text" maxLength={4} value={form.sessionCode} onChange={(e) => setForm({ ...form, sessionCode: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border-2 border-border rounded-lg bg-secondary mt-1 font-heading text-2xl tracking-widest text-center" placeholder="ABCD" />
            </div>
            <div>
              <label className="font-bold text-sm">Όνομα Αρχηγού (Team Alpha) *</label>
              <input type="text" value={form.leaderName} onChange={(e) => setForm({ ...form, leaderName: e.target.value })} className="w-full px-3 py-2 border-2 border-border rounded-lg bg-secondary mt-1" placeholder="π.χ. Μαρία" />
            </div>
            <div>
              <label className="font-bold text-sm">Όνομα Αντιπάλου Αρχηγού (Team Beta)</label>
              <input type="text" value={form.opponentName} onChange={(e) => setForm({ ...form, opponentName: e.target.value })} className="w-full px-3 py-2 border-2 border-border rounded-lg bg-secondary mt-1" placeholder="π.χ. Ελένη" />
            </div>
            <div>
              <label className="font-bold text-sm">🏠 Θα μείνετε στο σπίτι (Airbnb/Villa) ή είναι για μία μέρα; *</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => setForm({ ...form, accommodation: 'house' })} className={`comic-panel-sm p-2 text-center ${form.accommodation === 'house' ? 'bg-primary/20 ring-2 ring-primary' : 'bg-card'}`}>
                  <div className="text-2xl">🏠</div>
                  <div className="font-heading text-xs">ΝΑΙ — Μένουμε</div>
                </button>
                <button onClick={() => setForm({ ...form, accommodation: 'oneday' })} className={`comic-panel-sm p-2 text-center ${form.accommodation === 'oneday' ? 'bg-primary/20 ring-2 ring-primary' : 'bg-card'}`}>
                  <div className="text-2xl">🕐</div>
                  <div className="font-heading text-xs">ΟΧΙ — Μία μέρα</div>
                </button>
              </div>
            </div>
            <div>
              <label className="font-bold text-sm">Personal Secrets (3-4 πραγματικά 18+ μυστικά για δυναμικές ερωτήσεις)</label>
              <textarea value={form.secrets} onChange={(e) => setForm({ ...form, secrets: e.target.value })} rows={4} className="w-full px-3 py-2 border-2 border-border rounded-lg bg-secondary mt-1" placeholder="π.χ. Έχει φιλήσει τον αδερφό του συντρόφου της..." />
            </div>
            <div>
              <label className="font-bold text-sm">Music Preferences (αγαπημένα tracks για καραόκε)</label>
              <input type="text" value={form.musicPreferences} onChange={(e) => setForm({ ...form, musicPreferences: e.target.value })} className="w-full px-3 py-2 border-2 border-border rounded-lg bg-secondary mt-1" placeholder="π.χ. Beyoncé, Greek pop, 2000s hits" />
            </div>
            <div>
              <label className="font-bold text-sm">👗 Dress Code — Τι σκέφτεστε να φορέσετε; (προαιρετικό)</label>
              <input type="text" value={form.dressCode} onChange={(e) => setForm({ ...form, dressCode: e.target.value })} className="w-full px-3 py-2 border-2 border-border rounded-lg bg-secondary mt-1" placeholder="π.χ. μαύρο φόρεμα, themed, casual" />
            </div>
            <div>
              <label className="font-bold text-sm">🍹 Αγαπημένο Ποτό (προαιρετικό — για drinking challenges)</label>
              <input type="text" value={form.favoriteDrink} onChange={(e) => setForm({ ...form, favoriteDrink: e.target.value })} className="w-full px-3 py-2 border-2 border-border rounded-lg bg-secondary mt-1" placeholder="π.χ. μοχίτο, tequila, κόκκινο κρασί" />
            </div>
            <div>
              <label className="font-bold text-sm">🚫 Όρια / Hard Limits (προαιρετικό — τι δεν θέλεις καθόλου)</label>
              <textarea value={form.boundaries} onChange={(e) => setForm({ ...form, boundaries: e.target.value })} rows={2} className="w-full px-3 py-2 border-2 border-border rounded-lg bg-secondary mt-1" placeholder="π.χ. όχι φωτογραφίες, όχι αλκοόλ σε συγκεκριμένα παιχνίδια..." />
            </div>
            <div>
              <label className="font-bold text-sm">✨ Fun Fact (προαιρετικό — κάτι ενδιαφέρον/αστείο για σένα)</label>
              <input type="text" value={form.funFact} onChange={(e) => setForm({ ...form, funFact: e.target.value })} className="w-full px-3 py-2 border-2 border-border rounded-lg bg-secondary mt-1" placeholder="π.χ. έχω πάει σε 12 χώρες, μιλάω 3 γλώσσες..." />
            </div>
            <div>
              <label className="font-bold text-sm">Ένταση</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[{ id: 'soft', name: 'SOFT' }, { id: 'medium', name: 'MEDIUM' }, { id: 'hardcore', name: 'HARDCORE' }].map((i) => (
                  <button key={i.id} onClick={() => setForm({ ...form, intensity: i.id })} className={`comic-panel-sm p-2 text-center ${form.intensity === i.id ? 'bg-tarot-sienna ring-2 ring-primary' : 'bg-card'}`}>
                    <div className="font-heading text-sm">{i.name}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="comic-panel-sm p-3 bg-destructive/20">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.safeWordConfirmed} onChange={(e) => setForm({ ...form, safeWordConfirmed: e.target.checked })} className="w-5 h-5" />
                <span className="text-sm font-bold">Επιβεβαιώνω ότι γνωρίζω το Safe Word: "MAYDAY"</span>
              </label>
            </div>
          </div>
        </ComicPanel>

        <div className="text-center">
          <ComicButton variant="magenta" size="lg" onClick={handleSubmit} disabled={!form.leaderName.trim() || !form.accommodation || !form.safeWordConfirmed || form.sessionCode.trim().length !== 4 || saving}>
            {saving ? 'ΑΠΟΘΗΚΕΥΣΗ...' : '✅ ΥΠΟΒΟΛΗ'}
          </ComicButton>
        </div>
      </div>
    </div>
  );
}