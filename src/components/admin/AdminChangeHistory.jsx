import React, { useState } from 'react';
import AdminSettingVersionHistory from '@/components/admin/AdminSettingVersionHistory';

// 12.2 · Σύστημα → Ιστορικό αλλαγών: για κάθε σημαντική ρύθμιση, οι τελευταίες 30 εκδόσεις με «Επαναφορά».
// Ο server κρατά αυτόματα την προηγούμενη τιμή πριν από κάθε αλλαγή (πολλές αλλαγές μέσα σε 2′ = μία έκδοση).
// Η επαναφορά κρατά πρώτα την τρέχουσα κατάσταση ως νέα έκδοση, άρα και η ίδια αναιρείται.
const AREAS = [
  { key: 'media_overrides', icon: '🖼️', label: 'Φωτογραφίες & βίντεο (θέσεις, Χάρτης media)', note: 'Ποιο αρχείο μπαίνει σε κάθε θέση. Τα ίδια τα αρχεία δεν σβήνονται με την επαναφορά.' },
  { key: 'modes_content', icon: '🎴', label: 'Κάρτες, ταμπλό & κείμενα', note: 'Κάρτες, Τροχοί, τετράγωνα ταμπλό, κείμενα-διαταγές, αποστολές.' },
  { key: 'site_content', icon: '🌐', label: 'Ιστοσελίδα', note: 'Κείμενα και ρυθμίσεις του Site.' },
  { key: 'admin_form_questions', icon: '📝', label: 'Ερωτήσεις φορμών' },
  { key: 'admin_global_design', icon: '🎨', label: 'Σχεδίαση εφαρμογής' },
  { key: 'admin_custom_scenarios', icon: '🧭', label: 'Σενάρια παιχνιδιού' },
  { key: 'achievement_definitions', icon: '🏆', label: 'Επιτεύγματα' },
  { key: 'custom_board_modes', icon: '🛠️', label: 'Δικά σου modes' },
];

export default function AdminChangeHistory() {
  const [open, setOpen] = useState('media_overrides');
  return (
    <div className="space-y-3">
      <p className="text-[14px] text-foreground/60">Κάθε φορά που αλλάζει κάτι από τα παρακάτω, κρατιέται η προηγούμενη εκδοχή. Αν κάτι χάλασε ή σβήστηκε κατά λάθος, πάτα «Επαναφορά» στην εκδοχή που ήθελες. Η επαναφορά δεν χάνει την τρέχουσα: γίνεται κι αυτή έκδοση.</p>
      {AREAS.map((a) => (
        <section key={a.key} className="adm-card space-y-2">
          <button type="button" className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen(open === a.key ? '' : a.key)} aria-expanded={open === a.key}>
            <span className="adm-card-title">{a.icon} {a.label}</span>
            <span className="text-foreground/50">{open === a.key ? '▾' : '▸'}</span>
          </button>
          {open === a.key && (
            <>
              {a.note && <p className="text-[12px] text-foreground/55">{a.note}</p>}
              <AdminSettingVersionHistory settingKey={a.key} embedded title="Εκδόσεις" onRestore={() => { /* οι οθόνες ενημερώνονται ζωντανά από τον server */ }} />
            </>
          )}
        </section>
      ))}
    </div>
  );
}
