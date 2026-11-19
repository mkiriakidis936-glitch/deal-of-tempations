import React, { useEffect, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';

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

export default function WaitingRoom({ sessionCode }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % HINTS.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen comic-dots flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md w-full">
        <ComicPanel className="bg-primary text-center py-6">
          <div className="font-heading text-3xl text-tarot-dark">DEAL OF TEMPTATION</div>
          <div className="text-sm font-bold text-tarot-dark/80 mt-1">Κωδικός: {sessionCode}</div>
        </ComicPanel>

        <div className="text-6xl comic-pulse">⏳</div>
        <div className="font-heading text-2xl text-primary">Αναμονή έναρξης...</div>

        <ComicPanel className="bg-card comic-pop">
          <div className="text-xs font-bold tracking-widest text-primary mb-2">ΨΙΘΥΡΟΣ</div>
          <p key={index} className="font-body text-lg text-foreground/80 comic-slide-in min-h-[72px] flex items-center justify-center">
            «{HINTS[index]}»
          </p>
        </ComicPanel>

        <div className="text-xs text-foreground/50 font-body">Η σύνδεση κρατιέται — μείνε σε αυτή τη σελίδα.</div>
      </div>
    </div>
  );
}