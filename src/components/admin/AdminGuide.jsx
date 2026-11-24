import React, { useState } from 'react';
import { GAME_MODES } from '@/data/gameConfig';
import { MODE_STEPS, TROUBLESHOOTING, AFTER_NIGHT } from '@/data/modes/guideSteps';
import { MODE_GUIDE, SAFETY_RULES, PLAYER_REMINDERS, SCREENS } from '@/data/modes/modeGuide';

// Admin → Οδηγός: ο πλήρης οδηγός παιχνιδιού, από την προετοιμασία μέχρι το φινάλε.
// Τα κείμενα των modes έρχονται από το ίδιο αρχείο που χρησιμοποιούν Tablet, TV και κινητά.
const PREP_STEPS = [
  { title: 'Επιλογή παιχνιδιού', text: 'Στο Tablet διαλέγεις μία από τις δύο μηχανές παιχνιδιού (Classic, Arrest Heist) ή ένα από τα τέσσερα ψηφιακά modes (Lockdown, Beach Bar, Pajama Heist & Arrest, Villa Takeover).' },
  { title: 'Συμμετοχές', text: 'Οι καλεσμένες συμπληρώνουν τη φόρμα /forms: όνομα, προτιμήσεις, όρια, επαφή, αλκοόλ, αποδοχή κανόνων. Η συμμετοχή ενεργοποιείται μόνο αφού την εγκρίνεις (Admin → Αιτήσεις ή στο Tablet).' },
  { title: 'Δημιουργία παιχνιδιού', text: 'Στο Tablet οι εγκεκριμένες του mode μπαίνουν μόνες τους με τα στοιχεία της φόρμας. Ορίζεις λέξη ασφαλείας και πατάς ΕΝΑΡΞΗ. Η TV δείχνει κωδικό και QR.' },
  { title: 'Σύνδεση κινητών', text: 'Κάθε παίκτρια ανοίγει /play, μπαίνει με τον κωδικό της βραδιάς και διαλέγει το όνομά της.' },
  { title: 'Εισαγωγή', text: 'Στα ψηφιακά modes, μετά το consent check-in η TV δείχνει τους κανόνες και τις φάσεις. Όταν είστε έτοιμες, πατάς «Ξεκινάμε» στο Tablet.' },
  { title: 'Ολοκλήρωση', text: 'Όταν τελειώσουν οι φάσεις ή ο χρόνος, η TV κάνει την τελετή νικήτριας και το Tablet δείχνει κατάταξη και recap. Αρχειοθετείς από το Tablet.' },
];

const Section = ({ title, children }) => (
  <section className="rounded-3xl bg-[#1C1C1E] p-5 text-[#F5F1E8]">
    <h2 className="mb-3 text-lg font-bold">{title}</h2>
    {children}
  </section>
);

export default function AdminGuide() {
  const [open, setOpen] = useState(GAME_MODES[0]?.id);
  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-[#E8C26B]/40 bg-[#17140C] p-5 text-[#F5F1E8]">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#E8C26B]">Deal of Temptation</div>
        <h1 className="mt-1 text-2xl font-bold">Πλήρης οδηγός παιχνιδιού</h1>
        <p className="mt-2 text-sm text-white/75">Διαδραστικό παιχνίδι παρέας ενηλίκων με στοιχεία τηλεπαιχνιδιού, στρατηγικής, μυστηρίου, δοκιμασιών και αποστολών. Οι συμμετέχουσες παίρνουν αποφάσεις, μαζεύουν πόντους και διεκδικούν τη νίκη.</p>
      </section>

      <Section title="Οι τρεις οθόνες">
        <div className="grid gap-3 sm:grid-cols-3">
          {SCREENS.map((s) => <div key={s.title} className="rounded-2xl bg-black/30 p-3"><div className="text-2xl">{s.icon}</div><div className="mt-1 font-bold">{s.title}</div><div className="text-sm text-white/70">{s.text}</div></div>)}
        </div>
      </Section>

      <Section title="Προετοιμασία της βραδιάς">
        <ol className="space-y-2">
          {PREP_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8C26B] text-sm font-black text-black">{i + 1}</span><div><div className="font-bold">{step.title}</div><div className="text-sm text-white/70">{step.text}</div></div></li>
          ))}
        </ol>
      </Section>

      <Section title="Κανόνες ασφαλείας">
        <p className="text-sm text-white/75">Πριν την έναρξη κάθε συμμετέχουσα δηλώνει προσωπικά τι δεν επιθυμεί. Οι επιλογές δεν φαίνονται στις άλλες.</p>
        <div className="mt-2 flex flex-wrap gap-2">{SAFETY_RULES.boundaries.map((b, i) => <span key={b} className="rounded-full bg-white/10 px-3 py-1 text-sm">{i + 1}. {b}</span>)}</div>
        <p className="mt-3 text-sm"><b>PASS</b> — {SAFETY_RULES.pass.replace(/^PASS: /, '')}</p>
        <p className="mt-1 text-sm"><b className="text-[#FF8A80]">ΣΤΟΠ</b> — {SAFETY_RULES.stop.replace(/^ΣΤΟΠ: /, '')}</p>
        <p className="mt-1 text-sm text-white/70">{SAFETY_RULES.adults}</p>
      </Section>

      <Section title="Οι εκδοχές του παιχνιδιού">
        <div className="space-y-2">
          {GAME_MODES.map((mode) => {
            const guide = MODE_GUIDE[mode.id];
            if (!guide) return null;
            const isOpen = open === mode.id;
            return (
              <div key={mode.id} className="overflow-hidden rounded-2xl bg-black/30">
                <button type="button" onClick={() => setOpen(isOpen ? '' : mode.id)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                  <span><span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8C26B]">{mode.kind === 'engine' ? 'Μηχανή παιχνιδιού' : 'Ψηφιακό mode'}</span><span className="text-base font-bold">{mode.icon} {mode.name}</span></span>
                  <span className="text-white/50">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="space-y-3 px-4 pb-4 text-sm">
                    <p className="text-white/80">{guide.tagline}</p>
                    <p><b>Στόχος:</b> {guide.goal}</p>
                    <ol className="space-y-1.5">{guide.phases.map((phase) => <li key={phase.id} className="rounded-xl bg-white/5 p-2"><b>{phase.title}</b><div className="text-white/70">{phase.text}</div>{phase.next && <div className="mt-1 text-[#F7E3A8]">➜ {phase.next}</div>}</li>)}</ol>
                    <p><b>Νίκη:</b> {guide.win}</p>
                    {MODE_STEPS[mode.id] && [['🧳 Τι χρειάζεσαι', 'props'], ['① Πριν ξεκινήσει', 'before'], ['② Κατά τη διάρκεια — τι πατάς', 'during'], ['③ Κλείσιμο', 'end']].map(([label, key]) => (
                      <div key={key}><div className="mb-1 font-bold text-[#E8C26B]">{label}</div><ul className="space-y-1">{MODE_STEPS[mode.id][key].map((line) => <li key={line} className="flex gap-2 text-white/85"><span className="text-[#E8C26B]">•</span><span>{line}</span></li>)}</ul></div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Αν κάτι δεν δουλεύει">
        <div className="space-y-2">{TROUBLESHOOTING.map((item) => <div key={item.q} className="rounded-2xl bg-black/30 p-3"><div className="font-bold">{item.q}</div><div className="text-sm text-white/75">{item.a}</div></div>)}</div>
      </Section>

      <Section title="Μετά τη βραδιά">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-white/80">{AFTER_NIGHT.map((r) => <li key={r}>{r}</li>)}</ol>
      </Section>

      <Section title="Τι πρέπει να θυμάται κάθε παίκτρια">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-white/80">{PLAYER_REMINDERS.map((r) => <li key={r}>{r}</li>)}</ol>
      </Section>
    </div>
  );
}
