import React from 'react';

export default function SiteContact({ c, onRegister }) {
  return (
    <section id="registration" className="px-4 py-20 sm:py-24 border-t border-tarot-gold/15">
      <div className="max-w-4xl mx-auto rounded-3xl border border-tarot-gold/25 bg-gradient-to-br from-[#17130d] via-[#111] to-[#080808] px-6 py-12 sm:px-12 sm:py-16 text-center shadow-[0_24px_80px_rgba(0,0,0,.3)]">
        <div className="text-[10px] sm:text-xs tracking-[0.42em] text-tarot-gold/65 uppercase mb-3">Contact / Invitations</div>
        <h2 className="font-display text-3xl sm:text-4xl text-tarot-gold tracking-[0.08em]">Η ΠΡΟΣΚΛΗΣΗ ΣΟΥ ΞΕΚΙΝΑ ΕΔΩ</h2>
        <p className="max-w-xl mx-auto mt-4 text-sm sm:text-base text-white/60 leading-relaxed">Για συμμετοχή στο επιλεγμένο event, συνέχισε στην αντίστοιχη φόρμα.</p>
        <button onClick={onRegister} className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full border border-tarot-gold bg-tarot-gold px-8 py-3 text-xs font-black tracking-[0.2em] text-black transition hover:bg-transparent hover:text-tarot-gold">
          {c.cta.label}
        </button>
        <div className="mt-5 text-[10px] tracking-[0.28em] text-white/35 uppercase">Deal of Temptation · 18+ · Κλειστή λίστα</div>
      </div>
    </section>
  );
}
