import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import { GAME_MODES, INTENSITY_LEVELS, FOOTWEAR_LEVELS, MARATHON_STAGES, ARREST_HEIST_LADDER } from '@/data/gameConfig';

// Quick-reference guide for the Tablet screen — rules, modes, penalty ladders.
export default function AdminGuide() {
  return (
    <div className="space-y-4">
      <ComicPanel className="bg-tarot-teal/30">
        <div className="font-heading text-2xl mb-2">📖 ΟΔΗΓΟΣ ΠΑΙΧΝΙΔΙΟΥ</div>
        <div className="text-sm space-y-1">
          <p><strong>Ροή:</strong> Setup → Stage 0 (Συνεχόμενα Σφηνάκια + STOP Test + Κρυφοί Ρόλοι) → Stage 1 (Περιπολία / Ταμπλό) → Stage 2 (Ανάκριση) → Stage 3 (Φινάλε).</p>
          <p><strong>Στόχος:</strong> Μάζεψε Loot, απέφυγε Wanted Stars, ή到达 στο Safehouse. Όποια φτάσει 5 Stars → Most Wanted → Ανάκριση/Φινάλε.</p>
          <p><strong>Safe Word:</strong> Ορίζεται στο Setup. Αν πει κάποια το safe word → ΠΑΥΣΗ άμεσα.</p>
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card">
        <div className="font-heading text-xl mb-2">🎮 ΛΕΙΤΟΥΡΓΙΕΣ</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {GAME_MODES.map((m) => (
            <div key={m.id} className="comic-panel-sm p-2 bg-secondary">
              <div className="font-heading text-sm">{m.icon} {m.name}</div>
              <div className="text-xs">{m.desc}</div>
            </div>
          ))}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card">
        <div className="font-heading text-xl mb-2">🔥 ΕΝΤΑΣΗ</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {INTENSITY_LEVELS.map((i) => (
            <div key={i.id} className="comic-panel-sm p-2 bg-tarot-sienna/30">
              <div className="font-heading text-sm">{i.icon} {i.name}</div>
              <div className="text-xs">{i.desc}</div>
            </div>
          ))}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card">
        <div className="font-heading text-xl mb-2">👟 ΕΠΙΠΕΔΑ ΥΠΟΔΗΜΑΤΟΣ</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FOOTWEAR_LEVELS.map((f) => (
            <div key={f.level} className="comic-panel-sm p-2 bg-tarot-forest/30">
              <div className="font-heading text-sm">{f.icon} {f.label}</div>
              <div className="text-xs">{f.steps} βήματα ποινών</div>
            </div>
          ))}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card">
        <div className="font-heading text-xl mb-2">🏆 MARATHON ΣΤΑΔΙΑ</div>
        <div className="space-y-2">
          {MARATHON_STAGES.map((s) => (
            <div key={s.stage} className="comic-panel-sm p-2 bg-tarot-royal/20">
              <div className="font-heading text-sm">Στάδιο {s.stage}: {s.name}</div>
              <div className="text-xs">Wanted {s.wantedRange} — Στόχος: {s.target}</div>
              <div className="text-xs mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card">
        <div className="font-heading text-xl mb-2">🚨 ARREST & HEIST ΣΚΑΛΑ</div>
        <div className="space-y-1">
          {ARREST_HEIST_LADDER.map((s) => (
            <div key={s.step} className="flex items-center gap-2 text-sm">
              <span className="font-heading w-6">{s.step}.</span>
              <span className="text-xl">{s.icon}</span>
              <span><strong>{s.label}</strong> — {s.detail}</span>
            </div>
          ))}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-destructive/30">
        <div className="font-heading text-lg mb-1">⚠️ ΣΥΜΒΟΥΛΕΣ</div>
        <ul className="text-xs space-y-1 list-disc pl-4">
          <li>Πάντα να επιβεβαιώνεις το safe word πριν ξεκινήσει το παιχνίδι.</li>
          <li>Στο Marathon, οι ομάδες είναι Alpha (κόκκινο) και Beta (μπλε).</li>
          <li>Bomb Event: η παίκτρια με τα περισσότερα Wanted Stars είναι ο στόχος.</li>
          <li>Στο Finale, η Most Wanted πρέπει να απαντήσει όλες τις Αλήθειες ή παραμένει δεμένη.</li>
          <li>Χρησιμοποίησε το ⚙️ ΕΡΓΑΛΕΙΑ για QR, Bomb, Flashbang, ή νέο παιχνίδι.</li>
        </ul>
      </ComicPanel>
    </div>
  );
}