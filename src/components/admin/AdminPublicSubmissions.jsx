import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const LABELS = {
  'join-heist': 'Join the Heist',
  'event-request': 'Custom Event Request',
  feedback: 'Feedback / Hall of Shame',
};

export default function AdminPublicSubmissions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const { items } = await base44.entities.PublicFormSubmission.filter({}, { sort: '-created_date', limit: 200 });
      setRows(items || []);
    } catch (error) {
      setMessage(error.message || 'Δεν φορτώθηκαν οι δημόσιες υποβολές.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id) {
    if (!window.confirm('Να διαγραφεί οριστικά αυτή η υποβολή;')) return;
    try {
      await base44.entities.PublicFormSubmission.delete(id);
      setRows((current) => current.filter((row) => row.id !== id));
      setMessage('Η υποβολή διαγράφηκε.');
    } catch (error) {
      setMessage(error.message || 'Η διαγραφή απέτυχε.');
    }
  }

  return (
    <ComicPanel className="bg-card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-heading text-lg text-primary">ΔΗΜΟΣΙΕΣ ΥΠΟΒΟΛΕΣ</div>
        <ComicButton size="sm" variant="dark" onClick={load} disabled={loading}>ΑΝΑΝΕΩΣΗ</ComicButton>
      </div>
      {message && <p role="status" className="text-sm">{message}</p>}
      {loading ? <p className="text-sm text-foreground/60">Φόρτωση υποβολών…</p> :
        rows.length === 0 ? <p className="text-sm text-foreground/60">Δεν υπάρχουν υποβολές.</p> :
          rows.map((row) => (
            <div key={row.id} className="border-b border-border/60 py-3 space-y-1">
              <div className="flex justify-between gap-2">
                <strong className="text-primary">{LABELS[row.type] || row.type}</strong>
                <span className="text-xs text-foreground/50">{new Date(row.submittedAt || row.created_date).toLocaleString('el-GR')}</span>
              </div>
              <div className="text-sm font-bold">{row.name}</div>
              {row.photoUrl && <a href={row.photoUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Προβολή συνημμένης φωτογραφίας</a>}
              {[['Επικοινωνία', row.contact], ['Email', row.email], ['Τύπος event', row.eventType], ['Ημερομηνία', row.eventDate], ['Συμμετέχοντες', row.guests], ['Μήνυμα', row.message], ['Πρόταση', row.suggestion]]
                .filter(([, value]) => value)
                .map(([label, value]) => <p key={label} className="text-sm"><span className="text-primary">{label}:</span> {value}</p>)}
              <div className="flex justify-end">
                <ComicButton size="sm" variant="red" onClick={() => remove(row.id)}>ΔΙΑΓΡΑΦΗ ΥΠΟΒΟΛΗΣ</ComicButton>
              </div>
            </div>
          ))}
      }
    </ComicPanel>
  );
}
