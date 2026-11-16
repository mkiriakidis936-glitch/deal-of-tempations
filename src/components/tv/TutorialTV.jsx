import React, { useEffect, useState } from 'react';

const STEPS = [
  { title: '1 · ΣΥΝΔΕΣΗ ΚΙΝΗΤΟΥ', detail: 'Σκάναρε το QR της TV με την κάμερα του κινητού και άνοιξε την προσωπική οθόνη συμμετοχής.' },
  { title: '2 · ΡΟΛΟΙ & ΨΗΦΟΦΟΡΙΕΣ', detail: 'Το Tablet ελέγχει τη ροή. Οι μυστικοί ρόλοι και οι προσωπικές επιλογές εμφανίζονται μόνο στην αντίστοιχη συσκευή.' },
  { title: '3 · ΕΞΟΠΛΙΣΜΟΣ', detail: 'Γνωρίστε τον τρόπο ασφαλούς απασφάλισης του εξοπλισμού. Η πρόβα είναι μόνο επίδειξη: δεν εφαρμόζονται δεσίματα ή περιορισμοί.' },
  { title: '4 · PANIC STOP', detail: 'Το STOP σταματά αμέσως τη ροή. Το Safe Word ισχύει πάντα. Κάθε παίκτρια μπορεί να σταματήσει χωρίς εξήγηση.' },
];

export default function TutorialTV({ tutorial }) {
  const [remaining, setRemaining] = useState(tutorial?.remaining || 60);
  useEffect(() => {
    if (!tutorial?.active || !tutorial.startedAt) return undefined;
    const tick = () => setRemaining(Math.max(0, 60 - Math.floor((Date.now() - tutorial.startedAt) / 1000)));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [tutorial?.active, tutorial?.startedAt]);
  if (!tutorial?.active) return null;
  const step = STEPS[Math.max(0, Math.min(STEPS.length - 1, tutorial.step || 0))];
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#050509]/96 p-6 text-center">
      <div className="w-full max-w-4xl space-y-7 rounded-3xl border border-[#c9a94e]/70 bg-[#100e0b] p-8 shadow-2xl">
        <div className="text-xs tracking-[.45em] text-[#c9a94e]">DEAL OF TEMPTATION · QUICK START</div>
        <div className="font-heading text-5xl sm:text-7xl text-[#f3df9e]">{step.title}</div>
        <p className="mx-auto max-w-3xl text-2xl sm:text-3xl leading-relaxed text-white">{step.detail}</p>
        <div className="mx-auto h-2 max-w-2xl overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-[#c9a94e] transition-all" style={{ width: `${(remaining / 60) * 100}%` }} />
        </div>
        <div className="font-heading text-4xl tabular-nums text-[#c9a94e]">{remaining}″</div>
      </div>
    </div>
  );
}
