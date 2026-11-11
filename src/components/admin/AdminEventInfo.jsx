import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const FIELDS = [
  {
    key: 'event_date',
    label: 'Ημερομηνία & Ώρα',
    type: 'datetime-local',
    icon: '📅',
    hint: 'Χρησιμοποιείται και για την αντίστροφη μέτρηση στην πρόσκληση.',
  },
  {
    key: 'event_location',
    label: 'Τοποθεσία',
    type: 'text',
    icon: '📍',
    hint: 'Διεύθυνση ή όνομα χώρου.',
  },
  {
    key: 'event_arrival',
    label: 'Οδηγίες Άφιξης',
    type: 'textarea',
    icon: '🚶',
    hint: 'Πώς να φτάσουν, πότε να έρθουν, τι να φέρουν.',
  },
  {
    key: 'event_notes',
    label: 'Άλλες Πρακτικές Πληροφορίες',
    type: 'textarea',
    icon: '📝',
    hint: 'Οτιδήποτε άλλο θέλεις να γνωρίζουν.',
  },
];

function toDatetimeLocal(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminEventInfo() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const results = await Promise.all(
          FIELDS.map((f) => base44.entities.AppSetting.filter({ key: f.key }, { limit: 1 }))
        );
        const data = {};
        FIELDS.forEach((f, i) => {
          if (results[i].items?.length > 0 && results[i].items[0].value) {
            data[f.key] =
              f.key === 'event_date'
                ? toDatetimeLocal(results[i].items[0].value)
                : results[i].items[0].value;
          }
        });
        setValues(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      for (const field of FIELDS) {
        const val = values[field.key] || '';
        const { items } = await base44.entities.AppSetting.filter({ key: field.key }, { limit: 1 });
        if (items?.length > 0) {
          await base44.entities.AppSetting.update(items[0].id, { value: val });
        } else if (val) {
          await base44.entities.AppSetting.create({ key: field.key, value: val });
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Σφάλμα αποθήκευσης.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center text-foreground/50 py-8 font-body">Φόρτωση...</div>
    );
  }

  return (
    <ComicPanel className="bg-card space-y-4">
      <div className="font-heading text-xl text-primary">📅 ΠΡΑΚΤΙΚΕΣ ΠΛΗΡΟΦΟΡΙΕΣ ΕΚΔΗΛΩΣΗΣ</div>
      <div className="text-sm text-foreground/70 font-body">
        Καταχώρησε τις πληροφορίες που θέλεις να βλέπουν οι προσκεκλημένες στο δημόσιο site
        (<span className="text-primary">/portal</span>). Όσα πεδία αφήσεις κενά δεν θα εμφανίζονται.
      </div>
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label className="text-sm font-bold block mb-1 text-foreground">
            {field.icon} {field.label}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              value={values[field.key] || ''}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              placeholder="..."
              className="w-full border-2 border-border rounded-lg px-3 py-2 bg-secondary text-foreground text-sm h-24 font-body"
            />
          ) : (
            <input
              type={field.type}
              value={values[field.key] || ''}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              className="w-full border-2 border-border rounded-lg px-3 py-2 bg-secondary text-foreground font-body"
            />
          )}
          {field.hint && (
            <div className="text-xs text-foreground/50 mt-1 font-body">{field.hint}</div>
          )}
        </div>
      ))}
      <div className="flex items-center gap-3">
        <ComicButton variant="green" onClick={handleSave} disabled={saving}>
          {saving ? 'ΑΠΟΘΗΚΕΥΣΗ...' : '✓ ΑΠΟΘΗΚΕΥΣΗ'}
        </ComicButton>
        {saved && <span className="text-sm text-primary font-bold">✓ Αποθηκεύτηκε</span>}
      </div>
    </ComicPanel>
  );
}