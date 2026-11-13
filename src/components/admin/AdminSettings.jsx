import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import AdminEventInfo from '@/components/admin/AdminEventInfo';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminBackup from '@/components/admin/AdminBackup';
import AdminGuide from '@/components/admin/AdminGuide';
import AdminGlobalDesign from '@/components/admin/AdminGlobalDesign';

const CATEGORIES = [
  { id: 'event', label: 'Εκδήλωση', description: 'Ημερομηνία, τοποθεσία και πληροφορίες εκδήλωσης.' },
  { id: 'notifications', label: 'Ειδοποιήσεις', description: 'Push ειδοποιήσεις και εγκατάσταση εφαρμογής.' },
  { id: 'backup', label: 'Αντίγραφα ασφαλείας', description: 'Δημιουργία, λήψη και επαναφορά αντιγράφων.' },
  { id: 'guide', label: 'Οδηγός παιχνιδιού', description: 'Κανόνες, Modes και οδηγίες χρήσης.' },
  { id: 'design', label: 'Σχεδίαση', description: 'Κεντρικά χρώματα και γραμματοσειρές.' },
];

export default function AdminSettings() {
  const [category, setCategory] = useState('event');
  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card"><div className="font-heading text-2xl text-primary">Κεντρικές ρυθμίσεις</div><p className="text-xs text-foreground/70 mt-1">Οι ρυθμίσεις είναι οργανωμένες σε ξεχωριστές κατηγορίες.</p></ComicPanel>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="tablist" aria-label="Κατηγορίες ρυθμίσεων">
        {CATEGORIES.map((item) => <button key={item.id} type="button" role="tab" aria-selected={category === item.id} onClick={() => setCategory(item.id)} className={'rounded-lg border-2 px-3 py-3 text-sm font-bold transition-colors ' + (category === item.id ? 'bg-primary text-tarot-dark border-primary' : 'bg-card border-border/50 hover:bg-secondary')}>{item.label}</button>)}
      </div>
      <div className="text-xs text-foreground/60">{CATEGORIES.find((item) => item.id === category)?.description}</div>
      {category === 'event' && <AdminEventInfo />}
      {category === 'notifications' && <AdminNotifications />}
      {category === 'backup' && <AdminBackup />}
      {category === 'guide' && <AdminGuide />}
      {category === 'design' && <AdminGlobalDesign />}
    </div>
  );
}
