import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const ORIGIN = window.location.origin;

const GAME_LINKS = [
  { id: 'tablet', label: '📱 TABLET — εδώ παίζεις', path: '/', needsCode: true, desc: 'Η κύρια συσκευή. Μόνο αυτή ξεκινά γύρους, κάρτες και δεσίματα.' },
  { id: 'tv', label: '📺 TV — οθόνη για όλες', path: '/tv', needsCode: true, desc: 'Δείχνει ταμπλό, σκορ και ανακοινώσεις. Δεν ελέγχει τίποτα.' },
  { id: 'mobile', label: '📲 ΚΙΝΗΤΟ — κάθε παίκτρια', path: '/play', needsCode: true, desc: 'Ψηφοφορίες, προσωπικές κάρτες, μίνι-παιχνίδια.' },
];

const GUEST_LINKS = [
  { id: 'public-forms', label: '📝 ΕΝΙΑΙΑ ΦΟΡΜΑ ΣΥΜΜΕΤΟΧΗΣ', path: '/forms', desc: 'Ο μοναδικός δημόσιος σύνδεσμος για επιλογή ενός Mode και υποβολή συμμετοχής.' },
];

const ADMIN_LINK = { id: 'admin', label: '🔧 ΠΙΝΑΚΑΣ ΔΙΑΧΕΙΡΙΣΗΣ', path: '/admin', desc: 'Το πάνελ σου — δεν το στέλνεις ποτέ σε καλεσμένη.' };

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

export default function AdminLinks({ sessions = [], selectedSession }) {
  const sessionCode = selectedSession?.sessionCode || sessions?.[0]?.sessionCode || '';
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
            <div className="font-heading text-2xl comic-text-stroke">🔗 ΣΥΝΔΕΣΜΟΙ ΠΑΙΧΝΙΔΙΟΥ</div>
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
            {copiedAll ? '✅ ΑΝΤΙΓΡΑΦΗΚΑΝ' : '📋 ΑΝΤΙΓΡΑΦΗ ΤΩΝ 3 ΣΥΝΔΕΣΜΩΝ ΠΑΙΧΝΙΔΙΟΥ'}
          </ComicButton>
        </div>
      </ComicPanel>

      <div className="space-y-3">
        <div className="border-b-2 border-border pb-1">
          <div className="font-heading text-lg text-primary">🎮 ΤΟ ΠΑΙΧΝΙΔΙ (ίδιος κωδικός παντού)</div>
          <div className="text-xs text-foreground/60">Αυτά τα ανοίγεις εσύ. Χωρίς κωδικό δεν συνδέονται σε συνεδρία.</div>
        </div>
        {GAME_LINKS.map((def) => (
          <LinkRow key={def.id} def={def} sessionCode={sessionCode} locked={!sessionCode} />
        ))}
      </div>

      <div className="space-y-3">
        <div className="border-b-2 border-border pb-1">
          <div className="font-heading text-lg text-primary">💌 ΣΤΕΛΝΕΙΣ ΣΤΙΣ ΚΑΛΕΣΜΕΝΕΣ</div>
          <div className="text-xs text-foreground/60">Οι προσωπικές VIP προσκλήσεις και τα QR δημιουργούνται από την ενότητα Ψηφιακές προσκλήσεις.</div>
        </div>
        {GUEST_LINKS.map((def) => (
          <LinkRow key={def.id} def={def} sessionCode={sessionCode} locked={false} />
        ))}
      </div>


      <div className="space-y-3">
        <div className="border-b-2 border-border pb-1">
          <div className="font-heading text-lg text-destructive">🔧 ΜΟΝΟ ΓΙΑ ΣΕΝΑ</div>
        </div>
        <LinkRow def={ADMIN_LINK} sessionCode={sessionCode} locked={false} />
      </div>
    </div>
  );
}