import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';

const PREVIEWS = [
  { id: 'site', label: 'SITE', path: '/site' },
  { id: 'forms', label: 'FORMS', path: '/invitation' },
  { id: 'tablet', label: 'TABLET', path: '/' },
  { id: 'tv', label: 'TV', path: '/tv' },
  { id: 'mobile', label: 'MOBILE (/play)', path: '/play' },
];

export default function AdminMediaPreview() {
  const [active, setActive] = useState('site');
  const [formPath, setFormPath] = useState('/invitation');
  const selected = PREVIEWS.find((item) => item.id === active) || PREVIEWS[0];
  const path = active === 'forms' ? formPath : selected.path;
  const title = active === 'forms'
    ? ({ '/invitation': 'Ψηφιακή πρόσκληση', '/pajama-form': 'Pajama φόρμα', '/modes-form': 'Φόρμα επιλογής Mode', '/forms': 'Δημόσιες φόρμες' }[formPath] || 'Φόρμες')
    : selected.label;

  return (
    <ComicPanel className="bg-card space-y-3">
      <div>
        <div className="font-heading text-lg text-primary">👁 LIVE PREVIEW — ΠΡΑΓΜΑΤΙΚΗ ΕΦΑΡΜΟΓΗ</div>
        <p className="mt-1 text-xs text-foreground/60">Προβολή των πραγματικών σελίδων της εφαρμογής, χωρίς δυνατότητα χειρισμού τους μέσα από την προεπισκόπηση.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {PREVIEWS.map((item) => (
          <button key={item.id} type="button" onClick={() => setActive(item.id)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${active === item.id ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-secondary/40'}`}>
            {item.label}
          </button>
        ))}
      </div>
      {active === 'forms' && (
        <div className="flex flex-wrap gap-2">
          {[
            { path: '/invitation', label: 'Πρόσκληση' },
            { path: '/pajama-form', label: 'Pajama' },
            { path: '/modes-form', label: 'Modes' },
            { path: '/forms', label: 'Δημόσιες φόρμες' },
          ].map((item) => (
            <button key={item.path} type="button" onClick={() => setFormPath(item.path)} className={`rounded-md px-3 py-1.5 text-xs ${formPath === item.path ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
              {item.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm font-bold">{title}</div>
        <a href={path} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary underline">Άνοιγμα σε νέα καρτέλα</a>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-black">
        <iframe
          key={path}
          src={path}
          title={`Live preview ${title}`}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          className="h-[72vh] min-h-[520px] w-full bg-black"
          style={{ pointerEvents: 'none' }}
        />
      </div>
      <p className="text-[10px] text-foreground/45">Η προεπισκόπηση είναι μόνο για θέαση. Για πλήρη χρήση, άνοιξε τη σελίδα σε νέα καρτέλα.</p>
    </ComicPanel>
  );
}
