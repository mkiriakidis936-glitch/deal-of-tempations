import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import ComicPanel from '@/components/comic/ComicPanel';
import AdminGlobalDesign from '@/components/admin/AdminGlobalDesign';
import AdminVipCode from '@/components/admin/AdminVipCode';
import AdminSettingVersionHistory from '@/components/admin/AdminSettingVersionHistory';
import { APP_BUILD, APP_BUILT_AT, APP_VERSION, fetchServerVersion, isSameBuild, installUpdate, autoCheckEnabled, setAutoCheck, lastCheckAt, markChecked } from '@/lib/appVersion';
import { VERSIONED_SETTINGS } from '@/lib/adminVersionHistory';
import changelog from '../../../CHANGELOG.md?raw';

const formatDate = (value) => (value ? new Date(value).toLocaleString('el-GR') : '—');

const STEP_LABEL = { download: 'Λήψη ενημέρωσης…', install: 'Εγκατάσταση…', restart: 'Επανεκκίνηση…' };
const STEP_PROGRESS = { download: 30, install: 70, restart: 100 };

// «Ενημέρωση λογισμικού» όπως στο iPhone: έλεγχος, τι νέο, εγκατάσταση με πρόοδο.
function SoftwareUpdate() {
  const [server, setServer] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [step, setStep] = useState('');
  const [auto, setAuto] = useState(autoCheckEnabled());
  const [checkedAt, setCheckedAt] = useState(lastCheckAt());
  const check = async () => {
    setChecking(true); setError('');
    try { setServer(await fetchServerVersion()); markChecked(); setCheckedAt(Date.now()); }
    catch (e) { setError(e.message || 'Δεν ήταν δυνατός ο έλεγχος. Έλεγξε τη σύνδεση.'); }
    finally { setChecking(false); }
  };
  useEffect(() => { check(); }, []);
  const available = server && !isSameBuild(server);
  const install = () => installUpdate(setStep);

  return (
    <section className="overflow-hidden rounded-3xl bg-[#1C1C1E] text-[#F5F1E8]">
      <div className="flex items-center gap-4 p-5">
        <img src="/icons/icon-192.png" onError={(e) => { e.currentTarget.src = '/icons/icon-512.png'; }} alt="" className="h-16 w-16 shrink-0 rounded-[18px] bg-black" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8C26B]">Ενημέρωση λογισμικού</div>
          <div className="text-lg font-bold">Deal of Temptation {available ? server.version : APP_VERSION}</div>
          <div className="text-xs text-white/55">
            {checking ? 'Έλεγχος για ενημερώσεις…' : available ? 'Διαθέσιμη ενημέρωση' : server ? '✓ Η εφαρμογή είναι ενημερωμένη' : error ? 'Ο έλεγχος απέτυχε' : '—'}
          </div>
        </div>
        {checking && <span className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-[#E8C26B]" aria-hidden="true" />}
      </div>

      {available && (
        <div className="space-y-3 border-t border-white/10 p-5">
          <div className="text-sm font-bold">Τι νέο στην {server.version}</div>
          {server.notes
            ? <div className="prose prose-invert prose-sm max-h-72 max-w-none overflow-y-auto text-sm text-white/80 [&_li]:my-1 [&_ul]:pl-4"><ReactMarkdown>{server.notes}</ReactMarkdown></div>
            : <p className="text-sm text-white/60">Βελτιώσεις και διορθώσεις.</p>}
          {step ? (
            <div className="space-y-2" role="status">
              <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#E8C26B] transition-all duration-500" style={{ width: `${STEP_PROGRESS[step]}%` }} /></div>
              <div className="text-xs text-white/60">{STEP_LABEL[step]}</div>
            </div>
          ) : (
            <button type="button" onClick={install} className="h-12 w-full rounded-full bg-[#E8C26B] text-base font-bold text-black">Εγκατάσταση τώρα</button>
          )}
          <p className="text-[11px] text-white/45">Η ενημέρωση παίρνει λίγα δευτερόλεπτα. Οι παρτίδες σε εξέλιξη συνεχίζουν κανονικά μετά την επανεκκίνηση.</p>
        </div>
      )}

      {error && <div className="border-t border-white/10 px-5 py-3 text-xs text-[#FF8A80]">{error}</div>}

      <div className="divide-y divide-white/10 border-t border-white/10">
        <div className="flex min-h-[52px] items-center justify-between gap-3 px-5">
          <span className="text-sm" id="auto-update-label">Αυτόματος έλεγχος ενημερώσεων</span>
          <button type="button" role="switch" aria-checked={auto} aria-labelledby="auto-update-label" onClick={() => { setAuto(!auto); setAutoCheck(!auto); }}
            className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${auto ? 'bg-[#30D158]' : 'bg-white/20'}`}>
            <span className={`absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-all ${auto ? 'left-[22px]' : 'left-[2px]'}`} />
          </button>
        </div>
        <button type="button" onClick={check} disabled={checking || !!step} className="flex min-h-[52px] w-full items-center justify-between px-5 text-left text-sm disabled:opacity-50">
          <span className="shrink-0 text-[#E8C26B]">Έλεγχος τώρα</span>
          <span className="text-right text-xs text-white/45">{checkedAt ? formatDate(checkedAt) : ''}</span>
        </button>
        <details className="px-5 py-3 text-sm">
          <summary className="cursor-pointer text-white/70">Στοιχεία έκδοσης</summary>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <dt className="text-white/50">Εφαρμογή</dt><dd>{APP_VERSION} · {APP_BUILD}</dd>
            <dt className="text-white/50">Build</dt><dd>{formatDate(APP_BUILT_AT)}</dd>
            <dt className="text-white/50">Server</dt><dd>{server ? `${server.version} · ${server.build}` : '—'}</dd>
            <dt className="text-white/50">Εκκίνηση server</dt><dd>{formatDate(server?.serverStartedAt)}</dd>
          </dl>
        </details>
      </div>
    </section>
  );
}

export default function AdminSettings() {
  return (
    <div className="space-y-3">
      <SoftwareUpdate />
      <AdminVipCode />
      <AdminGlobalDesign />
      <ComicPanel className="bg-card space-y-4">
        <div className="font-heading text-xl text-primary">Ιστορικό ρυθμίσεων</div>
        {VERSIONED_SETTINGS.filter((item) => item.key !== 'admin_global_design').map((item) => (
          <div key={item.key} className="border-t border-border/40 pt-3">
            <AdminSettingVersionHistory settingKey={item.key} title={item.label} embedded />
          </div>
        ))}
      </ComicPanel>
      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-xl text-primary">Τι νέο υπάρχει</div>
        <div className="prose prose-invert prose-sm max-w-none text-sm [&_h1]:hidden [&_h2]:mt-3 [&_h2]:font-heading [&_h2]:text-primary [&_li]:ml-4 [&_li]:list-disc">
          <ReactMarkdown>{changelog}</ReactMarkdown>
        </div>
      </ComicPanel>
    </div>
  );
}
