import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import Timer from '@/components/comic/Timer';
import { ARREST_HEIST_LADDER } from '@/data/gameConfig';
import { ULTIMATE_TRUTHS } from '@/data/gameContent';

const TOOLS = [
  { id: 'blind_test', name: 'Randevou Blind Test', icon: '🧪', desc: 'Δοκιμασία αισθήσεων — 20″ ανά παίκτρια · ποινή σε αστοχία' },
  { id: 'double_edge', name: 'The Double Edge Card', icon: '⚔️', desc: 'Power-up: Αλήθεια ή Μεταφορά σε συμπαίκτρια' },
  { id: 'freeze_frame', name: 'Freeze Frame', icon: '🧊', desc: 'Ηχητικό σήμα → τελευταία που κινήθηκε χάνει' },
  { id: 'chain', name: 'Chain of Temptation', icon: '⛓️', desc: 'Κλιμακούμενη αλυσίδα → όποιος σπάσει χάνει' },
];

function randomPenalty(ladder) {
  const step = Math.floor(Math.random() * Math.min(ladder.length, 5)) + 1;
  return { step, ...ladder[step - 1] };
}

function BlindTest({ players, ladder, onClose }) {
  const [phase, setPhase] = useState('select');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [current, setCurrent] = useState(0);
  const [penalty, setPenalty] = useState(null);
  const names = [p1, p2].filter(Boolean);

  if (phase === 'select') {
    return (
      <div className="space-y-3">
        <div className="font-heading text-xl text-center">🧪 RANDEVOU BLIND TEST</div>
        <div className="text-sm text-foreground/70 text-center">Επίλεξε 2 παίκτριες · 20″ ανά παίκτρια · ποινή σε αστοχία</div>
        <div>
          <label className="text-sm font-bold">Παίκτρια 1</label>
          <select value={p1} onChange={(e) => setP1(e.target.value)} className="w-full px-3 py-2 border-2 border-border rounded-lg bg-secondary mt-1">
            <option value="">— Επίλεξε —</option>
            {players.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-bold">Παίκτρια 2</label>
          <select value={p2} onChange={(e) => setP2(e.target.value)} className="w-full px-3 py-2 border-2 border-border rounded-lg bg-secondary mt-1">
            <option value="">— Επίλεξε —</option>
            {players.filter((p) => p.name !== p1).map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <ComicButton variant="yellow" size="lg" className="w-full" disabled={!p1 || !p2 || p1 === p2} onClick={() => { setPhase('test'); setCurrent(0); }}>▶ ΕΚΚΙΝΗΣΗ</ComicButton>
      </div>
    );
  }

  if (phase === 'test') {
    const name = names[current];
    return (
      <div className="space-y-3 text-center">
        <div className="font-heading text-xl">🧪 BLIND TEST — {name}</div>
        <div className="text-sm text-foreground/70">Κλείσε μάτια / βάλε μάσκα · GM υποβάλλει δοκιμασία αισθήσεων</div>
        <ComicPanel className="bg-destructive/20 py-6">
          <Timer duration={20} running={true} label="BLIND TEST" size="lg" onComplete={() => { setPenalty(randomPenalty(ladder)); setPhase('result'); }} />
        </ComicPanel>
        <ComicButton variant="red" size="lg" className="w-full" onClick={() => { setPenalty(randomPenalty(ladder)); setPhase('result'); }}>❌ ΑΣΤΟΧΗΣΕ / ΚΑΘΥΣΤΕΡΗΣΕ</ComicButton>
      </div>
    );
  }

  if (phase === 'result') {
    const next = current + 1 < names.length;
    return (
      <div className="space-y-3 text-center">
        <div className="font-heading text-xl">⚠️ ΠΟΙΝΗ — {names[current]}</div>
        <div className="text-4xl">{penalty?.icon}</div>
        <div className="font-heading text-lg">{penalty?.label}</div>
        <div className="comic-panel-sm p-3 bg-destructive/20">{penalty?.detail}</div>
        {next ? (
          <ComicButton variant="yellow" size="lg" className="w-full" onClick={() => { setCurrent(current + 1); setPhase('test'); setPenalty(null); }}>➡ ΕΠΟΜΕΝΗ ΠΑΙΚΤΡΙΑ</ComicButton>
        ) : (
          <ComicButton variant="green" size="lg" className="w-full" onClick={onClose}>✅ ΟΛΟΚΛΗΡΩΘΗΚΕ</ComicButton>
        )}
      </div>
    );
  }
  return null;
}

function DoubleEdge({ players, onClose }) {
  const [phase, setPhase] = useState('select');
  const [selected, setSelected] = useState(null);
  const [truth, setTruth] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const teammates = selected ? players.filter((p) => p.team === selected.team && p.id !== selected.id) : [];

  if (phase === 'select') {
    return (
      <div className="space-y-3">
        <div className="font-heading text-xl text-center">⚔️ THE DOUBLE EDGE CARD</div>
        <div className="text-sm text-foreground/70 text-center">Power-up · Αλήθεια ή Μεταφορά σε συμπαίκτρια</div>
        <div className="space-y-1">
          {players.map((p) => (
            <button key={p.id} onClick={() => { setSelected(p); setPhase('choose'); }} className="comic-panel-sm w-full p-2 text-left bg-card hover:bg-secondary flex items-center justify-between">
              <span className="font-bold">{p.name}</span>
              <span className="text-xs">Team {p.team}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'choose') {
    return (
      <div className="space-y-3 text-center">
        <div className="font-heading text-xl">⚔️ DOUBLE EDGE — {selected.name}</div>
        <div className="text-sm text-foreground/70">Διάλεξε:</div>
        <div className="grid grid-cols-2 gap-3">
          <ComicButton variant="magenta" size="lg" onClick={() => { setTruth(ULTIMATE_TRUTHS[Math.floor(Math.random() * ULTIMATE_TRUTHS.length)]); setPhase('truth'); }}>💬 ΑΛΗΘΕΙΑ</ComicButton>
          <ComicButton variant="cyan" size="lg" disabled={teammates.length === 0} onClick={() => setPhase('transfer')}>🔄 ΜΕΤΑΦΟΡΑ</ComicButton>
        </div>
        <div className="text-xs text-foreground/60">Αλήθεια: σκληρή δημόσια ερώτηση · Μεταφορά: μόνο σε συμπαίκτρια</div>
        {teammates.length === 0 && <div className="text-xs text-destructive">Δεν υπάρχουν συμπαίκτριες!</div>}
      </div>
    );
  }

  if (phase === 'truth') {
    return (
      <div className="space-y-3">
        <div className="font-heading text-xl text-center">💬 ΣΚΛΗΡΗ ΑΛΗΘΕΙΑ — {selected.name}</div>
        <div className="comic-panel-sm p-4 bg-tarot-wine/30"><p className="text-lg">{truth?.text}</p></div>
        <ComicButton variant="green" size="lg" className="w-full" onClick={onClose}>✅ ΟΛΟΚΛΗΡΩΘΗΚΕ</ComicButton>
      </div>
    );
  }

  if (phase === 'transfer') {
    if (transferTarget) {
      return (
        <div className="space-y-3 text-center">
          <div className="font-heading text-xl">🔄 ΜΕΤΑΦΟΡΑ ΟΛΟΚΛΗΡΩΘΗΚΕ</div>
          <div className="text-lg">{selected.name} → {transferTarget.name}</div>
          <div className="text-sm text-foreground/70">Η ποινή/πρόκληση μεταφέρθηκε σε συμπαίκτρια.</div>
          <ComicButton variant="green" size="lg" className="w-full" onClick={onClose}>✅ ΟΚ</ComicButton>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="font-heading text-xl text-center">🔄 ΜΕΤΑΦΟΡΑ ΣΕ ΣΥΜΠΑΙΚΤΡΙΑ</div>
        <div className="text-sm text-foreground/70 text-center">Team {selected.team} — Επίλεξε συμπαίκτρια</div>
        <div className="space-y-1">
          {teammates.map((p) => (
            <button key={p.id} onClick={() => setTransferTarget(p)} className="comic-panel-sm w-full p-2 text-left bg-card hover:bg-secondary"><span className="font-bold">{p.name}</span></button>
          ))}
        </div>
        <ComicButton variant="white" size="sm" className="w-full" onClick={() => setPhase('choose')}>← ΠΙΣΩ</ComicButton>
      </div>
    );
  }
  return null;
}

function FreezeFrame({ players, ladder, onClose }) {
  const [phase, setPhase] = useState('ready');
  const [loser, setLoser] = useState(null);

  function playFreezeSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = 'sawtooth'; gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 1500);
    } catch (e) { /* ignore */ }
    setPhase('pick');
  }

  if (phase === 'ready') {
    return (
      <div className="space-y-3 text-center">
        <div className="font-heading text-xl">🧊 FREEZE FRAME</div>
        <div className="text-sm text-foreground/70">Πάτα για ηχητικό σήμα · Όλοι ακινητοποιούνται · Τελευταία που κινήθηκε χάνει</div>
        <ComicButton variant="cyan" size="lg" className="w-full comic-pulse" onClick={playFreezeSound}>🧊 FREEZE!</ComicButton>
      </div>
    );
  }

  if (phase === 'pick') {
    return (
      <div className="space-y-3">
        <div className="font-heading text-xl text-center">🧊 ΠΟΙΑ ΚΙΝΗΘΗΚΕ ΤΕΛΕΥΤΑΙΑ;</div>
        <div className="space-y-1">
          {players.map((p) => (
            <button key={p.id} onClick={() => { setLoser(p); setPhase('result'); }} className="comic-panel-sm w-full p-2 text-left bg-card hover:bg-destructive/20"><span className="font-bold">{p.name}</span></button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const penalty = randomPenalty(ladder);
    return (
      <div className="space-y-3 text-center">
        <div className="font-heading text-xl">⚠️ ΠΟΙΝΗ — {loser.name}</div>
        <div className="text-4xl">{penalty.icon}</div>
        <div className="font-heading text-lg">{penalty.label}</div>
        <div className="comic-panel-sm p-3 bg-destructive/20">{penalty.detail}</div>
        <ComicButton variant="green" size="lg" className="w-full" onClick={onClose}>✅ ΟΛΟΚΛΗΡΩΘΗΚΕ</ComicButton>
      </div>
    );
  }
  return null;
}

function ChainTemptation({ players, ladder, onClose }) {
  const [phase, setPhase] = useState('active');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [loser, setLoser] = useState(null);

  if (phase === 'active') {
    const current = players[currentIdx];
    return (
      <div className="space-y-3 text-center">
        <div className="font-heading text-xl">⛓️ CHAIN OF TEMPTATION</div>
        <div className="text-sm text-foreground/70">Γύρος κλιμάκωσης {round} — Σειρά: {current?.name}</div>
        <ComicPanel className="bg-tarot-wine/30 py-4"><div className="text-lg">{current?.name} — πρόσθεσε έναν βαθμό δυσκολίας/έντασης!</div></ComicPanel>
        <div className="flex gap-2">
          <ComicButton variant="green" size="lg" className="flex-1" onClick={() => {
            const next = (currentIdx + 1) % players.length;
            if (next === 0) setRound((r) => r + 1);
            setCurrentIdx(next);
          }}>✅ ΕΠΟΜΕΝΟΣ ΚΡΙΚΟΣ</ComicButton>
          <ComicButton variant="red" size="lg" className="flex-1" onClick={() => { setLoser(current); setPhase('broken'); }}>❌ ΣΠΑΣΕ ΑΛΥΣΙΔΑ</ComicButton>
        </div>
        <div className="text-xs text-foreground/60">Όποιος διστάσει/αρνηθεί/σπάσει → βαρύτερη ποινή</div>
      </div>
    );
  }

  if (phase === 'broken') {
    const penalty = randomPenalty(ladder);
    return (
      <div className="space-y-3 text-center">
        <div className="font-heading text-xl">⛓️💥 ΑΛΥΣΙΔΑ ΣΠΑΘΗΚΕ</div>
        <div className="text-lg">{loser?.name} έσπασε την αλυσίδα!</div>
        <div className="font-heading text-lg mt-2">⚠️ ΒΑΡΥΤΕΡΗ ΠΟΙΝΗ</div>
        <div className="text-4xl">{penalty.icon}</div>
        <div className="font-heading text-lg">{penalty.label}</div>
        <div className="comic-panel-sm p-3 bg-destructive/20">{penalty.detail}</div>
        <ComicButton variant="green" size="lg" className="w-full" onClick={onClose}>✅ ΟΛΟΚΛΗΡΩΘΗΚΕ</ComicButton>
      </div>
    );
  }
  return null;
}

export default function GmTools({ state, onClose }) {
  const [activeTool, setActiveTool] = useState(null);
  const players = (state.players || []).filter((p) => p.name);
  const ladder = ARREST_HEIST_LADDER;

  return (
    <div className="fixed inset-0 z-50 bg-background/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <ComicPanel className="bg-card">
          {!activeTool ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-heading text-xl">🧪 GM TOOLS</div>
                <ComicButton variant="dark" size="sm" onClick={onClose}>✕</ComicButton>
              </div>
              <div className="text-sm text-foreground/70">Χειροκίνητα ενεργοποιούμενα — δεν πειράζουν το game flow</div>
              {players.length < 2 ? (
                <div className="text-center text-destructive py-4">Χρειάζονται τουλάχιστον 2 παίκτριες!</div>
              ) : (
                <div className="space-y-2">
                  {TOOLS.map((t) => (
                    <button key={t.id} onClick={() => setActiveTool(t.id)} className="comic-panel-sm w-full p-3 text-left bg-secondary hover:bg-tarot-wine/30">
                      <div className="font-heading text-lg">{t.icon} {t.name}</div>
                      <div className="text-xs text-foreground/60">{t.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <ComicButton variant="white" size="sm" onClick={() => setActiveTool(null)}>← ΠΙΣΩ</ComicButton>
                <ComicButton variant="dark" size="sm" onClick={onClose}>✕</ComicButton>
              </div>
              {activeTool === 'blind_test' && <BlindTest players={players} ladder={ladder} onClose={onClose} />}
              {activeTool === 'double_edge' && <DoubleEdge players={players} onClose={onClose} />}
              {activeTool === 'freeze_frame' && <FreezeFrame players={players} ladder={ladder} onClose={onClose} />}
              {activeTool === 'chain' && <ChainTemptation players={players} ladder={ladder} onClose={onClose} />}
            </div>
          )}
        </ComicPanel>
      </div>
    </div>
  );
}