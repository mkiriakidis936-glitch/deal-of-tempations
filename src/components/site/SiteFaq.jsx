import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function SiteFaq({ c }) {
  const FAQ = c.faq || [];
  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="text-[11px] tracking-[0.45em] text-tarot-gold/60 uppercase mb-2">FAQ</div>
        <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold tracking-[0.1em]">ΚΑΝΟΝΕΣ &amp; ΑΠΟΡΙΕΣ</h2>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {FAQ.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="comic-panel-sm px-4 border-b-0">
            <AccordionTrigger className="text-left text-foreground/85 hover:text-tarot-gold hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-foreground/65">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}