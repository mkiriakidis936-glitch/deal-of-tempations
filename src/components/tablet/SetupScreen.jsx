import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { GAME_MODES, FOOTWEAR_LEVELS, TOENAIL_PERKS } from '@/data/gameConfig';
import { createInitialState, generateSessionCode } from '@/lib/gameLogic';

const SHOE_TO_LEVEL = { boots: 4, sneakers: 2, sandals: 1, barefoot: 0 };

const NAIL_COLORS = ['Red', 'Pink', 'White', 'Black', 'Nude', 'French', 'Blue', 'Purple', 'Green', 'Orange', 'Gold', 'Silver', 'None'];

const DURATION_OPTIONS = [
  { id: 'afternoon', icon: '☀️', name: 'Μία βραδιά', desc: 'Τελειώνει στο Finale — χωρίς διανυκτέρευση.' },
  { id: '48h', icon: '🌙', name: 'Διανυκτέρευση', desc: 'Ανοίγει η νύχτα και το πρωί.' },
];

export default function SetupScreen({ onStart }) {
  const [duration, setDuration] = useState('afternoon');
  const [mode, setMode] = useState('classic');
  const [players, setPlayers] = useState([
    { name: '', footwearLevel: 2, toenailPerk: 'red' },
    { name: '', footwearLevel: 2, toenailPerk: 'pink' },
  ]);
  const [intakes, setIntakes] = useState([]);
  const [pajamaApproved, setPajamaApproved] = useState([]);
  const [intakesLoaded, setIntakesLoaded] = useState(false);
  const [testMode, setTestMode] = useState(false);

  const applyNames = (names, shoeByName, pjByName = {}) => {
    if (!names.length) return;
    setPlayers((prev) => {
      const kept = prev.map((p) => p.name.trim()).filter(Boolean);
      const merged = [...kept];
      names.forEach((n) => { if (!merged.includes(n)) merged.push(n); });
      return merged.slice(0, 6).map((n, idx) => ({
        name: n,
        footwearLevel: shoeByName[n] ?? 2,
        toenailPerk: TOENAIL_PERKS[idx % TOENAIL_PERKS.length].id,
        slipperType: pjByName[n]?.slipperType || '',
        nailColor: pjByName[n]?.nailColor || 'Pink',
      }));
    });
  };

  const loadIntakes = async () => {
    try {
      const [classicRes, pajamaRes] = await Promise.all([
        base44.entities.PlayerIntake.filter({}, { sort: '-created_date', limit: 50 }),
        base44.entities.PajamaIntake.filter({}, { sort: '-created_date', limit: 100 }),
      ]);
      const classic = classicRes.items || [];
      const approved = (pajamaRes.items || []).filter((i) => i.approved === true && i.name);
      setIntakes(classic);
      setPajamaApproved(approved);

      const shoeByName = {};
      classic.forEach((i) => {
        if (i.name) shoeByName[i.name.trim()] = SHOE_TO_LEVEL[i.shoeType] ?? 2;
      });

      const pjByName = {};
      approved.forEach((i) => {
        const n = i.name.trim();
        pjByName[n] = { slipperType: i.slipperType || '', nailColor: i.nailColor || '' };
      });

      const names = [];
      approved.forEach((i) => {
        const n = i.name.trim();
        if (!names.includes(n)) names.push(n);
      });
      classic.forEach((i) => {
        const n = (i.name || '').trim();
        if (n && !names.includes(n)) names.push(n);
      });

      applyNames(names, shoeByName, pjByName);
    } catch (e) {
      console.error('Intake load error', e);
    } finally {
      setIntakesLoaded(true);
    }
  };

  useEffect(() => { loadIntakes(); }, []);

  const maxPlayers = mode === 'marathon' ? 10 : mode === 'arrest_heist' ? 10 : 6;
  const minPlayers = mode === 'marathon' ? 8 : mode === 'arrest_heist' ? 4 : 2;

  function addPlayer() {
    if (players.length < maxPlayers) {
      setPlayers([...players, { name: '', footwearLevel: 2, toenailPerk: 'pink' }]);
    }
  }

  function removePlayer(idx) {
    if (players.length > Math.max(2, minPlayers)) {
      setPlayers(players.filter((_, i) => i !== idx));
    }
  }

  function updatePlayer(idx, field, value) {
    setPlayers(players.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  }

  function handleDuration(d) {
    setDuration(d.id);
  }

  function handleModeChange(m) {
    setMode(m.id);
    if (m.id === 'marathon' && players.length < 8) {
      setPlayers(Array.from({ length: 8 }, (_, i) => ({ name: '', footwearLevel: 2, toenailPerk: TOENAIL_PERKS[i % 5].id })));
    } else if (m.id === 'arrest_heist' && players.length < 4) {
      setPlayers(Array.from({ length: 4 }, (_, i) => ({ name: '', footwearLevel: 2, toenailPerk: TOENAIL_PERKS[i % 5].id })));
    } else if (m.id === 'classic' && players.length > 6) {
      setPlayers(players.slice(0, 6));
    }
  }

  function handleStart() {
    const valid = players.filter((p) => p.name.trim());
    if (valid.length < minPlayers) return;
    const state = { ...createInitialState(mode, 'standard', valid), testMode };
    onStart({
      sessionCode: generateSessionCode(),
      mode,
      duration,
      intensity: 'standard',
      stage: state.stage,
      state,
    });
  }

  const canStart = players.filter((p) => p.name.trim()).length >= minPlayers;

  return (
    <div className="min-h-screen comic-dots p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-4">
        <ComicPanel className="text-center py-8 ds-sheen">
          <h1 className="font-display text-3xl sm:text-5xl text-primary tracking-[0.14em]">DEAL OF TEMPTATION</h1>
          <div className="ds-rule my-4 mx-auto max-w-xs" />
          <p className="ds-eyebrow text-primary/70">ΛΗΣΤΕΙΑ &amp; ΣΥΛΛΗΨΗ — 18+ ALL-GIRLS EDITION</p>
        </ComicPanel>

        {intakesLoaded && (intakes.length > 0 || pajamaApproved.length > 0) && (
          <ComicPanel className="bg-secondary p-2">
            <div className="text-xs font-bold text-foreground font-body">
              ✅ {pajamaApproved.length} εγκεκριμένες φόρμες Pajama Party{intakes.length > 0 ? ` · ${intakes.length} από το /welcome` : ''} — τα ονόματα συμπληρώθηκαν αυτόματα.
            </div>
          </ComicPanel>
        )}

        <ComicPanel>
          <h2 className="font-heading text-2xl mb-3 text-primary">ΠΟΣΟ ΘΑ ΚΡΑΤΗΣΕΙ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => handleDuration(d)}
                className={`comic-panel-sm p-3 text-left transition-all ${duration === d.id ? 'bg-primary/20 ring-2 ring-primary scale-[1.02]' : 'bg-secondary'}`}
              >
                <div className="font-heading text-xl text-foreground">{d.icon} {d.name}</div>
                <div className="text-sm text-foreground/70 font-body">{d.desc}</div>
              </button>
            ))}
          </div>
        </ComicPanel>

        <ComicPanel>
          <h2 className="font-heading text-2xl mb-3 text-primary">1. ΕΠΙΛΟΓΗ MODE</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`comic-panel-sm p-3 transition-all sm:col-span-2 ${mode === 'classic' || mode === 'marathon' ? 'ring-2 ring-primary bg-primary/10' : 'bg-secondary'}`}>
              <div className="font-heading text-xl text-foreground">🎲 ΚΛΑΣΣΙΚΗ / MEGA MARATHON</div>
              <div className="text-sm text-foreground/70 font-body mb-2">Ίδιο τραπέζι, ίδιοι κανόνες — αλλάζει μόνο η κλίμακα.</div>
              <div className="grid grid-cols-2 gap-2">
                {GAME_MODES.filter((v) => v.id === 'classic' || v.id === 'marathon').map((v) => {
                  const on = mode === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleModeChange(v)}
                      className={`rounded-md border p-2 text-left transition-all ${on ? 'border-primary bg-primary/15' : 'border-border/60 bg-surface-1 hover:border-primary/50'}`}
                    >
                      <div className="font-heading text-base text-foreground leading-tight">{v.icon} {v.name}</div>
                      <div className="ds-label mt-1 text-primary/70">{v.id === 'classic' ? '2-6 παίκτριες' : '8-10 παίκτριες'}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            {GAME_MODES.filter((m) => m.id !== 'classic' && m.id !== 'marathon').map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m)}
                className={`comic-panel-sm p-3 text-left transition-all ${mode === m.id ? 'ring-2 ring-primary bg-primary/10' : 'bg-secondary'}`}
              >
                <div className="font-heading text-xl text-foreground">{m.icon} {m.name}</div>
                <div className="text-sm text-foreground/70 font-body">{m.desc}</div>
              </button>
            ))}
          </div>
        </ComicPanel>

        <ComicPanel>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-2xl text-primary">2. ΠΑΙΚΤΡΙΕΣ ({players.length}/{maxPlayers})</h2>
            <div className="flex gap-2">
              <ComicButton variant="dark" size="sm" onClick={loadIntakes}>🔄 ΟΝΟΜΑΤΑ</ComicButton>
              <ComicButton variant="green" size="sm" onClick={addPlayer} disabled={players.length >= maxPlayers}>
                + ΠΡΟΣΘΗΚΗ
              </ComicButton>
            </div>
          </div>
          <div className="space-y-2">
            {players.map((p, idx) => (
              <div key={idx} className="comic-panel-sm p-2 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <div className="font-heading text-lg w-8 text-center flex items-center justify-center text-primary">{idx + 1}</div>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updatePlayer(idx, 'name', e.target.value)}
                  placeholder={`Όνομα ${idx + 1}`}
                  className="flex-1 min-w-0 px-3 py-1.5 border-2 border-border rounded-lg font-bold bg-background text-foreground focus:outline-none focus:ring-2 ring-primary font-body"
                />
                {mode === 'pajama' ? (
                  <>
                    <input
                      type="text"
                      value={p.slipperType || ''}
                      onChange={(e) => updatePlayer(idx, 'slipperType', e.target.value)}
                      placeholder="🩴 Παντόφλες (π.χ. fluffy ροζ)"
                      className="px-2 py-1.5 border-2 border-border rounded-lg text-sm bg-background text-foreground font-body w-full sm:w-44"
                    />
                    <select
                      value={p.nailColor || 'Pink'}
                      onChange={(e) => updatePlayer(idx, 'nailColor', e.target.value)}
                      className="px-2 py-1.5 border-2 border-border rounded-lg text-sm bg-background text-foreground font-body"
                    >
                      {NAIL_COLORS.map((c) => (
                        <option key={c} value={c}>💅 {c}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <select
                      value={p.footwearLevel}
                      onChange={(e) => updatePlayer(idx, 'footwearLevel', parseInt(e.target.value))}
                      className="px-2 py-1.5 border-2 border-border rounded-lg text-sm bg-background text-foreground font-body"
                    >
                      {FOOTWEAR_LEVELS.map((f) => (
                        <option key={f.level} value={f.level}>{f.icon} {f.label}</option>
                      ))}
                    </select>
                    <select
                      value={p.toenailPerk}
                      onChange={(e) => updatePlayer(idx, 'toenailPerk', e.target.value)}
                      className="px-2 py-1.5 border-2 border-border rounded-lg text-sm bg-background text-foreground font-body"
                    >
                      {TOENAIL_PERKS.map((perk) => (
                        <option key={perk.id} value={perk.id}>{perk.icon} {perk.name}</option>
                      ))}
                    </select>
                  </>
                )}
                {players.length > Math.max(2, minPlayers) && (
                  <button
                    onClick={() => removePlayer(idx)}
                    className="px-2 py-1 border-2 border-border rounded-lg bg-destructive text-foreground font-bold shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-foreground/60 font-body">
            {mode === 'pajama'
              ? '🩴 Παντόφλες & 💅 χρώμα νυχιών — τα βασικά της βραδιάς. Δεν υπάρχουν παπούτσια ή perks σε αυτό το mode.'
              : '👟 Επίπεδο Παπουτσιού καθορίζει τη σκάλα ποινών · 💅 Toenail Perk = 1 ειδική δύναμη ανά παίκτρια'}
          </div>
        </ComicPanel>

        <ComicPanel className={testMode ? 'bg-tarot-royal/40' : 'bg-secondary'}>
          <button onClick={() => setTestMode((t) => !t)} className="w-full flex items-center justify-between gap-3 text-left">
            <div>
              <div className="font-heading text-xl text-primary">🧪 TEST MODE</div>
              <div className="text-sm text-foreground/70 font-body">
                Δοκιμαστική παρτίδα: δεν αποθηκεύεται στο Chronicle ούτε στα στατιστικά.
              </div>
            </div>
            <span className={`font-heading text-lg px-3 py-1 rounded border-2 border-border shrink-0 ${testMode ? 'bg-tarot-forest text-foreground' : 'bg-background text-foreground/60'}`}>
              {testMode ? 'ON' : 'OFF'}
            </span>
          </button>
        </ComicPanel>

        <div className="text-center pb-8 sticky bottom-0">
          <ComicButton variant="magenta" size="lg" onClick={handleStart} disabled={!canStart}>
            🎬 ΕΝΑΡΞΗ ΠΑΙΧΝΙΔΙΟΥ
          </ComicButton>
          {!canStart && (
            <div className="text-sm mt-2 font-bold bg-secondary inline-block px-3 py-1 rounded border-2 border-border text-foreground font-body">
              Χρειάζονται τουλάχιστον {minPlayers} παίκτριες με όνομα.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}