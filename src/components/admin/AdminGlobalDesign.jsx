import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import AdminSettingVersionHistory from '@/components/admin/AdminSettingVersionHistory';
import { saveAdminSettingVersion } from '@/lib/adminVersionHistory';
import { GLOBAL_DESIGN_DEFAULTS, GLOBAL_DESIGN_KEY, applySavedGlobalDesign } from '@/lib/globalDesign';

const FONTS = ['Cinzel', 'Cinzel Decorative', 'Cormorant Garamond', 'Inter'];

export default function AdminGlobalDesign() {
  const [value, setValue] = useState(GLOBAL_DESIGN_DEFAULTS);
  const [record, setRecord] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    base44.entities.AppSetting.filter({ key: GLOBAL_DESIGN_KEY }, { limit: 1 }).then(({ items }) => {
      const found = items?.[0] || null;
      setRecord(found);
      if (found?.value) setValue({ ...GLOBAL_DESIGN_DEFAULTS, ...found.value });
    }).catch((error) => setMessage(error.message || 'Δεν φορτώθηκαν οι ρυθμίσεις.'));
  }, []);

  useEffect(() => { applySavedGlobalDesign(value); }, [value]);

  const change = (key, next) => setValue((current) => ({ ...current, [key]: next }));

  async function save() {
    setBusy(true);
    setMessage('');
    try {
      const payload = { ...value };
      if (record?.id) await saveAdminSettingVersion(GLOBAL_DESIGN_KEY, record.value || GLOBAL_DESIGN_DEFAULTS);
      const saved = record?.id
        ? await base44.entities.AppSetting.update(record.id, { value: payload })
        : await base44.entities.AppSetting.create({ key: GLOBAL_DESIGN_KEY, value: payload });
      if (saved?.id) setRecord(saved);
      applySavedGlobalDesign(payload);
      window.dispatchEvent(new CustomEvent('admin-global-design-updated', { detail: payload }));
      setMessage('Οι κεντρικές ρυθμίσεις σχεδίασης αποθηκεύτηκαν.');
    } catch (error) {
      setMessage(error.message || 'Αποτυχία αποθήκευσης.');
    } finally {
      setBusy(false);
    }
  }

  function reset() { setValue(GLOBAL_DESIGN_DEFAULTS); }

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-xl">GLOBAL DESIGN SETTINGS</div>
        <p className="text-xs text-foreground/60">Κεντρικά χρώματα και γραμματοσειρές για Admin, Tablet, TV και δημόσιο site.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            ['background', 'Φόντο'], ['foreground', 'Κείμενο'], ['card', 'Κάρτες'],
            ['primary', 'Κύριο χρώμα'], ['accent', 'Δευτερεύον'], ['border', 'Περιγράμματα'],
          ].map(([key, label]) => (
            <label key={key} className="text-xs font-bold space-y-1">
              <span>{label}</span>
              <div className="flex items-center gap-2 rounded border border-border p-2">
                <input aria-label={label} type="color" value={value[key]} onChange={(event) => change(key, event.target.value)} className="w-9 h-8 bg-transparent" />
                <span>{value[key]}</span>
              </div>
            </label>
          ))}
        </div>
        {[
          ['heading', 'Γραμματοσειρά τίτλων'], ['body', 'Γραμματοσειρά κειμένου'], ['display', 'Γραμματοσειρά display'], ['ui', 'Γραμματοσειρά περιβάλλοντος'],
        ].map(([key, label]) => (
          <label key={key} className="block text-xs font-bold">{label}
            <select className="mt-1 w-full rounded border border-border bg-background p-2" value={value[key]} onChange={(event) => change(key, event.target.value)}>
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
        <AdminSettingVersionHistory settingKey={GLOBAL_DESIGN_KEY} onRestore={(restored) => setValue({ ...GLOBAL_DESIGN_DEFAULTS, ...(restored || {}) })} />
      </ComicPanel>
    </div>
  );
}
