import { useEffect, useRef } from 'react';
import { addHistory, calculateMostWanted } from '@/lib/gameLogic';

// Όταν το συγχρονισμένο χρονόμετρο φτάσει στο 0, εκτελεί αυτόματα την επιλεγμένη ενέργεια.
export function useSyncTimerAutoFire(state, updateState) {
  const firedRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const timer = state?.syncTimer;

  useEffect(() => {
    if (!timer?.running || !timer?.onExpire || timer.onExpire === 'none') return undefined;
    if (state?.stopActive) return undefined;

    const tick = () => {
      const s = stateRef.current;
      const current = s?.syncTimer;
      if (!current?.running) return;
      if (current.endsAt - Date.now() > 0) return;
      if (firedRef.current === current.endsAt) return;
      firedRef.current = current.endsAt;

      const stopped = { ...current, running: false, remaining: 0 };

      if (current.onExpire === 'penalty_all') {
        const players = (s.players || []).map((p) => ({ ...p, penaltyStep: (p.penaltyStep || 0) + 1 }));
        const history = addHistory({ ...s, players }, {
          type: 'timer_expired',
          detail: 'Ο χρόνος έληξε — όλες +1 ποινή',
        });
        updateState({ players, history, syncTimer: stopped });
      } else if (current.onExpire === 'bomb') {
        const target = calculateMostWanted(s.players) || s.players?.[0];
        if (!target) return;
        updateState({ bombEvent: { active: true, targetId: target.id }, syncTimer: stopped });
      } else if (current.onExpire === 'flashbang') {
        if (window.__triggerFlashbang) window.__triggerFlashbang();
        updateState({ syncTimer: stopped });
      }
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timer?.endsAt, timer?.running, timer?.onExpire, state?.stopActive]);
}import { useEffect, useRef } from 'react';
import { addHistory, calculateMostWanted } from '@/lib/gameLogic';

// Όταν το συγχρονισμένο χρονόμετρο φτάσει στο 0, εκτελεί αυτόματα την επιλεγμένη ενέργεια.
export function useSyncTimerAutoFire(state, updateState) {
  const firedRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const timer = state?.syncTimer;

  useEffect(() => {
    if (!timer?.running || !timer?.onExpire || timer.onExpire === 'none') return undefined;
    if (state?.stopActive) return undefined;

    const tick = () => {
      const s = stateRef.current;
      const current = s?.syncTimer;
      if (!current?.running) return;
      if (current.endsAt - Date.now() > 0) return;
      if (firedRef.current === current.endsAt) return;
      firedRef.current = current.endsAt;

      const stopped = { ...current, running: false, remaining: 0 };

      if (current.onExpire === 'penalty_all') {
        const players = (s.players || []).map((p) => ({ ...p, penaltyStep: (p.penaltyStep || 0) + 1 }));
        const history = addHistory({ ...s, players }, {
          type: 'timer_expired',
          detail: 'Ο χρόνος έληξε — όλες +1 ποινή',
        });
        updateState({ players, history, syncTimer: stopped });
      } else if (current.onExpire === 'bomb') {
        const target = calculateMostWanted(s.players) || s.players?.[0];
        if (!target) return;
        updateState({ bombEvent: { active: true, targetId: target.id }, syncTimer: stopped });
      } else if (current.onExpire === 'flashbang') {
        if (window.__triggerFlashbang) window.__triggerFlashbang();
        updateState({ syncTimer: stopped });
      }
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timer?.endsAt, timer?.running, timer?.onExpire, state?.stopActive]);
}