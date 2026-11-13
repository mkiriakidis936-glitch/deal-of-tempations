import React from 'react';

export default function SiteAbout() {
  return (
    <section id="about" className="px-4 py-20 sm:py-24">
      <div className="max-w-5xl mx-auto grid md:grid-cols-[.8fr_1.2fr] gap-8 md:gap-14 items-start">
        <div>
          <div className="text-[10px] sm:text-xs tracking-[0.42em] text-tarot-gold/65 uppercase mb-3">About the experience</div>
          <h2 className="font-display text-3xl sm:text-4xl leading-tight text-tarot-gold tracking-[0.06em]">ΜΙΑ ΕΜΠΕΙΡΙΑ.<br />ΠΟΛΛΑ MODES.</h2>
        </div>
        <div className="space-y-4 text-sm sm:text-base text-foreground/65 leading-relaxed">
          <p>Το Deal of Temptation συγκεντρώνει δύο αρχικά events — Heist Night και Pajama Pedi-Glam — μαζί με τέσσερα επιπλέον ψηφιακά Game Modes.</p>
          <p>Κάθε εμπειρία έχει τη δική της παρουσίαση, το δικό της πρόγραμμα και ξεχωριστή φόρμα συμμετοχής. Επίλεξε ένα Mode για να δεις αναλυτικά τι περιλαμβάνει.</p>
          <a href="#modes" className="inline-flex items-center gap-2 pt-2 text-xs font-bold tracking-[0.2em] text-tarot-gold uppercase">Explore the modes <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>
  );
}
