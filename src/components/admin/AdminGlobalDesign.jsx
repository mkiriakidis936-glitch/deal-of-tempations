import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const KEY = 'admin_global_design';
const DEFAULTS = {
  background: '#120f12', foreground: '#eee8dc', card: '#211b21',
  primary: '#d5b36a', accent: '#8f7041', border: '#66543c',
  heading: 'Cinzel', body: 'Cormorant Garamond', display: 'Cinzel Decorative',
};
const FONTS = ['Cinzel', 'Cinzel Decorative', 'Cormorant Garamond', 'Inter'];

function hexToHsl(hex) {
  const value = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyDesign(value) {
  const root = document.documentElement;
  const pairs = { background: '--background', foreground: '--foreground', card: '--card', primary: '--primary', accent: '--accent', border: '--border', primary: '--ring' };
  Object.entries(pairs).forEach(([key, variable]) => {
    const hsl = hexToHsl(value[key] || DEFAULTS[key]);
    if (hsl) root.style.setProperty(variable, hsl);
  });
  root.style.setProperty('--font-heading', `'${value.heading || DEFAULTS.heading}', Georgia, serif`);
  root.style.setProperty('--font-body', `'${value.body || DEFAULTS.body}', Georgia, serif`);
  root.style.setProperty('--font-display', `'${value.display || DEFAULTS.display}', Georgia, serif`);
}

export function applySavedGlobalDesign(value) {
  if (value && typeof value === 'object') applyDesign({ ...DEFAULTS, ...value });
}

export default function AdminGlobalDesign() {
  const [value, setValue] = useState(DEFAULTS);
  const [record, setRecord] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    base44.entities.AppSetting.filter({ key: KEY }, { limit: 1 }).then(({ items }) => {
      const found = items?.[0] || null;
      setRecord(found);
      if (found?.value) setValue({ ...DEFAULTS, ...found.value });
    }).catch((error) => setMessage(error.message || 'Δεν φορτώθηκαν οι ρυθμίσεις.'));
  }, []);

  useEffect(() => { applyDesign(value); }, [value]);

  const change = (key, next) => setValue((current) => ({ ...current, [key]: next }));

  async function save() {
    setBusy(true);
    setMessage('');
    try {
      const payload = { ...value };
      let saved;
      if (record?.id) saved = await base44.entities.AppSetting.update(record.id, { value: payload });
      else saved = await base44.entities.AppSetting.create({ key: KEY, value: payload });
      if (saved?.id) setRecord(saved);
      window.dispatchEvent(new CustomEvent('admin-global-design-updated', { detail: payload }));
      setMessage('Οι κεντρικές ρυθμίσεις σχεδίασης αποθηκεύτηκαν.');
    } catch (error) {
      setMessage(error.message || 'Αποτυχία αποθήκευσης.');
    } finally { setBusy(false); }
  }

  function reset() { setValue(DEFAULTS); }

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-xl">GLOBAL DESIGN SETTINGS</div>
        <p className="text-xs text-foreground/60">Κεντρικά χρώματα και γραμματοσειρές για το περιβάλλον της εφαρμογής και το public site.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            ['background','Φόντο'],['foreground','Κείμενο'],['card','Κάρτες'],
            ['primary','Κύριο χρώμα'],['accent','Δευτερεύον'],['border','Περιγράμματα'],
          ].map(([key,label]) => (
            <label key={key} className="text-xs font-bold space-y-1">
              <span>{label}</span>
              <div className="flex items-center gap-2 rounded border border-border p-2">
                <input aria-label={label} type="color" value={value[key]} onChange={(e) => change(key,e.target.value)} className="w-9 h-8 bg-transparent" />
                <span>{value[key]}</span>
              </div>
            </label>
          ))}
        </div>
        {[
          ['heading','Γραμματοσειρά τίτλων'],['body','Γραμματοσειρά κειμένου'],['display','Γραμματοσειρά display'],
        ].map(([key,label]) => (
          <label key={key} className="block text-xs font-bold">{label}
            <select className="mt-1 w-full rounded border border-border bg-background p-2" value={value[key]} onChange={(e) => change(key,e.target.value)}>
              {FONTS.map((font) => <option key={font} value={font}>{font}</option>)}
            </select>
          </label>
        ))}
        <div className="rounded-xl border border-border p-4 space-y-2" style={{ backgroundColor: value.background, color: value.foreground }}>
          <div style={{ color: value.primary, fontFamily: value.display }} className="text-2xl">DEAL OF TEMPTATION</div>
          <div style={{ fontFamily: value.heading }}>Προεπισκόπηση τίτλου</div>
          <div style={{ fontFamily: value.body }}>Προεπισκόπηση κειμένου και εμφάνισης περιεχομένου.</div>
          <div className="rounded-lg p-3" style={{ backgroundColor: value.card, border: `1px solid ${value.border}` }}>Κάρτα περιεχομένου</div>
        </div>
        {message && <div className="text-xs font-bold">{message}</div>}
        <div className="flex flex-wrap gap-2">
          <ComicButton variant="green" disabled={busy} onClick={save}>{busy ? 'ΑΠΟΘΗΚΕΥΣΗ…' : 'ΑΠΟΘΗΚΕΥΣΗ'}</ComicButton>
          <ComicButton variant="white" disabled={busy} onClick={reset}>Επαναφορά προεπιλογών</ComicButton>
        </div>
      </ComicPanel>
    </div>
  );
}
