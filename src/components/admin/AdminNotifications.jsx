import React, { useCallback, useEffect, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import {
  pushSupported, isStandalone, isIOS, currentSubscription, enablePush, disablePush,
  sendTestPush, pushStatus, canInstall, onInstallChange, promptInstall,
} from '@/lib/push';

const when = (d) => new Date(d).toLocaleString('el-GR', { dateStyle: 'short', timeStyle: 'short' });

export default function AdminNotifications() {
  const [on, setOn] = useState(false);
  const [status, setStatus] = useState({ devices: [], history: [] });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [installable, setInstallable] = useState(canInstall());

  const supported = pushSupported() && import.meta.env.PROD;
  const needsInstall = isIOS() && !isStandalone();
  const perm = typeof Notification !== 'undefined' ? Notification.permission : 'denied';

  const load = useCallback(async () => {
    try {
      setStatus(await pushStatus());
      setOn(!!(await currentSubscription()));
    } catch (e) { setMsg({ ok: false, text: e.message }); }
  }, []);

  useEffect(() => { load(); return onInstallChange(() => setInstallable(canInstall())); }, [load]);

  const run = async (fn, okText) => {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg(okText ? { ok: true, text: okText } : null); await load(); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-xl text-primary">🔔 ΕΙΔΟΠΟΙΗΣΕΙΣ (PUSH)</div>
        <p className="text-xs font-body text-foreground/70">
          Παίρνεις ειδοποίηση στη συσκευή σου όταν κάποια κοπέλα συμπληρώνει το <b>/invitation</b>, το <b>/pajama-invite</b> ή το <b>/pajama-form</b>.
          Ενεργοποίησέ τες σε κάθε συσκευή που θες (κινητό, MacBook).
        </p>

        {!supported && (
          <div className="text-sm text-amber-300 font-bold">
            {import.meta.env.PROD ? 'Αυτός ο browser δεν υποστηρίζει ειδοποιήσεις.' : 'Οι ειδοποιήσεις δουλεύουν μόνο στο deploy, όχι στο npm run dev.'}
          </div>
        )}
        {needsInstall && (
          <div className="text-sm text-amber-300 font-bold">
            📱 Στο iPhone/iPad: πάτα Κοινοποίηση ⬆️ → «Προσθήκη στην οθόνη Αφετηρίας», άνοιξε την εφαρμογή από εκεί, και μετά ενεργοποίησε τις ειδοποιήσεις.
          </div>
        )}
        {perm === 'denied' && supported && (
          <div className="text-sm text-red-400 font-bold">Οι ειδοποιήσεις είναι μπλοκαρισμένες για αυτό το site. Άλλαξέ το από τις ρυθμίσεις του browser/συσκευής.</div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {on ? (
            <ComicButton variant="dark" disabled={busy} onClick={() => run(disablePush, 'Απενεργοποιήθηκαν σε αυτή τη συσκευή.')}>🔕 Απενεργοποίηση εδώ</ComicButton>
          ) : (
            <ComicButton disabled={busy || !supported || needsInstall} onClick={() => run(enablePush, 'Ενεργοποιήθηκαν ✓')}>🔔 Ενεργοποίηση σε αυτή τη συσκευή</ComicButton>
          )}
          <ComicButton variant="green" disabled={busy || !status.devices.length} onClick={() => run(sendTestPush, 'Στάλθηκε δοκιμαστική ειδοποίηση ✓')}>🧪 Δοκιμή</ComicButton>
          <span className="text-xs font-bold">{on ? '✅ Ενεργές εδώ' : '⚪ Ανενεργές εδώ'}</span>
        </div>
        {msg && <div className={`text-sm font-bold ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</div>}

        {!!status.devices.length && (
          <div className="text-xs text-foreground/70">
            <div className="font-bold mb-1">Συσκευές με ειδοποιήσεις ({status.devices.length}):</div>
            {status.devices.map((d, i) => <div key={i}>• {d.device || 'Συσκευή'} — από {when(d.created_date)}</div>)}
          </div>
        )}
      </ComicPanel>

      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-lg">📲 ΕΓΚΑΤΑΣΤΑΣΗ ΩΣ ΕΦΑΡΜΟΓΗ</div>
        {isStandalone() ? (
          <div className="text-sm font-bold text-green-400">✅ Τρέχεις ήδη ως εγκατεστημένη εφαρμογή.</div>
        ) : (
          <>
            {installable && <ComicButton onClick={() => promptInstall()}>📲 Εγκατάσταση τώρα</ComicButton>}
            <ul className="text-xs text-foreground/70 space-y-1 list-disc pl-4">
              <li><b>Κινητό iPhone/iPad (Safari):</b> Κοινοποίηση ⬆️ → Προσθήκη στην οθόνη Αφετηρίας.</li>
              <li><b>Κινητό Android (Chrome):</b> μενού ⋮ → Εγκατάσταση εφαρμογής.</li>
              <li><b>MacBook (Chrome/Edge):</b> εικονίδιο εγκατάστασης δεξιά στη μπάρα διευθύνσεων.</li>
              <li><b>MacBook (Safari):</b> Αρχείο → Προσθήκη στο Dock.</li>
            </ul>
            <p className="text-[11px] text-foreground/50">Μετά την εγκατάσταση χρειάζεται να συνδεθείς μία φορά μέσα στην εφαρμογή.</p>
          </>
        )}
      </ComicPanel>

      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-lg">🕘 ΤΕΛΕΥΤΑΙΕΣ ΕΙΔΟΠΟΙΗΣΕΙΣ</div>
        {!status.history.length && <div className="text-xs text-foreground/60">Δεν έχει έρθει καμία ακόμα.</div>}
        {status.history.map((n) => (
          <a key={n.id} href={n.url || '/admin'} className="block border-2 border-border/40 rounded-lg p-2 bg-secondary/40 hover:bg-secondary">
            <div className="text-sm font-bold">{n.title}</div>
            <div className="text-xs text-foreground/70">{n.body}</div>
            <div className="text-[10px] text-foreground/50">{when(n.created_date)}</div>
          </a>
        ))}
      </ComicPanel>
    </div>
  );
}
