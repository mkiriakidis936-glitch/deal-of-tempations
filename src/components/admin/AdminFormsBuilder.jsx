import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const KEY = 'admin_form_questions';
const FORM_TYPES = [{ id: 'modes', label: 'Επιλογή Modes' }, { id: 'pajama', label: 'Pajama Form' }, { id: 'heist', label: 'Arrest & Heist Intake' }, { id: 'invitation', label: 'Invitation Form' }];
const blank = () => ({ id: `q-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, label: '', type: 'text', options: [], required: false, image: '' });

export default function AdminFormsBuilder() {
  const [formType, setFormType] = useState('modes');
  const [forms, setForms] = useState({ modes: [], pajama: [], heist: [], invitation: [] });
  const [record, setRecord] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    base44.entities.AppSetting.filter({ key: KEY }, { limit: 1 }).then(({ items }) => {
      const found = items?.[0] || null;
      setRecord(found);
      if (found?.value?.forms) setForms({ modes: [], pajama: [], heist: [], invitation: [], ...found.value.forms });
    }).catch((error) => setMessage(error.message || 'Δεν φορτώθηκαν οι ερωτήσεις.'));
  }, []);

  const list = forms[formType] || [];
  const update = (patch) => setEditing((current) => ({ ...current, ...patch }));

  async function save() {
    if (!editing?.label?.trim()) { setMessage('Συμπλήρωσε το κείμενο της ερώτησης.'); return; }
    if (editing.type === 'select' && !(editing.options || []).some((option) => option.trim())) { setMessage('Πρόσθεσε τουλάχιστον μία επιλογή.'); return; }
    setBusy(true); setMessage('');
    try {
      const question = { ...editing, label: editing.label.trim(), options: (editing.options || []).map((x) => x.trim()).filter(Boolean) };
      const nextList = list.some((item) => item.id === question.id) ? list.map((item) => item.id === question.id ? question : item) : [...list, question];
      const nextForms = { ...forms, [formType]: nextList };
      const value = { forms: nextForms };
      let saved;
      if (record?.id) saved = await base44.entities.AppSetting.update(record.id, { value });
      else saved = await base44.entities.AppSetting.create({ key: KEY, value });
      setRecord(saved?.id ? saved : record); setForms(nextForms); setEditing(null); setMessage('Η ερώτηση αποθηκεύτηκε.');
    } catch (error) { setMessage(error.message || 'Αποτυχία αποθήκευσης.'); }
    finally { setBusy(false); }
  }

  async function remove(id) {
    if (!window.confirm('Να διαγραφεί η πρόσθετη ερώτηση;')) return;
    const nextForms = { ...forms, [formType]: list.filter((item) => item.id !== id) };
    setBusy(true);
    try {
      if (record?.id) await base44.entities.AppSetting.update(record.id, { value: { forms: nextForms } });
      setForms(nextForms); if (editing?.id === id) setEditing(null); setMessage('Η ερώτηση διαγράφηκε.');
    } catch (error) { setMessage(error.message || 'Αποτυχία διαγραφής.'); }
    finally { setBusy(false); }
  }

  return <div className="space-y-3">
    <ComicPanel className="bg-card space-y-2">
      <div className="font-heading text-xl text-primary">FORMS MANAGER</div>
      <p className="text-xs text-foreground/60">Διαχείριση πρόσθετων ερωτήσεων στις υπάρχουσες φόρμες. Τα υφιστάμενα πεδία, οι υποχρεωτικοί έλεγχοι και η διαδικασία υποβολής παραμένουν αμετάβλητα.</p>
      <select className="w-full rounded border border-border bg-background p-2" value={formType} onChange={(e) => { setFormType(e.target.value); setEditing(null); }} >{FORM_TYPES.map((form) => <option key={form.id} value={form.id}>{form.label}</option>)}</select>
      <ComicButton onClick={() => setEditing(blank())}>＋ ΝΕΑ ΕΡΩΤΗΣΗ</ComicButton>
    </ComicPanel>
    {message && <ComicPanel className="bg-secondary"><div className="text-sm font-bold">{message}</div></ComicPanel>}
    {editing && <ComicPanel className="bg-card space-y-3">
      <div className="font-heading text-lg">ΕΠΕΞΕΡΓΑΣΙΑ ΕΡΩΤΗΣΗΣ</div>
      <label className="block text-xs font-bold">Ερώτηση / τίτλος<input className="mt-1 w-full rounded border border-border bg-background p-2" value={editing.label} onChange={(e) => update({ label: e.target.value })} /></label>
      <label className="block text-xs font-bold">Τύπος απάντησης<select className="mt-1 w-full rounded border border-border bg-background p-2" value={editing.type} onChange={(e) => update({ type: e.target.value })}><option value="text">Σύντομο κείμενο</option><option value="textarea">Μεγάλο κείμενο</option><option value="select">Επιλογή από λίστα</option></select></label>
      {editing.type === 'select' && <label className="block text-xs font-bold">Επιλογές (μία ανά γραμμή)<textarea rows={4} className="mt-1 w-full rounded border border-border bg-background p-2" value={(editing.options || []).join('\n')} onChange={(e) => update({ options: e.target.value.split('\n') })} /></label>}
      <label className="block text-xs font-bold">URL εικόνας (προαιρετικό)<input className="mt-1 w-full rounded border border-border bg-background p-2" value={editing.image || ''} onChange={(e) => update({ image: e.target.value })} placeholder="https://..." /></label>
      {editing.image && <img src={editing.image} alt="" className="max-h-36 rounded-lg object-cover" />}
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!editing.required} onChange={(e) => update({ required: e.target.checked })} /> Υποχρεωτική ερώτηση</label>
      <div className="flex gap-2"><ComicButton variant="green" disabled={busy} onClick={save}>ΑΠΟΘΗΚΕΥΣΗ</ComicButton><ComicButton variant="dark" onClick={() => setEditing(null)}>ΑΚΥΡΟ</ComicButton></div>
    </ComicPanel>}
    <div className="space-y-2">
      {list.length === 0 && <ComicPanel className="bg-card text-sm text-foreground/60">Δεν υπάρχουν πρόσθετες ερωτήσεις σε αυτή τη φόρμα.</ComicPanel>}
      {list.map((question) => <ComicPanel key={question.id} className="bg-card space-y-2">
        <div className="font-bold">{question.label} {question.required ? '*' : ''}</div>
        <div className="text-xs text-foreground/60">{question.type} · {(question.options || []).join(' / ')}</div>
        {question.image && <img src={question.image} alt="" className="max-h-28 rounded object-cover" />}
        <div className="flex gap-2"><ComicButton size="sm" variant="dark" onClick={() => setEditing({ ...question })}>ΕΠΕΞΕΡΓΑΣΙΑ</ComicButton><ComicButton size="sm" variant="red" disabled={busy} onClick={() => remove(question.id)}>ΔΙΑΓΡΑΦΗ</ComicButton></div>
      </ComicPanel>)}
    </div>
  </div>;
}
