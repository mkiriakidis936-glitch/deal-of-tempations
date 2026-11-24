import React from 'react';
import SiteFaq from '@/components/site/SiteFaq';

// Περιεχόμενο αρχικής σελίδας: πρόγραμμα ανά εμπειρία + γενικές ερωτήσεις.
// Οι διάρκειες και οι κανόνες προέρχονται από τα κείμενα κάθε event στο data/siteContent.js.
const EXPERIENCES = [
  { id: 'heist', title: 'Heist Night', meta: 'Μία βραδιά · κλειστή λίστα', text: 'Βραδιά με κάρτες, ομάδες και υποχρεώσεις. Παίρνεις το γράμμα, υπογράφεις και έρχεσαι.' },
  { id: 'lockdown', title: 'Pajama Lockdown', meta: 'Τρία επίπεδα · 60′ (περίπου 75′ με προετοιμασία)', text: 'Ψηφιακό escape room 18+ με γρίφους, φυσικές δοκιμασίες και χρονόμετρο που δεν σταματά.' },
  { id: 'beachbar', title: 'Beach Bar Lockdown', meta: 'Πέντε φάσεις · 3–4 ώρες', text: 'Χορός, σαγιονάρες, τροχός ποινών και τελικός για τη Beach Queen. Το αλκοόλ είναι προαιρετικό.' },
  { id: 'marathon4h', title: 'Pajama Heist & Arrest', meta: 'Τέσσερις φάσεις · 105 λεπτά', text: 'The Ultimate Lounge Lockdown: ταμπλό 21 τετραγώνων, Αστυνόμος & Fugitives, χειροπέδες, ανάκριση και Barefoot Escape.' },
];

const STEPS = [
  { n: 'I', title: 'Λαμβάνεις τον σύνδεσμο', text: 'Ανοίγει μόνο για όσες είναι καλεσμένες.' },
  { n: 'II', title: 'Συμπληρώνεις τη φόρμα', text: 'Λίγα λεπτά: στοιχεία, όρια και επιλογή λειτουργίας.' },
  { n: 'III', title: 'Παίρνεις επιβεβαίωση', text: 'Η θέση κλειδώνει και λαμβάνεις τη διεύθυνση και τις τελευταίες λεπτομέρειες.' },
  { n: 'IV', title: 'Παίζεις', text: 'Στις ψηφιακές λειτουργίες το tablet το διευθύνει η οικοδέσποινα, η τηλεόραση δείχνει το σκορ και κάθε κινητό τις προσωπικές σου αποστολές.' },
];

export const HOME_FAQ = [
  { q: 'Τι είναι το Deal of Temptation;', a: 'Ιδιωτικές εμπειρίες παιχνιδιού για παρέες ενηλίκων (18+): κάρτες, ταμπλό, γρίφοι και αποστολές, με TV, tablet και κινητά σαν πραγματικό τηλεπαιχνίδι. Η λίστα καλεσμένων είναι κλειστή.' },
  { q: 'Ποιο event ή Mode να διαλέξω;', a: 'Για βραδιά με κάρτες, ομάδες και ληστεία, το Heist Night. Για ψηφιακό escape room 60 λεπτών, το Pajama Lockdown. Για πάρτι με χορό και σαγιονάρες, το Beach Bar Lockdown. Για ταμπλό, αστυνόμο και ανάκριση, το Pajama Heist & Arrest.' },
  { q: 'Πόσο διαρκεί;', a: 'Εξαρτάται από την εμπειρία: από 60 λεπτά (Pajama Lockdown) και 105 λεπτά (Pajama Heist & Arrest) ως 2–3 ώρες (Beach Bar Lockdown) ή ολόκληρη βραδιά (Heist Night).' },
  { q: 'Πρέπει να έχω κινητό;', a: 'Ναι. Με το κινητό σου μπαίνεις στη βραδιά, ρίχνεις ζάρι, ψηφίζεις και βλέπεις τις προσωπικές σου μυστικές αποστολές. Η TV δείχνει τη δράση και το tablet το διευθύνει η διοργανώτρια.' },
  { q: 'Πού γίνεται;', a: 'Σε ιδιωτικό χώρο. Η διεύθυνση στέλνεται μαζί με την επιβεβαίωση της θέσης σου.' },
  { q: 'Ποια είναι τα όρια και πώς προστατεύομαστε;', a: 'Παίζουν μόνο ενήλικες (18+) που συμφωνούν. Τα όρια δηλώνονται στη φόρμα και γίνονται σεβαστά. Η λέξη-στοπ ή το κουμπί ΣΤΟΠ σταματά τα πάντα αμέσως, χωρίς εξηγήσεις.' },
  { q: 'Τι γίνεται με φωτογραφίες και ό,τι λέγεται στο παιχνίδι;', a: 'Ό,τι λέγεται στο τραπέζι δεν βγαίνει από το τραπέζι. Φωτογραφίες και βίντεο των υπόλοιπων δεν τραβιούνται ούτε μοιράζονται χωρίς τη συγκατάθεση όλων.' },
  { q: 'Το αλκοόλ είναι υποχρεωτικό;', a: 'Όχι. Στο Beach Bar το αλκοόλ είναι προαιρετικό και υπάρχει εκδοχή με χυμούς.' },
  { q: 'Πώς κλείνω θέση;', a: 'Συμπληρώνεις τη φόρμα που σου στέλνουμε. Η θέση επιβεβαιώνεται και λαμβάνεις τη διεύθυνση και τις τελευταίες λεπτομέρειες.' },
];

export function HomeProgram({ onSelect }) {
  return (
    <section id="program" className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
      <div className="text-center mb-10">
        <div className="text-[11px] tracking-[0.45em] text-tarot-gold/60 uppercase mb-2">ΠΡΟΓΡΑΜΜΑ</div>
        <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold tracking-[0.1em]">ΠΡΟΓΡΑΜΜΑ &amp; ΣΤΑΔΙΑ</h2>
        <p className="text-foreground/50 mt-3 text-sm tracking-wide">Κάθε εμπειρία έχει δικά της στάδια. Πάτα πάνω της για το πλήρες πρόγραμμα.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPERIENCES.map((e) => (
          <button
            type="button"
            key={e.id}
            onClick={() => onSelect?.(e.id)}
            className="text-left rounded-2xl border border-tarot-gold/20 bg-surface-2 p-5 transition hover:border-tarot-gold/60 hover:bg-surface-3 focus-visible:outline-none"
          >
            <h3 className="font-display text-tarot-gold tracking-[0.08em] text-lg">{e.title}</h3>
            <div className="mt-1 text-[11px] tracking-[0.18em] uppercase text-foreground/45">{e.meta}</div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/70">{e.text}</p>
            <span className="mt-4 inline-flex text-xs font-bold tracking-[0.18em] text-tarot-gold uppercase">Πλήρες πρόγραμμα ↗</span>
          </button>
        ))}
      </div>

      <div className="mt-14">
        <div className="text-center mb-6">
          <div className="text-[11px] tracking-[0.4em] text-tarot-gold/60 uppercase">Πώς δουλεύει</div>
        </div>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-xl border border-tarot-gold/15 bg-surface-1 p-4">
              <div className="font-display text-tarot-gold text-xl">{s.n}</div>
              <div className="mt-1 font-display text-tarot-gold/90 tracking-[0.06em]">{s.title}</div>
              <p className="mt-2 text-sm text-foreground/60 leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function HomeFaq() {
  return <SiteFaq c={{ faq: HOME_FAQ }} />;
}
