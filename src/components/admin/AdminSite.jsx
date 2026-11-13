import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { SITE_EVENTS, DEFAULT_SITE, getSiteContent } from '@/data/siteContent';
import { SITE_KEY, fetchSiteRecord } from '@/lib/media';
import AdminSiteVersions, { saveSiteVersion } from '@/components/admin/AdminSiteVersions';
import AdminSitePreview from '@/components/admin/AdminSitePreview';

const inp = 'w-full px-3 py-2.5 rounded-lg border-2 border-border bg-background text-foreground font-body';

function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold tracking-wide text-primary/90">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-foreground/50">{hint}</span>}
    </label>
  );
}
const Text = ({ value, onChange, ...p }) => <input className={inp} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...p} />;
const Area = ({ value, onChange, rows = 4 }) => <textarea className={inp} rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;

// λίστα κειμένων: ένα στοιχείο ανά γραμμή (lines) ή ανά παράγραφο (paras)
const linesOf = (arr) => (arr || []).join('\n');
const toLines = (s) => s.split('\n');
const parasOf = (arr) => (arr || []).join('\n\n');
const toParas = (s) => s.split(/\n{2,}/);

function ListEditor({ items, onChange, blank, render, addLabel }) {
  const set = (i, patch) => onChange(items.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const move = (i, d) => {
    const j = i + d; if (j < 0 || j >= items.length) return;
    const l = [...items]; [l[i], l[j]] = [l[j], l[i]]; onChange(l);
  };
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="border-2 border-border/40 rounded-lg p-2.5 bg-secondary/40 space-y-2">
          {render(it, (patch) => set(i, patch), i)}
          <div className="flex gap-2">
            <ComicButton size="sm" variant="dark" disabled={i === 0} onClick={() => move(i, -1)}>▲</ComicButton>
            <ComicButton size="sm" variant="dark" disabled={i === items.length - 1} onClick={() => move(i, 1)}>▼</ComicButton>
            <ComicButton size="sm" variant="red" onClick={() => onChange(items.filter((_, k) => k !== i))}>🗑 Διαγραφή</ComicButton>
          </div>
        </div>
      ))}
      <ComicButton size="sm" onClick={() => onChange([...items, blank])}>➕ {addLabel}</ComicButton>
    </div>
  );
}

export default function AdminSite({ focusScenario = false }) {
  const [ev, setEv] = useState('heist');
  const [rec, setRec] = useState(null);
  const [all, setAll] = useState({});
  const [d, setD] = useState(() => getSiteContent('heist'));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchSiteRecord().then((r) => { setRec(r); setAll(r?.value || {}); }).catch(() => setMsg({ ok: false, text: 'Δεν φορτώθηκε το περιεχόμενο.' }));
  }, []);

  // φόρτωση φόρμας όταν αλλάζει event ή φορτώνουν οι ρυθμίσεις
  useEffect(() => {
    const base = DEFAULT_SITE[ev];
    const o = all[ev] || {};
    setD({ ...base, ...o, cta: { ...base.cta, ...(o.cta || {}) } });
  }, [ev, all]);

  const up = (patch) => setD((x) => ({ ...x, ...patch }));

  const persist = async (next, okText) => {
    setBusy(true); setMsg(null);
    try {
      if (rec?.id) {
        await saveSiteVersion(all, ev);
        await base44.entities.AppSetting.update(rec.id, { value: next });
      }
      else setRec(await base44.entities.AppSetting.create({ key: SITE_KEY, value: next }));
      setAll(next);
      setMsg({ ok: true, text: okText });
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    setBusy(false);
  };
  const save = () => persist({ ...all, [ev]: d }, 'Αποθηκεύτηκε ✓ — ανανέωσε το /site για να το δεις.');
  const reset = () => {
    if (!window.confirm('Επαναφορά όλων των κειμένων αυτού του event στα αρχικά;')) return;
    const { [ev]: _, ...rest } = all;
    persist(rest, 'Επαναφέρθηκαν τα αρχικά ✓');
  };

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-xl text-primary">🌐 SITE & ΣΕΝΑΡΙΟ</div>
        <p className="text-xs text-foreground/70">
          Γράψε τι είναι το παιχνίδι (σενάριο) και άλλαξε όλα τα κείμενα του /site, ξεχωριστά για κάθε event. Οι φωτογραφίες αλλάζουν από την καρτέλα 🖼️.
        </p>
        <div className="flex gap-2 flex-wrap">
          {SITE_EVENTS.map((e) => (
            <ComicButton key={e.id} size="sm" variant={ev === e.id ? 'yellow' : 'dark'} onClick={() => setEv(e.id)}>{e.label}</ComicButton>
          ))}
          <a href={`/site${ev === 'heist' ? '' : `?event=${ev}`}`} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 text-xs font-bold underline">👁️ Δες το site</a>
        </div>
        {msg && <div className={`text-sm font-bold ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</div>}
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🎭 ΣΕΝΑΡΙΟ — ΤΙ ΕΙΝΑΙ ΤΟ ΠΑΙΧΝΙΔΙ</div>
        <Field label="Μικρός τίτλος πάνω από τον τίτλο"><Text value={d.scenarioKicker} onChange={(v) => up({ scenarioKicker: v })} /></Field>
        <Field label="Τίτλος"><Text value={d.scenarioTitle} onChange={(v) => up({ scenarioTitle: v })} /></Field>
        <Field label="Σενάριο" hint="Μία παράγραφος ανά κενή γραμμή."><Area rows={9} value={parasOf(d.scenario)} onChange={(v) => up({ scenario: toParas(v) })} /></Field>
        <Field label="Βασικά στοιχεία (κουτάκια)" hint="Ένα ανά γραμμή, π.χ. «2 ομάδες, 1 ταμπλό»."><Area rows={4} value={linesOf(d.highlights)} onChange={(v) => up({ highlights: toLines(v) })} /></Field>
      </ComicPanel>

      {!focusScenario && (
      <>
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🏠 ΑΡΧΙΚΗ ΕΝΟΤΗΤΑ</div>
        <Field label="Επάνω γραμμή"><Text value={d.overline} onChange={(v) => up({ overline: v })} /></Field>
        <Field label="Τίτλος" hint="Μία γραμμή ανά γραμμή τίτλου."><Area rows={2} value={linesOf(d.titleLines)} onChange={(v) => up({ titleLines: toLines(v) })} /></Field>
        <Field label="Υπότιτλος"><Area rows={2} value={d.tagline} onChange={(v) => up({ tagline: v })} /></Field>
        <Field label="Κουμπί κράτησης"><Text value={d.cta.label} onChange={(v) => up({ cta: { ...d.cta, label: v } })} /></Field>
        <Field label="Πού πηγαίνει το κουμπί">
          <select className={inp} value={d.cta.path} onChange={(e) => up({ cta: { ...d.cta, path: e.target.value } })}>
            <option value="/invitation">/invitation (ερωτηματολόγιο Heist)</option>
            <option value="/pajama-form">/pajama-form (φόρμα Pajama)</option>
            <option value="/pajama-invite">/pajama-invite (κράτηση θέσης)</option>
            <option value="/modes-form">/modes-form (φόρμα με επιλογή mode)</option>
            <option value="/modes-form?mode=pedi_extended">/modes-form → Pedi-Glam Extended</option>
            <option value="/modes-form?mode=lockdown">/modes-form → Pajama Lockdown</option>
            <option value="/modes-form?mode=beach_bar">/modes-form → Beach Bar Lockdown</option>
            <option value="/modes-form?mode=marathon_4h">/modes-form → 4H Marathon</option>
          </select>
        </Field>
        <Field label="Ημερομηνία & ώρα αυτού του event" hint="Αν το αφήσεις κενό, χρησιμοποιείται η γενική ημερομηνία από τα Πρακτικά.">
          <input type="datetime-local" className={inp} value={d.date || ''} onChange={(e) => up({ date: e.target.value })} />
        </Field>
        <Field label="Κουμπί στο μενού (όνομα event)"><Text value={d.tab} onChange={(v) => up({ tab: v })} /></Field>
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🎬 ΕΝΟΤΗΤΑ ΒΙΝΤΕΟ</div>
        <Field label="Μικρός τίτλος"><Text value={d.videoKicker} onChange={(v) => up({ videoKicker: v })} /></Field>
        <Field label="Τίτλος"><Text value={d.videoTitle} onChange={(v) => up({ videoTitle: v })} /></Field>
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🗓️ ΠΡΟΓΡΑΜΜΑ / ΠΩΣ ΠΑΙΖΕΤΑΙ</div>
        <Field label="Μικρός τίτλος"><Text value={d.programKicker} onChange={(v) => up({ programKicker: v })} /></Field>
        <Field label="Τίτλος"><Text value={d.programTitle} onChange={(v) => up({ programTitle: v })} /></Field>
        <Field label="Σημείωση κάτω από τον τίτλο"><Text value={d.programNote} onChange={(v) => up({ programNote: v })} /></Field>
        <ListEditor
          items={d.program}
          onChange={(program) => up({ program })}
          blank={{ roman: '', title: '', subtitle: '', meta: '', group: '', lines: [''] }}
          addLabel="Προσθήκη βήματος"
          render={(it, set) => (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Αρίθμηση"><Text value={it.roman} onChange={(v) => set({ roman: v })} placeholder="Ι" /></Field>
                <div className="col-span-2"><Field label="Τίτλος"><Text value={it.title} onChange={(v) => set({ title: v })} /></Field></div>
              </div>
              <Field label="Υπότιτλος"><Text value={it.subtitle} onChange={(v) => set({ subtitle: v })} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Διάρκεια / σημείωση"><Text value={it.meta} onChange={(v) => set({ meta: v })} placeholder="60′" /></Field>
                <Field label="Ομάδα (π.χ. Νύχτα)"><Text value={it.group} onChange={(v) => set({ group: v })} /></Field>
              </div>
              <Field label="Περιγραφή" hint="Μία γραμμή ανά σημείο."><Area rows={3} value={linesOf(it.lines)} onChange={(v) => set({ lines: toLines(v) })} /></Field>
            </>
          )}
        />
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">ℹ️ ΠΡΑΚΤΙΚΑ</div>
        <p className="text-[11px] text-foreground/60">Στο κείμενο «Πότε» γράψε {'{date}'} για να μπει αυτόματα η ημερομηνία.</p>
        <ListEditor
          items={d.info}
          onChange={(info) => up({ info })}
          blank={{ title: '', text: '' }}
          addLabel="Προσθήκη"
          render={(it, set) => (
            <>
              <Field label="Τίτλος"><Text value={it.title} onChange={(v) => set({ title: v })} /></Field>
              <Field label="Κείμενο"><Area rows={2} value={it.text} onChange={(v) => set({ text: v })} /></Field>
            </>
          )}
        />
        <Field label="Κουτί «Συμμετοχή»"><Area rows={2} value={d.participation} onChange={(v) => up({ participation: v })} /></Field>
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">❓ ΕΡΩΤΗΣΕΙΣ & ΚΑΝΟΝΕΣ</div>
        <ListEditor
          items={d.faq}
          onChange={(faq) => up({ faq })}
          blank={{ q: '', a: '' }}
          addLabel="Προσθήκη ερώτησης"
          render={(it, set) => (
            <>
              <Field label="Ερώτηση"><Text value={it.q} onChange={(v) => set({ q: v })} /></Field>
              <Field label="Απάντηση"><Area rows={3} value={it.a} onChange={(v) => set({ a: v })} /></Field>
            </>
          )}
        />
      </ComicPanel>

      </>
      )}

      <AdminSitePreview content={d} />
      <AdminSiteVersions eventId={ev} onRestore={(value) => setD(value)} />

      <div className="sticky bottom-0 z-20 -mx-2.5 px-2.5 py-2 bg-background/90 backdrop-blur border-t border-border/40 flex gap-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
        <ComicButton className="flex-1" disabled={busy} onClick={save}>💾 {busy ? 'ΑΠΟΘΗΚΕΥΣΗ…' : 'ΑΠΟΘΗΚΕΥΣΗ'}</ComicButton>
        <ComicButton variant="dark" disabled={busy} onClick={reset}>↩︎ Αρχικά</ComicButton>
      </div>
    </div>
  );
}
