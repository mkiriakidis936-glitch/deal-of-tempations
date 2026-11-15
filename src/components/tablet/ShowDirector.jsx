import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { GAME_MODES } from '@/data/gameConfig';
import { isNewMode, modeMeta, ACT_META } from '@/data/modes/modeRegistry';
import { PAJAMA_ACTS } from '@/data/pajamaProgram';

const BASE_ACTS = [
  { id: 'intro', label: 'ΕΙΣΑΓΩΓΗ', icon: '🎬', subtitle: 'Η βραδιά ξεκινά' },
  { id: 'patrol', label: 'ΠΕΡΙΠΟΛΙΑ', icon: '🚔', subtitle: 'Στάδιο 1 — Περιπολία' },
  { id: 'interrogation', label: 'ΑΝΑΚΡΙΣΗ', icon: '🔍', subtitle: 'Στάδιο 2 — Ανάκριση' },
  { id: 'finale', label: 'ΦΙΝΑΛΕ', icon: '🏆', subtitle: 'Στάδιο 3 — Φινάλε' },
  { id: 'awards', label: 'ΒΡΑΒΕΙΑ', icon: '🏅', subtitle: 'Απολογισμός & Βραβεία' },
];

const DECISION_PRESETS = [
  'Η ΑΠΟΦΑΣΗ ΕΙΝΑΙ...',
  'ΑΠΟΤΕΛΕΣΜΑ ΨΗΦΟΦΟΡΙΑΣ',
  'Η ΤΕΛΙΚΗ ΑΝΑΚΟΙΝΩΣΗ',
  'Ο ΝΙΚΗΤΗΣ ΤΟΥ ΕΠΕΙΣΟΔΙΟΥ',
];

export default function ShowDirector({ state, updateState, onClose }) {
  const showMode = state.showMode || {};
  const modeName = GAME_MODES.find((mode) => mode.id === state.mode)?.name || state.mode || 'LIVE SHOW';
  const acts = isNewMode(state.mode)
    ? (modeMeta(state.mode)?.acts || []).map((act, index) => ({
      id: act,
      label: ACT_META[act]?.title || act,
      icon: '🎬',
      subtitle: `Φάση ${index + 1} από ${modeMeta(state.mode).acts.length}`,
    }))
    : state.mode === 'pajama'
    ? PAJAMA_ACTS.map((act, index) => ({ id: act.id, label: act.title, icon: '🎬', subtitle: act.subtitle || `Πράξη ${index + 1}` }))
    : state.mode === 'marathon'
    ? [
      { id: 'marathon_1', label: 'INFILTRATION', icon: '🚔', subtitle: 'Στάδιο 1 · Infiltration' },
      { id: 'marathon_2', label: 'VAULT', icon: '🔐', subtitle: 'Στάδιο 2 · Vault' },
      { id: 'marathon_3', label: 'RAIDS', icon: '⚡', subtitle: 'Στάδιο 3 · Raids' },
      { id: 'marathon_4', label: 'LOCKDOWN', icon: '🚨', subtitle: 'Στάδιο 4 · Lockdown' },
    ]
    : state.mode === 'arrest_heist'
    ? [
      { id: 'arrest_1', label: 'ARREST & HEIST', icon: '🚨', subtitle: 'Στάδιο 1 · Κύριο παιχνίδι' },
      { id: 'arrest_2', label: 'GRAND HEIST', icon: '🔐', subtitle: 'Στάδιο 2 · Vault' },
      { id: 'arrest_3', label: 'FINALE', icon: '🏆', subtitle: 'Στάδιο 3 · Αποτέλεσμα' },
    ]
    : BASE_ACTS;

  const currentActId = isNewMode(state.mode)
    ? modeMeta(state.mode)?.acts?.[state.mg?.actIndex || 0]
    : state.mode === 'pajama'
    ? PAJAMA_ACTS[state.pajama?.actIndex || 0]?.id
    : state.mode === 'marathon'
    ? `marathon_${state.marathonStage || 1}`
    : state.mode === 'arrest_heist'
    ? `arrest_${state.stage || 1}`
    : ({ 0: 'intro', 1: 'patrol', 2: 'interrogation', 3: 'finale' })[state.stage] || 'intro';
  const [revealTitle, setRevealTitle] = useState('');
  const [revealContent, setRevealContent] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(showMode.autoSpeak !== false);

  async function triggerTransition(act) {
    const actDef = acts.find((a) => a.id === act);
    await updateState({
      showMode: {
        ...showMode,
        act,
        autoSpeak,
        transition: { active: true, actName: actDef.label, subtitle: actDef.subtitle, icon: actDef.icon, timestamp: Date.now() },
        reveal: null,
      },
    });
  }

  async function startReveal() {
    if (!revealTitle.trim()) return;
    await updateState({
      showMode: {
        ...showMode,
        autoSpeak,
        reveal: { active: true, title: revealTitle, content: revealContent, phase: 'buildup', timestamp: Date.now() },
      },
    });
  }

  async function doReveal() {
    const current = showMode.reveal;
    if (!current) return;
    await updateState({
      showMode: { ...showMode, reveal: { ...current, phase: 'reveal', timestamp: Date.now() } },
    });
  }

  async function closeReveal() {
    await updateState({
      showMode: { ...showMode, reveal: null },
    });
  }

  async function toggleAutoSpeak() {
    const next = !autoSpeak;
    setAutoSpeak(next);
    await updateState({ showMode: { ...showMode, autoSpeak: next } });
  }

  return (
    <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-3 max-h-[85vh] overflow-y-auto">
        <ComicPanel className="bg-tarot-royal text-center py-4">
          <div className="font-heading text-3xl comic-text-stroke text-tarot-gold">🎬 SHOW DIRECTOR</div>
          <div className="text-sm font-bold text-foreground/80 font-body">{modeName} · Σκηνοθεσία επεισοδίου</div>
          <div className="mt-1 text-xs text-foreground/55">Τρέχουσα φάση: {acts.find((act) => act.id === currentActId)?.label || '—'}</div>
        </ComicPanel>

        <ComicPanel className="bg-card flex items-center justify-between">
          <div className="font-heading text-sm text-primary">🔊 Αυτόματη Εκφώνηση</div>
          <ComicButton variant={autoSpeak ? 'green' : 'dark'} size="sm" onClick={toggleAutoSpeak}>
            {autoSpeak ? '✓ ΕΝΕΡΓΗ' : '✗ ΑΝΕΝΕΡΓΗ'}
          </ComicButton>
        </ComicPanel>

        <ComicPanel className="bg-card">
          <div className="font-heading text-lg mb-2 text-primary">🎭 ΦΑΣΕΙΣ SHOW</div>
          <div className="grid grid-cols-1 gap-2">
            {acts.map((a) => (
              <ComicButton
                key={a.id}
                variant={showMode.act === a.id ? 'magenta' : currentActId === a.id ? 'yellow' : 'white'}
                size="sm"
                onClick={() => triggerTransition(a.id)}
                className="w-full flex items-center gap-2"
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-left flex-1">
                  <div className="font-heading">{a.label}</div>
                  <div className="text-xs opacity-70 font-body">{a.subtitle}</div>
                </span>
              </ComicButton>
            ))}
          </div>
        </ComicPanel>

        <ComicPanel className="bg-card">
          <div className="font-heading text-lg mb-2 text-primary">✨ ΔΡΑΜΑΤΙΚΗ ΑΠΟΚΑΛΥΨΗ</div>
          {showMode.reveal?.active ? (
            <div className="space-y-2">
              <div className="comic-panel-sm p-3 bg-tarot-wine/30">
                <div className="font-heading text-sm text-primary">{showMode.reveal.title}</div>
                <div className="text-xs text-foreground/70 font-body">{showMode.reveal.content}</div>
                <div className="text-xs mt-1 font-bold text-foreground">
                  Φάση: {showMode.reveal.phase === 'buildup' ? '🔴 BUILD-UP' : '🟢 ΑΠΟΚΑΛΥΨΗ'}
                </div>
              </div>
              {showMode.reveal.phase === 'buildup' && (
                <ComicButton variant="yellow" size="lg" onClick={doReveal} className="w-full">
                  ✨ ΑΠΟΚΑΛΥΨΕ!
                </ComicButton>
              )}
              <ComicButton variant="red" size="sm" onClick={closeReveal} className="w-full">
                ✕ ΚΛΕΙΣΙΜΟ REVEAL
              </ComicButton>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-bold text-foreground/55">ΕΤΟΙΜΕΣ ΣΚΗΝΕΣ ΣΗΜΑΝΤΙΚΩΝ ΑΠΟΦΑΣΕΩΝ</div>
              <div className="grid grid-cols-2 gap-2">
                {DECISION_PRESETS.map((preset) => (
                  <ComicButton key={preset} variant="dark" size="sm" onClick={() => setRevealTitle(preset)}>
                    {preset}
                  </ComicButton>
                ))}
              </div>
              <input
                type="text"
                value={revealTitle}
                onChange={(e) => setRevealTitle(e.target.value)}
                placeholder="Τίτλος αποκάλυψης (π.χ. Η Most Wanted είναι...)"
                className="cinp w-full text-sm"
              />
              <textarea
                value={revealContent}
                onChange={(e) => setRevealContent(e.target.value)}
                placeholder="Κείμενο αποκάλυψης (προαιρετικό)"
                rows={2}
                className="cinp w-full text-sm"
              />
              <ComicButton variant="purple" size="lg" onClick={startReveal} disabled={!revealTitle.trim()} className="w-full">
                🔴 ΞΕΚΙΝΑ BUILD-UP
              </ComicButton>
              <div className="text-xs text-foreground/50 font-body text-center">
                Η TV δείχνει pulsing «...» → πάτα ΑΠΟΚΑΛΥΨΕ για το αποτέλεσμα
              </div>
            </div>
          )}
        </ComicPanel>

        <ComicButton variant="red" size="sm" onClick={onClose} className="w-full">✕ ΚΛΕΙΣΙΜΟ</ComicButton>
      </div>
    </div>
  );
}