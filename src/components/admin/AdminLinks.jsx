import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const ORIGIN = window.location.origin;

const GAME_LINKS = [
  { id: 'tablet', label: '📱 TABLET — εδώ παίζεις', path: '/', needsCode: true, desc: 'Η κύρια συσκευή. Μόνο αυτή ξεκινά γύρους, κάρτες και δεσίματα.' },
  { id: 'tv', label: '📺 TV — οθόνη για όλες', path: '/tv', needsCode: true, desc: 'Δείχνει board, σκορ και ανακοινώσεις. Δεν ελέγχει τίποτα.' },
  { id: 'mobile', label: '📲 ΚΙΝΗΤΟ — κάθε παίκτρια', path: '/play', needsCode: true, desc: 'Ψηφοφορίες, προσωπικές κάρτες, μίνι-παιχνίδια.' },
];

const GUEST_LINKS = [
  { id: 'teaser', label: '🕯️ Πρόσκληση + Φόρμα', path: '/invitation', desc: 'Ένα link: teaser με countdown, μετά η φόρμα συμμετοχής.' },
  { id: 'pajama-invite', label: '🩴 Πρόσκληση Pajama', path: '/pajama-invite', desc: 'Το μυστηριώδες link που στέλνεις — οδηγεί στη φόρμα.' },
  { id: 'pajama', label: '🩴 Φόρμα Pajama', path: '/pajama-form', desc: 'Η φόρμα που συμπληρώνουν — μετά την εγκρίνεις στο Admin → Intakes.' },
];

const OPTIONAL_LINKS = [
  { id: 'intake', label: '📝 Intake αρχηγού', path: '/intake', desc: 'Ερωτηματολόγιο διοργανώτριας.' },
];

const ADMIN_LINK = { id: 'admin', label: '🔧 ADMIN PANEL', path: '/admin', desc: 'Το πάνελ σου — δεν το στέλνεις ποτέ σε καλεσμένη.' };

function buildUrl(def, sessionCode) {
  return def.needsCode ? `${ORIGIN}${def.path}?code=${encodeURIComponent(sessionCode)}` : `${ORIGIN}${def.path}`;
}

function LinkRow({ def, sessionCode, locked }) {
  const [copied, setCopied] = useState(false);
  const url = buildUrl(def, sessionCode);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { console.error('copy failed', e); }
  }

  return (
    <ComicPanel className="bg-card">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className={locked ? 'bg-card p-2 border-2 border-border rounded-lg shrink-0 opacity-30' : 'bg-card p-2 border-2 border-border rounded-lg shrink-0'}>
          <QRCodeSVG value={url} size={120} level="M" />
        </div>
        <div className="flex-1 min-w-0 w-full">
          <div className="font-heading text-lg">{def.label}</div>
          <div className="text-xs text-foreground/60 mb-2">{def.desc}</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate text-xs bg-background/5 border-2 border-border rounded px-2 py-1.5 font-mono">
              {locked ? 'Χρειάζεται κωδικός συνεδρίας — ξεκίνα πρώτα το παιχνίδι' : url}
            </code>
            {!locked && (
              <>
                <ComicButton variant={copied ? 'green' : 'cyan'} size="sm" onClick={copy} className="shrink-0">
                  {copied ? '✅' : '📋'}
                </ComicButton>
                <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
                  <ComicButton variant="dark" size="sm">↗</ComicButton>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </ComicPanel>
  );
}

function EventDateSetter() {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { items } = await base44.entities.AppSetting.filter({ key: 'event_date' }, { limit: 1 });
        if (items && items.length > 0 && items[0].value) setValue(items[0].value);
      } catch (e) { /* ignore */ }
      setLoaded(true);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const { items } = await base44.entities.AppSetting.filter({ key: 'event_date' }, { limit: 1 });
      if (items && items.length > 0) {
        await base44.entities.AppSetting.update(items[0].id, { value });
      } else {
        await base44.entities.AppSetting.create({ key: 'event_date', value });
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } catch (e) {
      console.error('event_date save error', e);
      alert('Σφάλμα αποθήκευσης.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ComicPanel className="bg-tarot-royal/20">
      <div className="font-heading text-xl mb-1">🕯️ ΗΜΕΡΟΜΗΝΙΑ EVENT (COUNTDOWN ΠΡΟΣΚΛΗΣΗΣ)</div>
      <div className="text-xs text-foreground/60 mb-3">
        Επηρεάζει μόνο το countdown στην Πρόσκληση (/invitation). Κενό = χωρίς countdown.
      </div>
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!loaded}
          className="flex-1 border-2 border-border rounded-lg px-3 py-2 bg-card font-bold text-sm"
        />
        <ComicButton variant={savedFlash ? 'green' : 'magenta'} size="sm" onClick={save} disabled={saving || !loaded}>
          {saving ? 'ΑΠΟΘΗΚΕΥΣΗ...' : savedFlash ? '✅ ΟΚ' : 'ΑΠΟΘΗΚΕΥΣΗ'}
        </ComicButton>
      </div>
    </ComicPanel>
  );
}

export default function AdminLinks({ sessions = [], selectedSession }) {
  const sessionCode = selectedSession?.sessionCode || sessions?.[0]?.sessionCode || '';
  const [showOptional, setShowOptional] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  async function copyAll() {
    if (!sessionCode) return;
    const text = [...GAME_LINKS]
      .map((d) => `${d.label}\n${buildUrl(d, sessionCode)}`)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1800);
    } catch (e) { console.error('copy all failed', e); }
  }

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-primary">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="font-heading text-2xl comic-text-stroke">🔗 LINKS ΠΑΙΧΝΙΔΙΟΥ</div>
            <div className="text-sm font-bold mt-1">
              {sessionCode
                ? <>Ένας κωδικός για όλες τις συσκευές: <span className="font-heading text-xl tracking-widest bg-background text-primary px-2 rounded">{sessionCode}</span></>
                : 'Δεν υπάρχει ενεργή συνεδρία — ξεκίνα παιχνίδι από το Tablet για να πάρεις κωδικό.'}
            </div>
            <div className="text-xs mt-1 text-foreground/70">
              Tablet, TV και κινητό ανοίγουν πάντα την ίδια συνεδρία με αυτόν τον κωδικό.
            </div>
          </div>
          <ComicButton variant={copiedAll ? 'green' : 'purple'} size="sm" onClick={copyAll} disabled={!sessionCode}>
            {copiedAll ? '✅ ΑΝΤΙΓΡΑΦΗΚΑΝ' : '📋 COPY ΤΑ 3 ΤΟΥ ΠΑΙΧΝΙΔΙΟΥ'}
          </ComicButton>
        </div>
      </ComicPanel>

      <div className="space-y-3">
        <div className="border-b-2 border-border pb-1">
          <div className="font-heading text-lg text-primary">🎮 ΤΟ ΠΑΙΧΝΙΔΙ (ίδιος κωδικός παντού)</div>
          <div className="text-xs text-foreground/60">Αυτά τα ανοίγεις εσύ. Χωρίς κωδικό δεν μπαίνουν σε συνεδρία.</div>
        </div>
        {GAME_LINKS.map((def) => (
          <LinkRow key={def.id} def={def} sessionCode={sessionCode} locked={!sessionCode} />
        ))}
      </div>

      <div className="space-y-3">
        <div className="border-b-2 border-border pb-1">
          <div className="font-heading text-lg text-primary">💌 ΣΤΕΛΝΕΙΣ ΣΤΙΣ ΚΑΛΕΣΜΕΝΕΣ</div>
          <div className="text-xs text-foreground/60">Σταθερά links, χωρίς κωδικό.</div>
        </div>
        {GUEST_LINKS.map((def) => (
          <LinkRow key={def.id} def={def} sessionCode={sessionCode} locked={false} />
        ))}
      </div>

      <ComicPanel className="bg-secondary">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-heading text-lg">🗂️ ΠΡΟΑΙΡΕΤΙΚΑ LINKS ({OPTIONAL_LINKS.length})</div>
            <div className="text-xs text-foreground/60">
              Δεν χρειάζονται για να παίξει το παιχνίδι. Άνοιξέ τα μόνο αν τα θέλεις.
            </div>
          </div>
          <ComicButton variant={showOptional ? 'dark' : 'white'} size="sm" onClick={() => setShowOptional(!showOptional)}>
            {showOptional ? '▲ ΚΡΥΨΕ' : '▼ ΕΜΦΑΝΙΣΕ'}
          </ComicButton>
        </div>
      </ComicPanel>

      {showOptional && (
        <div className="space-y-3">
          {OPTIONAL_LINKS.map((def) => (
            <LinkRow key={def.id} def={def} sessionCode={sessionCode} locked={false} />
          ))}
        </div>
      )}

      <EventDateSetter />

      <div className="space-y-3">
        <div className="border-b-2 border-border pb-1">
          <div className="font-heading text-lg text-destructive">🔧 ΜΟΝΟ ΓΙΑ ΣΕΝΑ</div>
        </div>
        <LinkRow def={ADMIN_LINK} sessionCode={sessionCode} locked={false} />
      </div>
    </div>
  );
}