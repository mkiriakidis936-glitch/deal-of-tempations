import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { SITE_EVENTS, SITE_HOME_ID, DEFAULT_SITE } from '@/data/siteContent';
import { SITE_KEY, fetchSiteRecord } from '@/lib/media';
import AdminSiteVersions, { saveSiteVersion } from '@/components/admin/AdminSiteVersions';
import AdminSitePreview from '@/components/admin/AdminSitePreview';

// Admin → Ιστοσελίδα: επεξεργασία του νέου /site (Αρχική + 4 εμπειρίες), σε στυλ iOS 27.
const PAGES = [{ id: SITE_HOME_ID, label: '🏠 Αρχική' }, ...SITE_EVENTS];
const urlOf = (id) => (id === SITE_HOME_ID ? '/site' : `/site?event=${id}`);

const linesOf = (arr) => (arr || []).join('\n');
const toLines = (s) => s.split('\n');
const parasOf = (arr) => (arr || []).join('\n\n');
const toParas = (s) => s.split(/\n{2,}/);
const clean = (list) => (list || []).map((item) => (typeof item === 'string' ? item.trim() : item)).filter((item) => (typeof item === 'string' ? item : true));

const INPUT = 'w-full rounded-xl bg-[#2C2C2E] px-3.5 py-2.5 text-[15px] text-white placeholder:text-white/30';

function Group({ title, footer, children }) {
  return (
    <section>
      {title && <h3 className="mb-1.5 px-4 text-[13px] font-medium text-white/60">{title}</h3>}
      <div className="divide-y divide-white/10 overflow-hidden rounded-2xl bg-[#1C1C1E]">{children}</div>
      {footer && <p className="mt-1.5 px-4 text-[12.5px] leading-snug text-white/45">{footer}</p>}
    </section>
  );
}

function Row({ label, hint, children }) {
  return (
    <label className="block px-4 py-3">
      <span className="mb-1.5 block text-[13px] font-medium text-white/80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-white/40">{hint}</span>}
    </label>
  );
}
const Text = ({ value, onChange, ...p }) => <input className={INPUT} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...p} />;
const Area = ({ value, onChange, rows = 4 }) => <textarea className={`${INPUT} leading-relaxed`} rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;

function ListEditor({ items = [], onChange, blank, render, addLabel }) {
  const set = (i, patch) => onChange(items.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const move = (i, d) => {
    const j = i + d; if (j < 0 || j >= items.length) return;
    const l = [...items]; [l[i], l[j]] = [l[j], l[i]]; onChange(l);
  };
  const icon = 'flex h-9 w-9 items-center justify-center rounded-full bg-[#2C2C2E] text-white/80 disabled:opacity-30';
  return (
    <>
      {items.map((it, i) => (
        <div key={i} className="space-y-2 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-white/45">#{i + 1}</span>
            <div className="flex gap-1.5">
              <button type="button" className={icon} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Πάνω"><ChevronUp size={16} /></button>
              <button type="button" className={icon} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Κάτω"><ChevronDown size={16} /></button>
              <button type="button" className={`${icon} text-[#FF453A]`} onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Διαγραφή"><Trash2 size={15} /></button>
            </div>
          </div>
          {render(it, (patch) => set(i, patch))}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, blank])} className="flex w-full items-center gap-2 px-4 py-3 text-left text-[15px] font-medium text-[#0A84FF]">
        <Plus size={18} /> {addLabel}
      </button>
    </>
  );
}

const sub = 'text-[12px] font-medium text-white/50';

export default function AdminSite() {
  const [ev, setEv] = useState(SITE_HOME_ID);
  const [rec, setRec] = useState(null);
  const [all, setAll] = useState({});
  const [d, setD] = useState(DEFAULT_SITE[SITE_HOME_ID]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetchSiteRecord().then((r) => { setRec(r); setAll(r?.value || {}); }).catch(() => setMsg({ ok: false, text: 'Δεν φορτώθηκε το περιεχόμενο.' }));
  }, []);

  useEffect(() => {
    const base = DEFAULT_SITE[ev];
    const o = all[ev] || {};
    setD({ ...base, ...o, cta: { ...(base.cta || {}), ...(o.cta || {}) } });
  }, [ev, all]);

  const dirty = useMemo(() => {
    const base = DEFAULT_SITE[ev];
    const o = all[ev] || {};
    return JSON.stringify({ ...base, ...o, cta: { ...(base.cta || {}), ...(o.cta || {}) } }) !== JSON.stringify(d);
  }, [ev, all, d]);

  const up = (patch) => setD((x) => ({ ...x, ...patch }));
  const isHome = ev === SITE_HOME_ID;

  const persist = async (next, okText) => {
    setBusy(true); setMsg(null);
    try {
      if (rec?.id) {
        await saveSiteVersion(all, ev, d);
        await base44.entities.AppSetting.update(rec.id, { value: next });
      } else setRec(await base44.entities.AppSetting.create({ key: SITE_KEY, value: next }));
      setAll(next);
      setMsg({ ok: true, text: okText });
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    setBusy(false);
  };
  const tidy = (x) => ({
    ...x,
    titleLines: clean(x.titleLines),
    ...(x.marquee ? { marquee: clean(x.marquee) } : {}),
    ...(x.highlights ? { highlights: clean(x.highlights) } : {}),
    ...(x.scenario ? { scenario: clean(x.scenario) } : {}),
  });
  const save = () => persist({ ...all, [ev]: tidy(d) }, 'Αποθηκεύτηκε ✓ Το /site ενημερώθηκε.');
  const reset = () => {
    if (!window.confirm('Επαναφορά όλων των κειμένων αυτής της σελίδας στα αρχικά;')) return;
    const { [ev]: _removed, ...rest } = all;
    persist(rest, 'Επαναφέρθηκαν τα αρχικά ✓');
  };
  const choose = (id) => {
    if (dirty && !window.confirm('Έχεις αλλαγές που δεν αποθηκεύτηκαν. Να χαθούν;')) return;
    setEv(id); setMsg(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-28 text-white">
      <header className="space-y-3">
        <p className="text-[15px] text-white/60">Όλα τα κείμενα του δημόσιου site. Οι φωτογραφίες και τα βίντεο αλλάζουν από «Φωτογραφίες & βίντεο».</p>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Σελίδα του site">
          {PAGES.map((page) => (
            <button key={page.id} type="button" role="tab" aria-selected={ev === page.id} onClick={() => choose(page.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold ${ev === page.id ? 'bg-white text-black' : 'bg-[#1C1C1E] text-white/80'}`}>
              {page.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={urlOf(ev)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1C1C1E] px-4 text-[14px] font-medium text-[#0A84FF]"><ExternalLink size={16} /> Άνοιγμα σελίδας</a>
          <button type="button" onClick={() => setPreview((v) => !v)} className="inline-flex h-10 items-center rounded-full bg-[#1C1C1E] px-4 text-[14px] font-medium text-[#0A84FF]">{preview ? 'Κλείσιμο προεπισκόπησης' : 'Ζωντανή προεπισκόπηση'}</button>
        </div>
        {msg && <div role="status" className={`rounded-xl px-4 py-3 text-[14px] font-medium ${msg.ok ? 'bg-[#30D158]/15 text-[#30D158]' : 'bg-[#FF453A]/15 text-[#FF6961]'}`}>{msg.text}</div>}
      </header>

      {preview && <AdminSitePreview content={d} eventId={ev} />}

      <Group title="Κεντρική εικόνα (hero)" footer={isHome ? 'Η πρώτη οθόνη του site. Η φωτογραφία αλλάζει από Φωτογραφίες & βίντεο → Site & TV → «Site — κεντρικό φόντο».' : 'Η φωτογραφία είναι η «Κεντρική εικόνα» του mode στο MODE MEDIA CENTER.'}>
        <Row label="Μικρή γραμμή πάνω από τον τίτλο"><Text value={d.overline} onChange={(v) => up({ overline: v })} /></Row>
        <Row label="Τίτλος" hint="Μία γραμμή τίτλου ανά σειρά."><Area rows={2} value={linesOf(d.titleLines)} onChange={(v) => up({ titleLines: toLines(v) })} /></Row>
        <Row label="Υπότιτλος"><Area rows={3} value={d.tagline} onChange={(v) => up({ tagline: v })} /></Row>
        <Row label="Κουμπί κράτησης" hint={isHome ? 'Οδηγεί στις εμπειρίες της Αρχικής.' : `Οδηγεί στη φόρμα: ${d.cta?.path || '/forms'}`}>
          <Text value={d.cta?.label === 'ΚΛΕΙΣΕ ΘΕΣΗ' ? 'Κλείσε θέση' : d.cta?.label} onChange={(v) => up({ cta: { ...d.cta, label: v } })} />
        </Row>
        {!isHome && (
          <>
            <Row label="Όνομα στην κάρτα της εμπειρίας"><Text value={d.tab} onChange={(v) => up({ tab: v })} /></Row>
            <Row label="Ημερομηνία & ώρα" hint="Κενό = η γενική ημερομηνία της εκδήλωσης.">
              <input type="datetime-local" className={INPUT} value={d.date || ''} onChange={(e) => up({ date: e.target.value })} />
            </Row>
          </>
        )}
      </Group>

      {isHome ? (
        <>
          <Group title="Κυλιόμενες λέξεις" footer="Η χρυσή ταινία κάτω από το hero. Μία λέξη ή φράση ανά γραμμή.">
            <Row label="Λέξεις"><Area rows={5} value={linesOf(d.marquee)} onChange={(v) => up({ marquee: toLines(v) })} /></Row>
          </Group>
          <Group title="Τελικό κάλεσμα" footer="Η τελευταία ενότητα πριν από το υποσέλιδο.">
            <Row label="Τίτλος"><Text value={d.finalTitle} onChange={(v) => up({ finalTitle: v })} /></Row>
            <Row label="Κείμενο"><Area rows={2} value={d.finalText} onChange={(v) => up({ finalText: v })} /></Row>
            <Row label="Κουμπί"><Text value={d.finalLabel} onChange={(v) => up({ finalLabel: v })} /></Row>
          </Group>
        </>
      ) : (
        <>
          <Group title="Το παιχνίδι" footer="Το «Τι είναι» της σελίδας, με τα βασικά στοιχεία σε κουτάκια.">
            <Row label="Μικρός τίτλος"><Text value={d.scenarioKicker} onChange={(v) => up({ scenarioKicker: v })} /></Row>
            <Row label="Τίτλος"><Text value={d.scenarioTitle} onChange={(v) => up({ scenarioTitle: v })} /></Row>
            <Row label="Κείμενο" hint="Μία παράγραφος ανά κενή γραμμή."><Area rows={8} value={parasOf(d.scenario)} onChange={(v) => up({ scenario: toParas(v) })} /></Row>
            <Row label="Βασικά στοιχεία" hint="Ένα ανά γραμμή, π.χ. «60 λεπτά, 3 επίπεδα»."><Area rows={4} value={linesOf(d.highlights)} onChange={(v) => up({ highlights: toLines(v) })} /></Row>
          </Group>

          <Group title="Βίντεο" footer="Το βίντεο είναι το «Βίντεο trailer» του mode στο MODE MEDIA CENTER.">
            <Row label="Μικρός τίτλος"><Text value={d.videoKicker} onChange={(v) => up({ videoKicker: v })} /></Row>
            <Row label="Τίτλος"><Text value={d.videoTitle} onChange={(v) => up({ videoTitle: v })} /></Row>
          </Group>

          <Group title="Ροή της βραδιάς">
            <Row label="Μικρός τίτλος"><Text value={d.programKicker} onChange={(v) => up({ programKicker: v })} /></Row>
            <Row label="Τίτλος"><Text value={d.programTitle} onChange={(v) => up({ programTitle: v })} /></Row>
            <Row label="Σημείωση"><Text value={d.programNote} onChange={(v) => up({ programNote: v })} /></Row>
            <ListEditor
              items={d.program}
              onChange={(program) => up({ program })}
              blank={{ roman: '', title: '', subtitle: '', meta: '', group: '', lines: [''] }}
              addLabel="Προσθήκη βήματος"
              render={(it, set) => (
                <div className="grid gap-2 sm:grid-cols-[90px_1fr_110px]">
                  <div><div className={sub}>Αρίθμηση</div><Text value={it.roman} onChange={(v) => set({ roman: v })} placeholder="I" /></div>
                  <div><div className={sub}>Τίτλος</div><Text value={it.title} onChange={(v) => set({ title: v })} /></div>
                  <div><div className={sub}>Διάρκεια</div><Text value={it.meta} onChange={(v) => set({ meta: v })} placeholder="15′" /></div>
                  <div className="sm:col-span-3"><div className={sub}>Περιγραφή (μία γραμμή ανά σημείο)</div><Area rows={2} value={linesOf(it.lines)} onChange={(v) => set({ lines: toLines(v) })} /></div>
                </div>
              )}
            />
          </Group>

          <Group title="Πρακτικά" footer="Στο «Πότε» γράψε {date} για να μπει αυτόματα η ημερομηνία.">
            <ListEditor
              items={d.info}
              onChange={(info) => up({ info })}
              blank={{ title: '', text: '' }}
              addLabel="Προσθήκη"
              render={(it, set) => (
                <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
                  <div><div className={sub}>Τίτλος</div><Text value={it.title} onChange={(v) => set({ title: v })} /></div>
                  <div><div className={sub}>Κείμενο</div><Area rows={2} value={it.text} onChange={(v) => set({ text: v })} /></div>
                </div>
              )}
            />
            <Row label="Συμμετοχή" hint="Εμφανίζεται και στο τελικό κάλεσμα της σελίδας."><Area rows={2} value={d.participation} onChange={(v) => up({ participation: v })} /></Row>
          </Group>
        </>
      )}

      <Group title="Συχνές ερωτήσεις">
        <ListEditor
          items={d.faq}
          onChange={(faq) => up({ faq })}
          blank={{ q: '', a: '' }}
          addLabel="Προσθήκη ερώτησης"
          render={(it, set) => (
            <div className="space-y-2">
              <Text value={it.q} onChange={(v) => set({ q: v })} placeholder="Ερώτηση" />
              <Area rows={3} value={it.a} onChange={(v) => set({ a: v })} />
            </div>
          )}
        />
      </Group>

      <AdminSiteVersions eventId={ev} onRestore={(value) => setD(value)} />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black px-4 pt-3 lg:sticky lg:-mx-0 lg:rounded-2xl lg:border-0 lg:bg-[#1C1C1E]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <div className="hidden flex-1 text-[13px] text-white/50 sm:block">{dirty ? '● Μη αποθηκευμένες αλλαγές' : 'Όλα αποθηκευμένα'}</div>
          <button type="button" disabled={busy} onClick={reset} className="h-12 rounded-full bg-[#2C2C2E] px-5 text-[15px] font-semibold text-white disabled:opacity-40">Αρχικά</button>
          <button type="button" disabled={busy || !dirty} onClick={save} className="h-12 flex-1 rounded-full bg-[#E8C26B] px-6 text-[16px] font-bold text-black disabled:opacity-40 sm:flex-none">{busy ? 'Αποθήκευση…' : 'Αποθήκευση'}</button>
        </div>
      </div>
    </div>
  );
}
