import React, { useEffect, useState } from 'react';
import { Page, Header, Card, Badge } from '@/design/ui';
import { BriefingMobile, briefingPending } from '@/components/modes/ModeBriefing';

const HINTS = [
  'Το τραπέζι στρώνεται. Κανείς δεν ξέρει τι κρατάει ο διπλανός.',
  'Κάθε κάρτα είναι μια υπόσχεση. Κάθε υπόσχεση έχει τίμημα.',
  'Άκου πριν μιλήσεις — κάποια ψιθυρίζει την αλήθεια σου.',
  'Το χρώμα των νυχιών σου δεν είναι διακοσμητικό.',
  'Ό,τι πεις απόψε, θα το θυμούνται αύριο.',
  'Το ταβάνι έχει μνήμη. Τα πέλματα, περισσότερη.',
  'Μην εμπιστεύεσαι την πρώτη ερώτηση. Είναι δόλωμα.',
  'Η σιωπή κοστίζει. Πάντα.',
];

export default function WaitingRoom({ sessionCode, state }) {
  const briefing = !!state && briefingPending(state.mg, state.mode);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % HINTS.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <Page center>
      <div className="flex justify-center"><img src="/icons/icon-192.png" alt="" className="h-20 w-20 rounded-[22px]" /></div>
      <Header eyebrow="Deal of Temptation" title={briefing ? 'Οι κανόνες της βραδιάς' : 'Αναμονή έναρξης'} subtitle="Η σύνδεση κρατιέται — μείνε σε αυτή τη σελίδα." right={<Badge tone="gold">{sessionCode}</Badge>} />
      {briefing ? <div className="text-white"><BriefingMobile state={state} /></div> : (
        <Card tone="gold">
          <div className="ui-eyebrow mb-2" style={{ color: 'var(--ui-gold)' }}>Ψίθυρος</div>
          <p className="min-h-[72px] text-[17px] leading-snug">«{HINTS[index]}»</p>
        </Card>
      )}
    </Page>
  );
}
