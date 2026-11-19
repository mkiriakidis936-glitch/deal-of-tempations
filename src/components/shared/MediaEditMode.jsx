import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  ART, PHOTO, HEIST_PHOTOS, PAJAMA_PHOTOS, SITE_VIDEOS, DEFAULTS, applyMediaOverrides,
} from '@/data/brandArt';
import { IMAGE_SLOTS, PHOTO_SPOT_IDS } from '@/data/mediaSlots';
import { uploadMedia, patchOverrides } from '@/lib/media';

const PAGES = ['/site', '/promo', '/invitation', '/pajama-invite', '/pajama-form', '/tv', '/play', '/gift-unlock', '/intake'];
const IMG_ACCEPT = 'image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic';
const VID_ACCEPT = 'video/*,.mp4,.webm,.mov';

// Ποιο «σημείο» του brandArt αντιστοιχεί σε αυτό το στοιχείο της σελίδας;
function resolve(el) {
  const src = el.getAttribute('src');
  if (!src) return null;
  if (el.tagName === 'VIDEO') {
    const slot = el.dataset.media;
    if (slot && (slot === 'agent' || PHOTO_SPOT_IDS.includes(slot))) return { kind: 'slot', id: slot };
    const i = SITE_VIDEOS.indexOf(src);
    return i >= 0 ? { kind: 'list', id: 'siteVideos', index: i } : null;
  }
  const s = IMAGE_SLOTS.find((x) => ART[x.id] === src);
  if (s) return { kind: 'slot', id: s.id };
  const photoSlot = PHOTO_SPOT_IDS.find((id) => PHOTO[id] === src);
  if (photoSlot) return { kind: 'slot', id: photoSlot };
  let i = HEIST_PHOTOS.indexOf(src);
  if (i >= 0) return { kind: 'list', id: 'heistPhotos', index: i };
  i = PAJAMA_PHOTOS.indexOf(src);
  if (i >= 0) return { kind: 'list', id: 'pajamaPhotos', index: i };
  return null;
}

export default function MediaEditMode() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [on, setOn] = useState(false);
  const [boxes, setBoxes] = useState([]);
  const [status, setStatus] = useState(null);
  const input = useRef(null);
  const pending = useRef(null);
  const raf = useRef(0);
  const allowed = user?.role === 'admin' && PAGES.includes(pathname);

  const scan = useCallback(() => {
    const vw = window.innerWidth; const vh = window.innerHeight;
    const out = [];
    document.querySelectorAll('img,video').forEach((el) => {
      if (el.closest('[data-media-ui]')) return;
      const r = el.getBoundingClientRect();
      if (r.width < 48 || r.height < 48 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return;
      const target = resolve(el);
      if (!target) return;
      out.push({ el, target, top: Math.max(8, r.top + 8), left: Math.min(vw - 52, Math.max(8, r.right - 52)) });
    });
    setBoxes(out);
  }, []);

  const schedule = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(scan);
  }, [scan]);

  useEffect(() => {
    if (!on || !allowed) { setBoxes([]); return undefined; }
    schedule();
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
    const t = setInterval(schedule, 800);
    return () => {
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      mo.disconnect(); clearInterval(t); cancelAnimationFrame(raf.current);
    };
  }, [on, allowed, schedule]);

  useEffect(() => { setOn(false); }, [pathname]);

  if (!allowed) return null;

  const choose = (box) => {
    pending.current = box;
    input.current.accept = box.el.tagName === 'VIDEO' ? VID_ACCEPT : IMG_ACCEPT;
    input.current.click();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const box = pending.current;
    if (!file || !box) return;
    const { el, target } = box;
    const oldSrc = el.getAttribute('src');
    try {
      setStatus('Ανεβαίνει…');
      const { url } = await uploadMedia(file, (p) => setStatus(`Ανεβαίνει ${Math.round(p * 100)}%`));
      setStatus('Αποθηκεύεται…');
      const next = await patchOverrides((o) => {
        if (target.kind === 'slot') o[target.id] = url;
        else { const l = [...(o[target.id] || DEFAULTS[target.id] || [])]; l[target.index] = url; o[target.id] = l; }
        return o;
      });
      applyMediaOverrides(next);
      // ζωντανή ενημέρωση της σελίδας, χωρίς refresh
      document.querySelectorAll('img,video').forEach((n) => {
        if (n.tagName === 'VIDEO') {
          const slot = n.dataset.media;
          const hit = n === el;
          if (hit) { n.setAttribute('src', url); n.load(); n.play?.().catch(() => {}); }
        } else if (el.tagName === 'IMG' && n.getAttribute('src') === oldSrc) {
          n.setAttribute('src', url);
        }
      });
      setStatus('Άλλαξε ✓');
    } catch (err) {
      setStatus(`⚠️ ${err.message}`);
    }
    setTimeout(() => setStatus(null), 3000);
    schedule();
  };

  return (
    <div data-media-ui>
      <input ref={input} type="file" hidden onChange={onFile} />
      {on && (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
          {boxes.map((b, i) => (
            <button
              key={i}
              onClick={() => choose(b)}
              style={{ top: b.top, left: b.left }}
              className="pointer-events-auto absolute w-11 h-11 rounded-full bg-primary text-tarot-dark text-lg border-2 border-black shadow-lg flex items-center justify-center"
              aria-label="Αλλαγή αρχείου"
            >
              ✏️
            </button>
          ))}
        </div>
      )}
      <div className="fixed left-3 z-[9999] flex flex-col items-start gap-2" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        {on && !status && (
          <div className="bg-black/85 text-white text-xs rounded-lg px-3 py-2 max-w-[260px]">Πάτα ✏️ πάνω σε φωτογραφία ή βίντεο για να την αλλάξεις.</div>
        )}
        {status && <div className="bg-black/85 text-white text-xs rounded-lg px-3 py-2">{status}</div>}
        <button
          onClick={() => setOn((v) => !v)}
          className={`h-12 px-4 rounded-full border-2 border-black shadow-lg text-sm font-bold ${on ? 'bg-primary text-tarot-dark' : 'bg-black/80 text-white'}`}
        >
          {on ? '✅ Τέλος' : '✏️ Αλλαγή φωτό/βίντεο'}
        </button>
      </div>
    </div>
  );
}
