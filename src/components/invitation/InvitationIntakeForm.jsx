import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { Image } from '@/components/ui/image';
import { ARREST_HEIST_INTENSITY } from '@/data/gameConfig';
import { ART } from '@/data/brandArt';
import CustomFormQuestions from '@/components/forms/CustomFormQuestions';

const LOGO_URL = ART.logo;

const SHOE_OPTIONS = [
  { id: 'boots', label: 'Μπότες / Ψηλά Τακούνια', icon: '👢' },
  { id: 'sneakers', label: 'Αθλητικά / Sneakers', icon: '👟' },
  { id: 'sandals', label: 'Πέδιλα / Σανδάλια', icon: '👡' },
  { id: 'barefoot', label: 'Ξυπόλυτη', icon: '🦶' },
];

const NAIL_COLORS = [
  { id: 'red', label: 'Κόκκινο', icon: '🔴' },
  { id: 'pink', label: 'Ροζ', icon: '🩷' },
  { id: 'white', label: 'Άσπρο', icon: '⚪' },
  { id: 'black', label: 'Μαύρο', icon: '⚫' },
  { id: 'nude', label: 'Nude/Φυσικό', icon: '🤎' },
  { id: 'french', label: 'Γαλλικό', icon: '💅' },
  { id: 'blue', label: 'Γαλάζιο', icon: '🔵' },
  { id: 'purple', label: 'Μωβ', icon: '🟣' },
  { id: 'green', label: 'Πράσινο', icon: '🟢' },
  { id: 'orange', label: 'Πορτοκαλί', icon: '🟠' },
  { id: 'gold', label: 'Χρυσό', icon: '✨' },
  { id: 'silver', label: 'Ασημί', icon: '🤍' },
  { id: 'none', label: 'Χωρίς', icon: '⭕' },
];

const COMFORT_FIELDS = [
  { key: 'comfortTruth', label: 'Αλήθειες', icon: '💬' },
  { key: 'comfortDare', label: 'Θάρρη', icon: '🔥' },
  { key: 'comfortTickle', label: 'Αύρα', icon: '🍃' },
  { key: 'comfortBondage', label: 'Σκοτάδι', icon: '🌙' },
  { key: 'comfortDrinking', label: 'Ποτό', icon: '🍹' },
];

const INITIAL_FORM = {
  name: '',
  accommodation: '',
  shoeType: 'sneakers',
  shoeSize: '',
  nailColor: '',
  intensity: 'medium',
  comfortTruth: 3,
  comfortDare: 3,
  comfortTickle: 3,
  comfortBondage: 3,
  comfortDrinking: 3,
  secrets: '',
  musicPreferences: '',
  allergies: '',
  dressCode: '',
  safeWordConfirmed: false,
  customAnswers: {},
};

export default function InvitationIntakeForm({ onDone }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [customQuestionsValid, setCustomQuestionsValid] = useState(true);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      await base44.entities.PlayerIntake.create({ ...form, customAnswers: form.customAnswers });
      await base44.entities.InvitationRSVP.create({ name: form.name.trim(), confirmed: true });
      onDone();
    } catch (e) {
      console.error('Intake submit error', e);
      alert('Σφάλμα αποθήκευσης. Δοκίμασε ξανά.');
    } finally {
      setSaving(false);
    }
  }

  const canNext = step === 0 ? form.name.trim().length > 0 && form.accommodation : step === 3 ? form.safeWordConfirmed && customQuestionsValid : true;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <div className="max-w-md mx-auto space-y-3 p-4">
        <ComicPanel className="bg-background text-center py-4 border-primary">
          <div className="mb-2 mx-auto" style={{ width: 80, height: 80 }}>
            <Image src={LOGO_URL} fittingType="fill" className="rounded-full border-2 border-primary/40" />
          </div>
          <div className="font-heading text-2xl comic-text-stroke leading-none text-primary">ΠΡΟΣΚΛΗΣΗ ΣΥΜΜΕΤΟΧΗΣ</div>
          <div className="text-xs font-bold mt-2 text-primary/80 font-body">Συμπλήρωσε τα παρακάτω. Όλα θα αποκαλυφθούν επιτόπου.</div>
        </ComicPanel>

        <div className="flex gap-1">
          {[0, 1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-2 rounded-full border border-border ${s <= step ? 'bg-primary' : 'bg-secondary'}`} />
          ))}
        </div>

        {step === 0 && (
          <ComicPanel className="bg-card space-y-3">
            <div className="font-heading text-xl text-primary">📋 ΣΤΟΙΧΕΙΑ</div>
            <div>
              <label className="text-sm font-bold block mb-1 text-foreground">Όνομα / Ψευδώνυμο *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="π.χ. Μαρία, Κόκκινη, κλπ"
                className="w-full border-2 border-border rounded-lg px-3 py-2 bg-secondary text-foreground font-bold font-body"
              />
            </div>
            <div>
              <label className="text-sm font-bold block mb-2 text-foreground">🏠 Θα μείνετε στο σπίτι (Airbnb/Villa) ή είναι για μία μέρα; *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => update('accommodation', 'house')}
                  className={`comic-panel-sm p-3 flex flex-col items-center gap-1 transition-all ${
                    form.accommodation === 'house' ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'
                  }`}
                >
                  <span className="text-3xl">🏠</span>
                  <span className="text-xs font-bold text-center text-foreground">ΝΑΙ — Μένουμε<br />(Airbnb / Villa)</span>
                </button>
                <button
                  onClick={() => update('accommodation', 'oneday')}
                  className={`comic-panel-sm p-3 flex flex-col items-center gap-1 transition-all ${
                    form.accommodation === 'oneday' ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'
                  }`}
                >
                  <span className="text-3xl">🕐</span>
                  <span className="text-xs font-bold text-center text-foreground">ΟΧΙ — Μία μέρα<br />(επιστροφή ίδια μέρα)</span>
                </button>
              </div>
              <div className="text-xs text-foreground/50 mt-1 font-body">Επηρεάζει τις επιλογές του παιχνιδιού!</div>
            </div>
            <div>
              <label className="text-sm font-bold block mb-2 text-foreground">👟 Τι παπούτσια θα φορέσεις;</label>
              <div className="grid grid-cols-2 gap-2">
                {SHOE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => update('shoeType', s.id)}
                    className={`comic-panel-sm p-3 flex flex-col items-center gap-1 transition-all ${
                      form.shoeType === s.id ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'
                    }`}
                  >
                    <span className="text-3xl">{s.icon}</span>
                    <span className="text-xs font-bold text-center text-foreground">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold block mb-1 text-foreground">🔢 Νούμερο παπουτσιού</label>
              <input
                type="number"
                min={35}
                max={46}
                value={form.shoeSize}
                onChange={(e) => update('shoeSize', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="π.χ. 38"
                className="w-full border-2 border-border rounded-lg px-3 py-2 bg-secondary text-foreground font-bold font-body"
              />
              <div className="text-xs text-foreground/50 mt-1 font-body">Για προετοιμασία εξοπλισμού.</div>
            </div>
            <div>
              <label className="text-sm font-bold block mb-2 text-foreground">💅 Χρώμα βερνικιού (πόδια)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {NAIL_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => update('nailColor', c.id)}
                    className={`comic-panel-sm p-2 flex flex-col items-center gap-0.5 transition-all ${
                      form.nailColor === c.id ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'
                    }`}
                  >
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-[10px] font-bold text-center leading-tight text-foreground">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </ComicPanel>
        )}

        {step === 1 && (
          <ComicPanel className="bg-card space-y-3">
            <div className="font-heading text-xl text-primary">🔥 ΕΝΤΑΣΗ & ΟΡΙΑ</div>
            <div>
              <label className="text-sm font-bold block mb-2 text-foreground">Επίπεδο έντασης</label>
              <div className="grid grid-cols-3 gap-2">
                {ARREST_HEIST_INTENSITY.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => update('intensity', i.id)}
                    className={`comic-panel-sm p-2 flex flex-col items-center gap-1 transition-all ${
                      form.intensity === i.id ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'
                    }`}
                  >
                    <span className="text-2xl">{i.icon}</span>
                    <span className="text-xs font-bold text-foreground">{i.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Πόσο άνετα/ή είσαι με τα παρακάτω; (1 = καθόλου, 5 = απόλυτα)</label>
              {COMFORT_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-2">
                  <span className="text-xl w-8">{f.icon}</span>
                  <span className="text-sm font-bold w-20 text-foreground">{f.label}</span>
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => update(f.key, n)}
                        className={`flex-1 h-8 rounded border border-border font-bold text-sm transition-all ${
                          form[f.key] >= n ? 'bg-tarot-wine text-foreground' : 'bg-secondary text-foreground/50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ComicPanel>
        )}

        {step === 2 && (
          <ComicPanel className="bg-card space-y-3">
            <div className="font-heading text-xl text-primary">✨ ΠΡΟΑΙΡΕΤΙΚΑ</div>
            <div>
              <label className="text-sm font-bold block mb-1 text-foreground">🤫 Μυστικά</label>
              <textarea
                value={form.secrets}
                onChange={(e) => update('secrets', e.target.value)}
                placeholder="Στοιχεία που θέλεις να γνωρίζουμε..."
                className="w-full border-2 border-border rounded-lg px-3 py-2 bg-secondary text-foreground text-sm h-20 font-body"
              />
            </div>
            <div>
              <label className="text-sm font-bold block mb-1 text-foreground">🎵 Μουσικές προτιμήσεις</label>
              <textarea
                value={form.musicPreferences}
                onChange={(e) => update('musicPreferences', e.target.value)}
                placeholder="Αγαπημένα τραγούδια / είδη..."
                className="w-full border-2 border-border rounded-lg px-3 py-2 bg-secondary text-foreground text-sm h-20 font-body"
              />
            </div>
            <div>
              <label className="text-sm font-bold block mb-1 text-foreground">⚠️ Αλλεργίες / Υγεία</label>
              <textarea
                value={form.allergies}
                onChange={(e) => update('allergies', e.target.value)}
                placeholder="Οτιδήποτε πρέπει να ξέρουμε..."
                className="w-full border-2 border-border rounded-lg px-3 py-2 bg-secondary text-foreground text-sm h-20 font-body"
              />
            </div>
            <div>
              <label className="text-sm font-bold block mb-1 text-foreground">👗 Dress Code — Τι σκέφτεσαι να φορέσεις;</label>
              <textarea
                value={form.dressCode}
                onChange={(e) => update('dressCode', e.target.value)}
                placeholder="π.χ. μαύρο φόρεμα, casual, κάτι θεαματικό..."
                className="w-full border-2 border-border rounded-lg px-3 py-2 bg-secondary text-foreground text-sm h-20 font-body"
              />
              <div className="text-xs text-foreground/50 mt-1 font-body">Προαιρετικό — όχι υποχρεωτικό.</div>
            </div>
          </ComicPanel>
        )}

        {step === 3 && (
          <ComicPanel className="bg-card space-y-3">
            <div className="font-heading text-xl text-primary">🔒 ΚΩΔΙΚΟΣ ΑΣΦΑΛΕΙΑΣ</div>
            <div className="text-sm text-foreground font-body">
              Υπάρχει ένας <strong className="text-primary">κωδικός ασφαλείας</strong>. Εάν χρησιμοποιηθεί, τα πάντα σταματούν αμέσως.
            </div>
            <CustomFormQuestions formType="invitation" value={form.customAnswers} onChange={(value) => update('customAnswers', value)} onValidityChange={setCustomQuestionsValid} className="space-y-3" />
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.safeWordConfirmed}
                onChange={(e) => update('safeWordConfirmed', e.target.checked)}
                className="w-5 h-5 mt-0.5 border-2 border-border accent-primary"
              />
              <span className="text-sm font-bold text-foreground">
                Κατανοώ και συμφωνώ να συμμετάσχω υπεύθυνα. (18+)
              </span>
            </label>
            <ComicButton
              variant="green"
              size="lg"
              onClick={handleSubmit}
              disabled={!canNext || saving}
              className="w-full"
            >
              {saving ? 'ΑΠΟΘΗΚΕΥΣΗ...' : '✅ ΥΠΟΒΟΛΗ'}
            </ComicButton>
          </ComicPanel>
        )}

        {step < 3 && (
          <div className="flex gap-2">
            {step > 0 && (
              <ComicButton variant="white" size="md" onClick={() => setStep((s) => s - 1)} className="flex-1">
                ← ΠΙΣΩ
              </ComicButton>
            )}
            <ComicButton
              variant="magenta"
              size="md"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="flex-1"
            >
              ΕΠΟΜΕΝΟ →
            </ComicButton>
          </div>
        )}
        {step === 3 && (
          <ComicButton variant="white" size="sm" onClick={() => setStep(2)} className="w-full">
            ← ΠΙΣΩ
          </ComicButton>
        )}
      </div>
    </div>
  );
}