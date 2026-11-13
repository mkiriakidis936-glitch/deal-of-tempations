import React from 'react';

export default function SiteRegistration({ c, onRegister }) {
  return (
    <section id="registration" className="px-4 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_auto] items-center gap-6 rounded-2xl border border-tarot-gold/25 bg-[#111] p-6 sm:p-10">
        <div>
          <div className="text-[10px] tracking-[0.4em] text-tarot-gold/65 uppercase mb-2">Registration</div>
          <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold tracking-[0.07em]">ΔΗΛΩΣΕ ΣΥΜΜΕΤΟΧΗ</h2>
          <p className="mt-2 text-sm text-foreground/60">Η φόρμα συμμετοχής αντιστοιχεί στο event ή Mode που έχεις επιλέξει.</p>
        </div>
        <button onClick={onRegister} className="min-h-12 rounded-full bg-tarot-gold px-7 py-3 text-xs font-black tracking-[0.2em] text-black hover:bg-white transition-colors">{c.cta.label}</button>
      </div>
    </section>
  );
}