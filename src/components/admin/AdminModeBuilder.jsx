import React, { useEffect, useMemo, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import MediaField from '@/components/admin/MediaField';
import CardPreviewPair from '@/components/admin/CardPreviewPair';
import AdminSettingVersionHistory from '@/components/admin/AdminSettingVersionHistory';
import { SQUARE_TYPES, LOUNGE_CARDS, INTERROGATION_QUESTIONS } from '@/data/modes/loungeContent';
import {
  CUSTOM_MODES_KEY, SQUARE_IDS, customMinutes, fetchCustomModesRecord, newCustomMode, normalizeCustomMode, saveCustomModes,
} from '@/lib/customModes';

const input = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm';
const label = 'block space-y-1 text-xs font-bold text-foreground/75';

function shuffleBoard(board) {
  const rest = board.slice(1);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return ['start', ...rest];
}

export default function AdminModeBuilder() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [openCard, setOpenCard] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchCustomModesRecord()
      .then((record) => {
        const list = (record?.value?.items || []).map(normalizeCustomMode);
        setItems(list);
        setSelectedId(list[0]?.id || '');
      })
      .catch((error) => setMessage(error.message || 'Δεν φορτώθηκαν τα modes.'))
      .finally(() => setLoaded(true));
  }, []);

  const mode = items.find((item) => item.id === selectedId) || null;
  const minutes = mode ? customMinutes(mode) : 0;
  const counts = useMemo(() => {
    const out = {};
    (mode?.board || []).forEach((type) => { out[type] = (out[type] || 0) + 1; });
    return out;
  }, [mode]);

  const change = (patch) => {
    setItems((list) => list.map((item) => (item.id === selectedId ? { ...item, ...patch } : item)));
    setDirty(true);
  };
  const setSquare = (index, type) => change({ board: mode.board.map((t, i) => (i === index ? type : t)) });
  const setCard = (index, patch) => change({ cards: mode.cards.map((c, i) => (i === index ? { ...c, ...patch } : c)) });
  const setPhase = (index, patch) => change({ phases: mode.phases.map((p, i) => (i === index ? { ...p, ...patch } : p)) });

  function addMode(fromLounge = false) {
    const fresh = newCustomMode();
    if (fromLounge) {
      fresh.name = 'PAJAMA HEIST & ARREST (αντίγραφο)';
      fresh.icon = '🚔';
      fresh.cards = LOUNGE_CARDS.map((card) => ({ ...card, id: `${fresh.id}_${card.id}` }));
      fresh.questions = [...INTERROGATION_QUESTIONS];
    }
    setItems((list) => [...list, fresh]);
    setSelectedId(fresh.id);
    setOpenCard(0);
    setDirty(true);
  }

  async function save() {
    setBusy(true);
    setMessage('');
    try {
      const saved = await saveCustomModes(items);
      setItems(saved);
      setDirty(false);
      setMessage('Αποθηκεύτηκε. Τα modes εμφανίζονται στο Tablet (Επιλογή Mode) — άνοιξε ξανά το Tablet αν ήταν ήδη ανοιχτό.');
    } catch (error) {
      setMessage(error.message || 'Η αποθήκευση απέτυχε.');
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    if (!mode || !window.confirm(`Να διαγραφεί το mode «${mode.name}»; (Παρτίδες που ήδη παίζονται συνεχίζουν κανονικά.)`)) return;
    setItems((list) => list.filter((item) => item.id !== mode.id));
    setSelectedId('');
    setDirty(true);
  }

  if (!loaded) return <ComicPanel className="bg-card">Φόρτωση…</ComicPanel>;

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-heading text-xl text-primary">🛠️ Κατασκευαστής MODES</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="adm-pill" onClick={() => addMode(false)}>+ Νέο mode</button>
            <button type="button" className="adm-pill" onClick={() => addMode(true)}>+ Αντίγραφο του Pajama Heist & Arrest</button>
          </div>
        </div>
        {items.length === 0
          ? <div className="text-sm text-foreground/60">Δεν υπάρχει ακόμη δικό σου mode. Πάτα «+ Νέο mode».</div>
          : (
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setOpenCard(0); }} className={`rounded-xl border px-3 py-2 text-sm ${item.id === selectedId ? 'border-[#E8C26B] bg-[#E8C26B]/15' : 'border-border'}`}>
                  {item.icon} {item.name}{item.active ? '' : ' · ανενεργό'}
                </button>
              ))}
            </div>
          )}
        {message && <div className="text-sm">{message}</div>}
      </ComicPanel>

      {mode && (
        <>
          <ComicPanel className="bg-card space-y-3">
            <div className="font-heading text-lg">Βασικά</div>
            <div className="grid gap-3 sm:grid-cols-[1fr_90px]">
              <label className={label}>Όνομα<input className={input} value={mode.name} onChange={(e) => change({ name: e.target.value })} /></label>
              <label className={label}>Εικονίδιο<input className={input} value={mode.icon} onChange={(e) => change({ icon: e.target.value })} /></label>
            </div>
            <label className={label}>Περιγραφή (φαίνεται στην επιλογή mode)<textarea rows={2} className={input} value={mode.desc} onChange={(e) => change({ desc: e.target.value })} /></label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className={label}>Ελάχιστες παίκτριες<input type="number" className={input} value={mode.min} onChange={(e) => change({ min: Number(e.target.value) })} /></label>
              <label className={label}>Μέγιστες παίκτριες<input type="number" className={input} value={mode.max} onChange={(e) => change({ max: Number(e.target.value) })} /></label>
              <label className={label}>Αρχικό Loot (€)<input type="number" className={input} value={mode.startLoot} onChange={(e) => change({ startLoot: Number(e.target.value) })} /></label>
              <label className={label}>Μπόνους αφετηρίας (€)<input type="number" className={input} value={mode.passStartBonus} onChange={(e) => change({ passStartBonus: Number(e.target.value) })} /></label>
              <label className={label}>Ανταμοιβή κάρτας (€)<input type="number" className={input} value={mode.cardReward} onChange={(e) => change({ cardReward: Number(e.target.value) })} /></label>
              <label className={label}>Παγίδα Γέλιου (″)<input type="number" className={input} value={mode.tickleSeconds} onChange={(e) => change({ tickleSeconds: Number(e.target.value) })} /></label>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mode.active} onChange={(e) => change({ active: e.target.checked })} /> Ενεργό (εμφανίζεται στο Tablet)</label>
          </ComicPanel>

          <ComicPanel className="bg-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-heading text-lg">Ταμπλό · {mode.board.length} τετράγωνα</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="adm-pill" disabled={mode.board.length <= 8} onClick={() => change({ board: mode.board.slice(0, -1) })}>− Τετράγωνο</button>
                <button type="button" className="adm-pill" disabled={mode.board.length >= 40} onClick={() => change({ board: [...mode.board, 'loot'] })}>+ Τετράγωνο</button>
                <button type="button" className="adm-pill" onClick={() => change({ board: shuffleBoard(mode.board) })}>🔀 Ανακάτεμα</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
              {mode.board.map((type, index) => (
                <label key={index} className="rounded-xl border p-1.5 text-center" style={{ borderColor: `${SQUARE_TYPES[type]?.color}88`, background: `${SQUARE_TYPES[type]?.color}18` }}>
                  <div className="text-xl">{SQUARE_TYPES[type]?.icon}</div>
                  <div className="text-[10px] opacity-60">#{index + 1}</div>
                  <select value={type} disabled={index === 0} onChange={(e) => setSquare(index, e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-1 py-1 text-[11px]">
                    {SQUARE_IDS.map((id) => <option key={id} value={id}>{SQUARE_TYPES[id].name}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <div className="grid gap-1.5 text-xs sm:grid-cols-2">
              {SQUARE_IDS.map((id) => <div key={id}><b>{SQUARE_TYPES[id].icon} {SQUARE_TYPES[id].name} ×{counts[id] || 0}:</b> <span className="opacity-70">{SQUARE_TYPES[id].text}</span></div>)}
            </div>
          </ComicPanel>

          <ComicPanel className="bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-heading text-lg">Φάσεις · συνολικά {minutes}′</div>
              <button type="button" className="adm-pill" disabled={mode.phases.length >= 8} onClick={() => change({ phases: [...mode.phases, { id: `phase${Date.now()}`, name: 'Νέα φάση', minutes: 15, text: '' }] })}>+ Φάση</button>
            </div>
            {mode.phases.map((phase, index) => (
              <div key={phase.id || index} className="grid gap-2 rounded-xl border border-border/50 p-2 sm:grid-cols-[1fr_90px_auto]">
                <input className={input} value={phase.name} onChange={(e) => setPhase(index, { name: e.target.value })} />
                <input type="number" className={input} value={phase.minutes} onChange={(e) => setPhase(index, { minutes: Number(e.target.value) })} />
                <button type="button" className="adm-pill" disabled={mode.phases.length <= 1} onClick={() => change({ phases: mode.phases.filter((_, i) => i !== index) })}>Αφαίρεση</button>
                <textarea rows={2} className={`${input} sm:col-span-3`} placeholder="Τι γίνεται σε αυτή τη φάση" value={phase.text} onChange={(e) => setPhase(index, { text: e.target.value })} />
              </div>
            ))}
          </ComicPanel>

          <ComicPanel className="bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-heading text-lg">Κάρτες · {mode.cards.length}</div>
              <button type="button" className="adm-pill" onClick={() => { change({ cards: [...mode.cards, { id: `${mode.id}_c${Date.now()}`, title: 'Νέα κάρτα', text: '' }] }); setOpenCard(mode.cards.length); }}>+ Κάρτα</button>
            </div>
            {mode.cards.map((card, index) => (
              <div key={card.id} className="rounded-xl border border-border/50 p-2">
                <button type="button" className="flex w-full items-center justify-between gap-2 text-left text-sm" onClick={() => setOpenCard(openCard === index ? -1 : index)}>
                  <b>{index + 1}. {card.title || '(χωρίς τίτλο)'}</b><span className="opacity-60">{openCard === index ? '▲' : '▼'}</span>
                </button>
                {openCard === index && (
                  <div className="mt-2 grid gap-3 lg:grid-cols-2">
                    <div className="space-y-2">
                      <label className={label}>Τίτλος<input className={input} value={card.title} onChange={(e) => setCard(index, { title: e.target.value })} /></label>
                      <label className={label}>Κείμενο<textarea rows={4} className={input} value={card.text} onChange={(e) => setCard(index, { text: e.target.value })} /></label>
                      <label className={label}>Χρονόμετρο (″, προαιρετικό)<input type="number" className={input} value={card.secs || ''} onChange={(e) => setCard(index, { secs: e.target.value === '' ? undefined : Number(e.target.value) })} /></label>
                      <div className={label}>Εικόνα κάρτας<MediaField value={card.image || ''} onChange={(url) => setCard(index, { image: url || undefined })} /></div>
                      <button type="button" className="adm-pill" disabled={mode.cards.length <= 1} onClick={() => { change({ cards: mode.cards.filter((_, i) => i !== index) }); setOpenCard(-1); }}>Διαγραφή κάρτας</button>
                    </div>
                    <CardPreviewPair card={{ title: card.title, text: card.text, image: card.image, secs: card.secs, kicker: 'Κάρτα Εντάλματος', icon: '📜', reward: mode.cardReward ? `${mode.cardReward}€` : null }} />
                  </div>
                )}
              </div>
            ))}
          </ComicPanel>

          <ComicPanel className="bg-card space-y-2">
            <div className="font-heading text-lg">Ερωτήσεις ανάκρισης · {mode.questions.length}</div>
            <div className="text-xs text-foreground/60">Μία ερώτηση ανά γραμμή (τουλάχιστον 3).</div>
            <textarea rows={8} className={input} value={mode.questions.join('\n')} onChange={(e) => change({ questions: e.target.value.split('\n') })} />
          </ComicPanel>

          <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-card p-3">
            <span className="text-xs">{dirty ? 'Μη αποθηκευμένες αλλαγές' : 'Αποθηκευμένο'} · {mode.board.length} τετράγωνα · {mode.cards.length} κάρτες · {minutes}′</span>
            <div className="flex gap-2">
              <ComicButton size="sm" variant="red" onClick={remove}>Διαγραφή mode</ComicButton>
              <ComicButton size="sm" variant="green" disabled={busy} onClick={save}>{busy ? 'Αποθήκευση…' : 'Αποθήκευση'}</ComicButton>
            </div>
          </div>
        </>
      )}
      {!mode && dirty && <ComicButton variant="green" disabled={busy} onClick={save}>Αποθήκευση αλλαγών</ComicButton>}
      <AdminSettingVersionHistory settingKey={CUSTOM_MODES_KEY} title="Ιστορικό εκδόσεων modes" onRestore={(value) => { const list = (value?.items || []).map(normalizeCustomMode); setItems(list); setSelectedId(list[0]?.id || ''); setDirty(false); }} />
    </div>
  );
}
