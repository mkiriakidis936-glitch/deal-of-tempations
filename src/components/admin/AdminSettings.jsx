import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import ComicPanel from '@/components/comic/ComicPanel';
import AdminGlobalDesign from '@/components/admin/AdminGlobalDesign';
import AdminSettingVersionHistory from '@/components/admin/AdminSettingVersionHistory';
import { APP_BUILD, APP_BUILT_AT, APP_VERSION, fetchServerVersion, isSameBuild, reloadToLatest } from '@/lib/appVersion';
import { VERSIONED_SETTINGS } from '@/lib/adminVersionHistory';
import changelog from '../../../CHANGELOG.md?raw';

const formatDate = (value) => (value ? new Date(value).toLocaleString('el-GR') : '—');

function VersionCard() {
  const [server, setServer] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const check = async () => {
    setChecking(true); setError('');
    try { setServer(await fetchServerVersion()); } catch (e) { setError(e.message); } finally { setChecking(false); }
  };
  useEffect(() => { check(); }, []);
  const outdated = server && !isSameBuild(server);
  const rows = [
    ['Έκδοση εφαρμογής', APP_VERSION],
    ['Build', APP_BUILD],
    ['Ημερομηνία build', formatDate(APP_BUILT_AT)],
    ['Έκδοση server', server ? `${server.version} · ${server.build}` : '—'],
    ['Εκκίνηση server', formatDate(server?.serverStartedAt)],
  ];
  return (
    <ComicPanel className="bg-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-heading text-xl text-primary">Έκδοση</div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${outdated ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
          {outdated ? `Διαθέσιμη η ${server.version} (${server.build})` : 'Ενημερωμένη'}
        </span>
      </div>
      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border/40 px-3 py-2">
            <dt className="text-[11px] text-foreground/55">{label}</dt>
            <dd className="font-heading text-sm">{value}</dd>
          </div>
        ))}
      </dl>
      {error && <div className="text-xs text-red-400">{error}</div>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="adm-pill" onClick={check} disabled={checking}>{checking ? 'Έλεγχος…' : 'Έλεγχος για ενημέρωση'}</button>
        {outdated && <button type="button" className="adm-pill" onClick={reloadToLatest}>Ανανέωση τώρα</button>}
      </div>
    </ComicPanel>
  );
}

export default function AdminSettings() {
  return (
    <div className="space-y-3">
      <VersionCard />
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
