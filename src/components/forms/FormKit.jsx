import React from 'react';
import { ART, MODE_COVERS, MODE_MEDIA } from '@/data/brandArt';

// Κοινό «κιτ» για όλες τις φόρμες (επιλογή εμπειρίας, modes, Classic/Arrest Heist, VIP):
// ίδια αισθητική με το νέο /site — μαύρο, χρυσό, μεγάλα κουμπιά, σταθερή μπάρα ενεργειών.

// Η φωτογραφία κεφαλίδας ενός mode: όπως ορίζεται στο Admin (MODE MEDIA CENTER).
export const formImageFor = (modeId, fallback = '') => {
  const media = MODE_MEDIA[modeId] || {};
  return media.hero || media.cover || MODE_COVERS[`modeCover_${modeId}`] || fallback || ART.heist5 || ART.poster;
};

export function FormShell({ image, kicker, title, subtitle, steps = [], step = 0, children, footer }) {
  const bg = ART.invitationBg;
  return (
    <div className="dot-site relative min-h-screen bg-black text-white">
      {bg && <div className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-[0.12]" style={{ backgroundImage: `url("${bg}")` }} aria-hidden="true" />}
      <div className="relative mx-auto w-full max-w-xl px-4 pb-40 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        <a href="/site" className="mb-4 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
          <img src={ART.emblem} alt="" className="h-7 w-7 rounded-full ring-1 ring-[#E8C26B]/40" />
          <span className="font-display tracking-[0.2em] text-[#F7E3A8]">DEAL OF TEMPTATION</span>
        </a>
        <header className="relative overflow-hidden rounded-[32px] ring-1 ring-white/10">
          {image ? <img src={image} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="aspect-[16/10] w-full object-cover" /> : <div className="aspect-[16/10] w-full bg-[radial-gradient(ellipse_at_top,#3a2a10,#000_70%)]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            {kicker && <div className="inline-flex rounded-full border border-[#E8C26B]/40 bg-black/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F7E3A8] backdrop-blur">{kicker}</div>}
            <h1 className="mt-2 font-display text-[clamp(1.9rem,8vw,2.8rem)] leading-[0.95] text-white">{title}</h1>
            {subtitle && <p className="mt-1.5 line-clamp-3 text-sm text-white/75">{subtitle}</p>}
          </div>
        </header>
        {steps.length > 1 && (
          <ol className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Βήματα φόρμας">
            {steps.map((label, i) => (
              <li key={label} aria-current={i === step ? 'step' : undefined} className="min-w-0">
                <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-[#E8C26B]' : 'bg-white/15'}`} />
                <div className={`mt-1.5 truncate text-[11px] font-semibold ${i === step ? 'text-[#F7E3A8]' : 'text-white/45'}`}>{i + 1}. {label}</div>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-5 space-y-4">{children}</div>
      </div>
      {footer}
    </div>
  );
}

export const Section = ({ icon, title, hint, children }) => (
  <section className="space-y-4 rounded-[28px] border border-white/10 bg-[#121214]/90 p-5 backdrop-blur">
    {(title || hint) && (
      <div>
        {title && <h2 className="text-lg font-bold text-white">{icon ? `${icon} ` : ''}{title}</h2>}
        {hint && <p className="mt-0.5 text-sm text-white/55">{hint}</p>}
      </div>
    )}
    {children}
  </section>
);

// Για πεδία κειμένου χρησιμοποίησε `input` ώστε η ετικέτα να συνδέεται με το πεδίο (πάτημα στην ετικέτα = εστίαση).
export const Field = ({ label, hint, required, input = false, children }) => {
  const Tag = input ? 'label' : 'div';
  return (
    <Tag className="block">
      <span className="mb-1.5 block text-sm font-semibold text-white/85">{label}{required && <span className="text-[#E8C26B]"> *</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-white/45">{hint}</span>}
    </Tag>
  );
};

const INPUT = 'w-full rounded-2xl border border-white/12 bg-black/50 px-4 text-base text-white placeholder:text-white/35 focus:border-[#E8C26B] focus:outline-none focus:ring-2 focus:ring-[#E8C26B]/30';
export const TextInput = (props) => <input {...props} className={`${INPUT} h-12 ${props.className || ''}`} />;
export const TextArea = (props) => <textarea rows={3} {...props} className={`${INPUT} py-3 ${props.className || ''}`} />;

export function ChoiceGroup({ options, value, onChange, cols = 2, size = 'md' }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} role="radiogroup">
      {options.map((opt) => {
        const on = value === opt.id;
        return (
          <button key={opt.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(opt.id)}
            className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 text-center transition-all active:scale-[0.97] ${size === 'sm' ? 'py-2' : 'py-3'} ${on ? 'border-[#E8C26B] bg-[#E8C26B]/15 text-white shadow-[0_0_0_1px_#E8C26B]' : 'border-white/10 bg-white/[0.03] text-white/75'}`}>
            {opt.icon && <span className={size === 'sm' ? 'text-lg' : 'text-2xl'}>{opt.icon}</span>}
            <span className={`font-semibold leading-tight ${size === 'sm' ? 'text-[11px]' : 'text-sm'}`}>{opt.label}</span>
            {opt.hint && <span className="text-[11px] text-white/50">{opt.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Κλίμακα 1–5 σε «κουκίδες» με περιγραφή στις άκρες.
export function Scale({ label, icon, value, onChange, low = 'Καθόλου', high = 'Πολύ' }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold text-white/85">{icon ? `${icon} ` : ''}{label}</span><span className="font-display text-[#E8C26B]">{value}/5</span></div>
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={Number(value) === n} onClick={() => onChange(n)}
            className={`h-11 rounded-xl text-sm font-bold transition-colors ${Number(value) >= n ? 'bg-[#E8C26B] text-black' : 'bg-white/[0.06] text-white/45'}`}>{n}</button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-white/40"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.03] px-4 py-3">
      <div className="min-w-0"><div className="text-sm font-semibold text-white/90">{label}</div>{hint && <div className="text-xs text-white/50">{hint}</div>}</div>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${checked ? 'bg-[#30D158]' : 'bg-white/20'}`}>
        <span className={`absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-[2px]'}`} />
      </button>
    </div>
  );
}

export function ConsentCheck({ checked, onChange, children }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${checked ? 'border-[#30D158]/60 bg-[#30D158]/10' : 'border-white/12 bg-white/[0.03]'}`}>
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-black ${checked ? 'border-[#30D158] bg-[#30D158] text-black' : 'border-white/40'}`}>{checked ? '✓' : ''}</span>
      <span className="text-sm text-white/85">{children}</span>
    </button>
  );
}

export function FooterBar({ onBack, backLabel = '← Πίσω', onNext, nextLabel, disabled, busy, hint }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/85 px-4 pt-3 backdrop-blur-xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
      <div className="mx-auto max-w-xl">
        {hint && <div className="mb-2 text-center text-xs text-white/50">{hint}</div>}
        <div className="flex gap-2">
          {onBack && <button type="button" onClick={onBack} className="h-14 shrink-0 rounded-full border border-white/20 px-5 text-sm font-semibold text-white">{backLabel}</button>}
          <button type="button" onClick={onNext} disabled={disabled || busy} className="h-14 flex-1 rounded-full bg-[#E8C26B] text-base font-bold text-black shadow-[0_10px_40px_-10px_rgba(232,194,107,0.7)] transition-opacity disabled:opacity-35">
            {busy ? 'Αποστολή…' : nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SuccessScreen({ name, modeName, image, text = 'Η αίτησή σου στάλθηκε. Θα μπεις στο παιχνίδι μόλις η διοργανώτρια την εγκρίνει.' }) {
  return (
    <div className="dot-site relative flex min-h-screen items-center justify-center overflow-hidden bg-black p-5 text-white">
      {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(232,194,107,0.3),transparent_60%)]" />
      <section className="dot-crown-in relative w-full max-w-md rounded-[32px] border border-[#E8C26B]/30 bg-black/70 p-8 text-center backdrop-blur-xl" role="status">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#30D158] text-3xl text-black">✓</div>
        <h1 className="mt-4 font-display text-3xl text-white">{name ? `Ευχαριστούμε, ${name}!` : 'Η αίτηση στάλθηκε!'}</h1>
        {modeName && <div className="mt-2 inline-flex rounded-full bg-[#E8C26B]/15 px-3 py-1 text-sm font-semibold text-[#F7E3A8]">{modeName}</div>}
        <p className="mt-4 text-white/70">{text}</p>
        <ol className="mt-6 space-y-2 text-left text-sm text-white/70">
          <li className="flex gap-3"><span className="text-[#30D158]">✓</span>Η αίτηση καταχωρήθηκε</li>
          <li className="flex gap-3"><span className="text-[#E8C26B]">2</span>Έγκριση από τη διοργανώτρια</li>
          <li className="flex gap-3"><span className="text-white/40">3</span>Παίρνεις διεύθυνση και κωδικό της βραδιάς</li>
        </ol>
        <a href="/site" className="mt-7 inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white">Επιστροφή στο site</a>
      </section>
    </div>
  );
}
