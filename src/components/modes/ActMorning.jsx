import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Panel, Btn } from '@/components/modes/ModeShell';
import { MORNING_CLUES, DEFAULT_MORNING_CODE, VIP_VAULT } from '@/data/modes/extendedContent';
import { pick, sfx } from '@/lib/modeKit';

const MORNING_SECONDS = 15 * 60;

// Act 4 — Extended Morning Escape & VIP Vault
export default function ActMorning({ ctx, onFinish }) {
  const { players, mg, setMg, log, nameOf } = ctx;
  const code = mg.morningCode || DEFAULT_MORNING_CODE;
  const found = mg.morningFound || [];
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  const [card, setCard] = useState(null);
  const unlocked = !!mg.vaultUnlocked;

  function toggleClue(i) {
    const next = found.includes(i) ? found.filter((x) => x !== i) : [...found, i];
    setMg({ morningFound: next });
  }

  function submit() {
    if (input === code) {
      setMg({ vaultUnlocked: true, morningSolvedAt: Date.now() });
      log('☀️ Ο Coffee Code λύθηκε — VIP VAULT UNLOCKED');
      sfx.ok();
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 }, colors: ['#FFD700', '#FF2A85', '#ffffff'] });
    } else {
      setWrong(true);
      sfx.fail();
      setTimeout(() => setWrong(false), 900);
    }
  }

  return (
    <div className="space-y-3">
      <Panel title="☀️ Extended Morning Escape" accent="#FFD700">
        <p className="text-sm opacity-80">Ο καφές είναι σε κοινή θέα αλλά «κλειδωμένος». Βρείτε τα 4 ψηφία που κρύβονται στο δωμάτιο. Όποια ομάδα καθυστερήσει ή αποτύχει μένει εκτός πρώτου σερβιρίσματος και αναλαμβάνει όλες τις αγγαρείες καθαρισμού.</p>
        <div className="text-center font-display text-2xl" style={{ color: '#FFD700' }}>“The Coffee Code is Hidden.”</div>
        {!mg.morningTimer && <Btn color="bg-amber-600 text-black" onClick={() => setMg({ morningTimer: Date.now() + MORNING_SECONDS * 1000 })}>▶ Ξεκίνα το κυνήγι (15′)</Btn>}
        {mg.morningTimer && <MorningClock endsAt={mg.morningTimer} />}

        <div className="grid sm:grid-cols-2 gap-2">
          {MORNING_CLUES.map((c, i) => (
            <button key={c.id} onClick={() => toggleClue(i)} className={`comic-boom text-left p-2 ${found.includes(i) ? 'bg-emerald-900' : 'bg-secondary'}`}>
              <div className="text-xs opacity-60">Ψήγμα {i + 1} {found.includes(i) ? '✓ βρέθηκε' : ''}</div>
              <div className="font-body italic">“{c.app}”</div>
              <div className="text-xs opacity-70 mt-1">📍 {c.where}</div>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs opacity-80">
          Κωδικός ρυθμισμένος από εσένα:
          <input
            value={code}
            maxLength={4}
            onChange={(e) => setMg({ morningCode: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            className="w-20 text-center px-2 py-1 rounded bg-background border border-border text-base tracking-widest"
          />
          (γράψε τα ψηφία στα κρυμμένα αντικείμενα· προεπιλογή {DEFAULT_MORNING_CODE})
        </div>
      </Panel>

      {!unlocked ? (
        <Panel title="🔢 Πληκτρολόγιο κωδικού" accent="#FFD700">
          <div className="flex items-center gap-2">
            <input
              inputMode="numeric"
              value={input}
              maxLength={4}
              onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={`w-40 text-center text-3xl tracking-[0.4em] px-2 py-2 rounded bg-black border-2 ${wrong ? 'border-red-500' : 'border-yellow-500'}`}
              placeholder="••••"
            />
            <Btn color="bg-amber-600 text-black" onClick={submit} disabled={input.length !== 4}>ΞΕΚΛΕΙΔΩΜΑ</Btn>
          </div>
        </Panel>
      ) : (
        <Panel title="👑 VIP VAULT UNLOCKED — The Ultimate Pajama Queens" accent="#FFD700">
          <p className="text-sm opacity-80">Σερβίρεται ο καφές! Παίξτε τις 20 κάρτες του Vault όσο θέλετε.</p>
          {card && <div className="rounded bg-amber-950/60 border border-amber-500 p-3 font-body text-lg">{card}</div>}
          <div className="flex flex-wrap gap-2">
            <Btn color="bg-amber-600 text-black" onClick={() => setCard(pick(VIP_VAULT))}>🎴 Τράβηξε κάρτα Vault</Btn>
            <Btn color="bg-emerald-700" onClick={onFinish}>🏆 Τίτλοι & απονομή</Btn>
          </div>
        </Panel>
      )}
    </div>
  );
}

function MorningClock({ endsAt }) {
  const [, force] = useState(0);
  React.useEffect(() => { const i = setInterval(() => force((n) => n + 1), 1000); return () => clearInterval(i); }, []);
  const left = Math.max(0, (endsAt - Date.now()) / 1000);
  const m = Math.floor(left / 60);
  const s = Math.floor(left % 60);
  return <div className={`text-center font-display text-4xl ${left === 0 ? 'text-red-400' : ''}`}>{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}{left === 0 ? ' — χάσατε τον καφέ! Αγγαρείες!' : ''}</div>;
}
