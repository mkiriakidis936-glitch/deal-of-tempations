import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ = [
  {
    q: 'Τι είναι ακριβώς;',
    a: 'Μια βραδιά παιχνιδιού με πιτζάμες, κάρτες και υποχρεώσεις. Κλειστή λίστα καλεσμένων, 18+, καμία δεν ξέρει τα υπόλοιπα πριν φτάσει.',
  },
  {
    q: 'Πόσο διαρκεί;',
    a: 'Επτά πράξεις: τέσσερις το βράδυ και τρεις το πρωί, με διαλείμματα. Μπορείς να μείνεις και για ύπνο.',
  },
  {
    q: 'Τι πρέπει να φέρω;',
    a: 'Πιτζάμες, τις δικές σου παντόφλες και φρέσκο μανικιούρ. Αν δεν φέρεις παντόφλες, το παιχνίδι σου δίνει δικές του — και δεν είναι καλό νέο.',
  },
  {
    q: 'Κανόνες συμπεριφοράς',
    a: 'Όρια δηλώνονται πριν ξεκινήσουμε και γίνονται σεβαστά. Υπάρχει safe word που σταματά τα πάντα αμέσως, χωρίς εξηγήσεις.',
  },
  {
    q: 'Τηλέφωνα και φωτογραφίες',
    a: 'Τα τηλέφωνα μένουν κλειστά στη διάρκεια του παιχνιδιού. Ό,τι λέγεται στο τραπέζι δεν βγαίνει από το τραπέζι.',
  },
  {
    q: 'Πώς κλείνω θέση;',
    a: 'Συμπληρώνεις τη φόρμα σε 5 λεπτά. Η θέση επιβεβαιώνεται και λαμβάνεις τη διεύθυνση και τις τελευταίες λεπτομέρειες.',
  },
];

export default function SiteFaq() {
  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="text-[11px] tracking-[0.45em] text-tarot-gold/60 uppercase mb-2">FAQ</div>
        <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold tracking-[0.1em]">ΚΑΝΟΝΕΣ &amp; ΑΠΟΡΙΕΣ</h2>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {FAQ.map((item, i) => (
          <AccordionItem key={item.q} value={`item-${i}`} className="comic-panel-sm px-4 border-b-0">
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