import React from 'react';

const chapters = [
  ['01', 'THE ARRIVAL', 'Υποδοχή, ατμόσφαιρα και επίσημη έναρξη της βραδιάς.'],
  ['02', 'MEET THE CAST', 'Παρουσίαση των συμμετεχόντων και των ρόλων της βραδιάς.'],
  ['03', 'THE GAME', 'Το υπάρχον παιχνίδι παραμένει στο επίκεντρο, με τηλεοπτική ροή και σκηνοθετημένες μεταβάσεις.'],
  ['04', 'THE BREAK', 'Ελεγχόμενα διαλείμματα, μουσική και επιστροφή στη δράση.'],
  ['05', 'THE FINALE', 'Τελική ανακοίνωση, Winner’s Vault και κλείσιμο της εμπειρίας.'],
];

export default function SiteProduction() {
  return <section id="reality-show" className="relative overflow-hidden border-y border-tarot-gold/15 px-4 py-20 sm:py-24">
    <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(196,160,91,.16), transparent 65%)' }} />
    <div className="relative mx-auto max-w-6xl">
      <div className="mx-auto max-w-3xl text-center">
        <div className="text-[10px] tracking-[0.45em] text-tarot-gold/70">THE PRIVATE REALITY GAME NIGHT</div>
        <h2 className="mt-4 font-display text-3xl sm:text-5xl tracking-[0.08em] text-tarot-gold">NOT JUST A GAME.<br />A PRIVATE SHOW.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-foreground/70">Μια ιδιωτική βιωματική εμπειρία με παρουσίαση, σκηνοθετημένη ροή, ήχο, εικόνα και κορύφωση. Το παιχνίδι που ήδη γνωρίζεις παραμένει ο πυρήνας· γύρω του οργανώνεται ολόκληρη η βραδιά.</p>
      </div>
      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {chapters.map(([number, title, description]) => <article key={number} className="rounded-xl border border-tarot-gold/20 bg-card/70 p-5 backdrop-blur-sm">
          <div className="font-display text-2xl text-tarot-gold/60">{number}</div>
          <h3 className="mt-3 text-xs font-bold tracking-[0.18em] text-tarot-gold">{title}</h3>
          <p className="mt-3 text-xs leading-relaxed text-foreground/60">{description}</p>
        </article>)}
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-tarot-gold/15 p-5"><div className="text-xs font-bold tracking-widest text-tarot-gold">SHOW IDENTITY</div><p className="mt-2 text-sm text-foreground/65">Intro videos, χαρακτηριστικός ήχος, παρουσιάσεις και κινηματογραφικές μεταβάσεις.</p></div>
        <div className="rounded-xl border border-tarot-gold/15 p-5"><div className="text-xs font-bold tracking-widest text-tarot-gold">LIVE PRODUCTION</div><p className="mt-2 text-sm text-foreground/65">Πρόγραμμα βραδιάς, σημεία παραγωγής, διαλείμματα και δυνατότητα extended / overnight format.</p></div>
        <div className="rounded-xl border border-tarot-gold/15 p-5"><div className="text-xs font-bold tracking-widest text-tarot-gold">THE FINALE</div><p className="mt-2 text-sm text-foreground/65">Winner reveal, ιδιωτικό recap και ολοκληρωμένο κλείσιμο της εμπειρίας.</p></div>
      </div>
      <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] leading-relaxed text-foreground/45">Η φωτογράφιση, η βιντεοσκόπηση και η δημοσίευση υλικού γίνονται μόνο με προηγούμενη ενημέρωση και ξεχωριστή συγκατάθεση των συμμετεχόντων. Η ιδιωτική εμπειρία δεν προϋποθέτει δημόσια προβολή.</p>
    </div>
  </section>;
}
