import React, { useState } from 'react';
import { DockItem } from '@/design/ui';
import { FILM } from '@/data/brandArt';
import { VIDEO_SLOTS } from '@/data/mediaSlots';
import { MOVIE_MEGA_SECTIONS } from '@/data/modes/movieMedia';
import { showVideoSrc } from '@/components/tv/TVShowVideos';
import { isManualVideo } from '@/lib/videoPolicy';

// 10.5.0 · Tablet → «🎬 Βίντεο»: η σκηνοθέτρια αποφασίζει πότε παίζει κάθε βίντεο στην TV.
// «Μόνο με Play» (προεπιλογή): τίποτα δεν ξεκινά μόνο του. ▶ = παίζει μία φορά στην TV · ■ = σταματά.

const GROUPS = [
  { id: 'open', label: 'Άνοιγμα', ids: ['welcomeVideo', 'showOpenVideo', 'meetCastVideo', 'countdownVideo', 'gameIntroVideo', 'modeIntro'] },
  { id: 'movie', label: 'Η Ταινία' },
  { id: 'break', label: 'Διάλειμμα & φινάλε', ids: ['breakOutVideo', 'breakBackVideo', 'breakLoopVideo', 'recapVideo', 'winnerRevealVideo'] },
  { id: 'stinger', label: 'Stingers' },
];
const labelOf = (id) => (id === 'modeIntro' ? 'Intro του mode' : VIDEO_SLOTS.find((v) => v.id === id)?.label || MOVIE_MEGA_SECTIONS.find((s) => s.id === id)?.label || id);

export default function VideoControl({ state, updateState }) {
  const [open, setOpen] = useState(false);
  const manual = isManualVideo(state);
  const mode = state?.mode;
  const list = (g) => {
    if (g.id === 'movie') return MOVIE_MEGA_SECTIONS.filter((s) => s.kind === 'video').map((s) => s.id);
    if (g.id === 'stinger') return VIDEO_SLOTS.filter((v) => v.group === 'stinger').map((v) => v.id);
    return g.ids;
  };
  const playing = state?.showCue && !state.showCue.stop && Date.now() - (state.showCue.at || 0) < 300000 ? state.showCue.id : null;
  const play = (id) => updateState({ showCue: { id, at: Date.now() } });
  const stop = () => updateState({ showCue: { stop: true, at: Date.now() } });
  const available = GROUPS.map((g) => ({ ...g, items: list(g).filter((id) => showVideoSrc(id, mode)) })).filter((g) => g.items.length);
  const count = available.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <DockItem order={3} fallbackClassName="fixed bottom-72 left-3 z-[65]">
        <button type="button" className="ui-btn" onClick={() => setOpen(true)} aria-label="Βίντεο στην TV">🎬 Βίντεο{manual ? '' : ' · αυτόματα'}</button>
      </DockItem>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-3 sm:items-center" onClick={() => setOpen(false)}>
          <div className="max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#1C1C1E] p-4 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xl font-bold">🎬 Βίντεο & ήχος στην TV</div>
              <button type="button" className="ui-btn ui-btn--sm" onClick={() => setOpen(false)}>Κλείσιμο</button>
            </div>
            <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-black/30 px-4 py-3">
              <span className="min-w-0">
                <span className="block font-semibold">Μόνο με Play</span>
                <span className="block text-xs text-white/55">{manual ? 'Κανένα βίντεο δεν ξεκινά μόνο του. Τα φόντα μένουν ακίνητα.' : 'Τα βίντεο παίζουν αυτόματα στις στιγμές τους (όπως παλιά).'}</span>
              </span>
              <input type="checkbox" role="switch" className="h-6 w-11 shrink-0 accent-[#E8C26B]" checked={manual} onChange={(e) => updateState({ videoMode: e.target.checked ? 'manual' : 'auto' })} />
            </label>
            {state?.mg?.cg && (
              <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-black/30 px-4 py-3">
                <span className="min-w-0">
                  <span className="block font-semibold">🎵 Μουσική ηπείρου στην TV</span>
                  <span className="block text-xs text-white/55">{state.musicOff ? 'Κλειστή.' : 'Χαμηλό χαλί ανά ήπειρο· δυναμώνει στον Τροχό, στο ζάρι και στο κουτί. Σιωπά σε ΣΤΟΠ και όταν παίζει βίντεο.'}</span>
                </span>
                <input type="checkbox" role="switch" className="h-6 w-11 shrink-0 accent-[#E8C26B]" checked={!state.musicOff} onChange={(e) => updateState({ musicOff: !e.target.checked })} />
              </label>
            )}
            {state?.mg?.cg && (
              <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-black/30 px-4 py-3">
                <span className="min-w-0">
                  <span className="block font-semibold">🎙️ Εκφωνητής</span>
                  <span className="block text-xs text-white/55">Η TV λέει τις μεγάλες στιγμές (πράξη, Τροχός, Deal, φινάλε) με την ελληνική φωνή της συσκευής, αν έχει. Αλλιώς σιωπά.</span>
                </span>
                <input type="checkbox" role="switch" className="h-6 w-11 shrink-0 accent-[#E8C26B]" checked={!!state.announcer} onChange={(e) => updateState({ announcer: e.target.checked })} />
              </label>
            )}
            <button type="button" onClick={stop} className="mt-3 h-12 w-full rounded-full bg-[#FF453A] text-base font-bold">■ Σταμάτα ό,τι παίζει</button>
            {!count && <p className="mt-4 text-sm text-white/60">Δεν έχουν ανέβει βίντεο. Admin → Φωτογραφίες & βίντεο → Χάρτης.</p>}
            {available.map((g) => (
              <div key={g.id} className="mt-4">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#E8C26B]">{g.label}</div>
                <div className="grid gap-2">
                  {g.items.map((id) => (
                    <button key={id} type="button" onClick={() => play(id)}
                      className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl px-4 text-left ${playing === id ? 'bg-[#E8C26B] text-black' : 'bg-white/10'}`}>
                      <span className="min-w-0 truncate text-sm font-semibold">{labelOf(id)}</span>
                      <span className="shrink-0 text-lg font-black">{playing === id ? '●' : '▶'}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {FILM && <p className="mt-4 text-xs text-white/40">Το ▶ παίζει το βίντεο μία φορά σε όλη την οθόνη της TV, με ήχο. Πάτημα στην TV ή ■ το κλείνει.</p>}
          </div>
        </div>
      )}
    </>
  );
}
