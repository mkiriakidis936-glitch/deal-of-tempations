import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';

const PREVIEWS = [
  { id: 'site', label: 'SITE', path: '/site' },
  { id: 'forms', label: 'FORMS', path: '/invitation' },
  { id: 'tablet', label: 'TABLET', path: '/' },
  { id: 'tv', label: 'TV', path: '/tv' },
  { id: 'mobile', label: 'MOBILE (/play)', path: '/play' },
];

const SITE_PAGES = [
  { path: '/site', label: 'Αρχική' },
  { path: '/site?event=heist', label: 'Heist' },
  { path: '/site?event=pajama', label: 'Pajama' },
  { path: '/site?event=lockdown', label: 'Pajama Lockdown 18+' },
  { path: '/site?event=beachbar', label: 'Beach Bar Home Lockdown' },
  { path: '/promo', label: 'Promo' },
];

const FORM_PAGES = [
  { path: '/invitation', label: 'Πρόσκληση' },
  { path: '/pajama-form', label: 'Pajama' },
  { path: '/modes-form', label: 'Modes' },
  { path: '/intake', label: 'Intake' },
  { path: '/forms', label: 'Δημόσιες φόρμες' },
  { path: '/pajama-invite', label: 'Pajama invite' },
  { path: '/vip-access', label: 'VIP Access' },
];

export default function AdminMediaPreview() {
  const [active, setActive] = useState('site');
  const [sitePath, setSitePath] = useState('/site');
  const [formPath, setFormPath] = useState('/invitation');
  const selected = PREVIEWS.find((item) => item.id === active) || PREVIEWS[0];
  const path = active === 'site' ? sitePath : active === 'forms' ? formPath : selected.path;
  const title = active === 'site'
    ? (SITE_PAGES.find((item) => item.path === sitePath)?.label || 'Site')
    : active === 'forms'
      ? (FORM_PAGES.find((item) => item.path === formPath)?.label || 'Forms')
      : selected.label;

  const pageButtons = (items, current, onSelect) => (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button key={item.path} type="button" onClick={() => onSelect(item.path)} className={current === item.path ? 'rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground' : 'rounded-md bg-secondary px-3 py-1.5 text-xs'}>
          {item.label}
        </button>
      ))}
    </div>
  );

  return (
    <ComicPanel className="bg-card space-y-3">
      <div>
        <div className="font-heading text-lg text-primary">👁 LIVE PREVIEW — ΠΡΑΓΜΑΤΙΚΗ ΕΦΑΡΜΟΓΗ</div>
        <p className="mt-1 text-xs text-foreground/60">Προβολή των πραγματικών σελίδων της εφαρμογής, χωρίς δυνατότητα χειρισμού τους μέσα από την προεπισκόπηση.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {PREVIEWS.map((item) => (
          <button key={item.id} type="button" onClick={() => setActive(item.id)} className={active === item.id ? 'rounded-lg border border-primary bg-primary/15 px-3 py-2 text-xs font-bold' : 'rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-bold'}>
            {item.label}
          </button>
        ))}
      </div>
      {active === 'site' && pageButtons(SITE_PAGES, sitePath, setSitePath)}
      {active === 'forms' && pageButtons(FORM_PAGES, formPath, setFormPath)}
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
