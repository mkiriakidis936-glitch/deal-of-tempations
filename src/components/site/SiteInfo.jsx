import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CalendarDays, MapPin, Shirt, Footprints } from 'lucide-react';

export default function SiteInfo() {
  const [eventDate, setEventDate] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { items } = await base44.entities.AppSetting.filter({ key: 'event_date' }, { limit: 1 });
        if (items?.[0]?.value) setEventDate(items[0].value);
      } catch (e) {
        /* no date set */
      }
    }
    load();
  }, []);

  const dateLabel = eventDate
    ? new Date(eventDate).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Ανακοινώνεται σύντομα';

  const items = [
    { icon: CalendarDays, title: 'Πότε', text: dateLabel },
    { icon: MapPin, title: 'Πού', text: 'Ιδιωτικός χώρος — η διεύθυνση στέλνεται με την επιβεβαίωση' },
    { icon: Shirt, title: 'Dress code', text: 'Πιτζάμες. Μαύρο προαιρετικό, άνετο υποχρεωτικό.' },
    { icon: Footprints, title: 'Τι φέρνεις', text: 'Τις δικές σου παντόφλες και φρέσκο μανικιούρ.' },
  ];

  return (
    <section id="info" className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="text-[11px] tracking-[0.45em] text-tarot-gold/60 uppercase mb-2">Πληροφορίες</div>
        <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold tracking-[0.1em]">ΤΑ ΠΡΑΚΤΙΚΑ</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="comic-panel-sm p-5 flex gap-4">
            <Icon className="w-5 h-5 text-tarot-gold shrink-0 mt-1" />
            <div>
              <div className="text-[11px] tracking-[0.3em] uppercase text-tarot-gold/70 mb-1">{title}</div>
              <div className="text-foreground/75">{text}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="comic-panel-sm p-5 mt-4 text-center">
        <div className="text-[11px] tracking-[0.3em] uppercase text-tarot-gold/70 mb-2">Συμμετοχή</div>
        <p className="text-foreground/70">
          Κλειστή λίστα, 18+, λίγες θέσεις. Η κράτηση γίνεται σε 5 λεπτά — μόνο τα βασικά.
        </p>
      </div>
    </section>
  );
}