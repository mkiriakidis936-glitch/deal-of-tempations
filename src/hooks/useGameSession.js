import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { isRetryableError, setPendingWrites } from '@/lib/connectionStatus';

export function useGameSession({ autoLoad = true } = {}) {
  const [session, setSession] = useState(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerPlayerId, setViewerPlayerId] = useState(null);
  const stateRef = useRef(null);
  const sessionRef = useRef(null);
  const [connectionEpoch, setConnectionEpoch] = useState(0);
  const recoveryBusyRef = useRef(false);
  const operationRef = useRef(0);
  const refreshRef = useRef(null);
  const viewerRef = useRef(null);
  viewerRef.current = viewerPlayerId;
  // Ουρά αλλαγών που δεν στάλθηκαν (έπεσε το WiFi / επανεκκίνηση server). Στέλνονται με τη σειρά μόλις γίνει δυνατό.
  const queueRef = useRef([]);
  const flushingRef = useRef(false);
  const retryTimerRef = useRef(null);

  const applyServer = useCallback((updated, targetSessionId) => {
    if (updated?.state && sessionRef.current?.id === targetSessionId) {
      sessionRef.current = updated;
      stateRef.current = updated.state;
      setSession(updated);
      setState(updated.state);
    }
  }, []);

  const flushQueue = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
    try {
      while (queueRef.current.length) {
        const item = queueRef.current[0];
        try {
          const updated = await base44.entities.GameSession.update(item.targetSessionId, item.payload);
          queueRef.current.shift();
          setPendingWrites(queueRef.current.length);
          if (!queueRef.current.length) applyServer(updated, item.targetSessionId);
        } catch (e) {
          if (isRetryableError(e)) {
            retryTimerRef.current = setTimeout(() => { retryTimerRef.current = null; flushQueue(); }, 3000);
            return;
          }
          // Η αλλαγή απορρίφθηκε οριστικά (π.χ. δεν ισχύει πια): πετιέται, συνεχίζουμε με τις επόμενες.
          queueRef.current.shift();
          setPendingWrites(queueRef.current.length);
          console.error('Queued update rejected', e);
        }
      }
    } finally {
      flushingRef.current = false;
    }
  }, [applyServer]);

  useEffect(() => {
    const retry = () => { if (queueRef.current.length) flushQueue(); };
    window.addEventListener('online', retry);
    document.addEventListener('visibilitychange', retry);
    return () => {
      window.removeEventListener('online', retry);
      document.removeEventListener('visibilitychange', retry);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [flushQueue]);

  useEffect(() => {
    if (!autoLoad) { setLoading(false); return; }
    const operation = ++operationRef.current;
    let alive = true;
    (async () => {
      try {
        const { items } = await base44.entities.GameSession.filter({}, { sort: '-created_date', limit: 1 });
        if (!alive || operation !== operationRef.current) return;
        if (items && items.length > 0) {
          sessionRef.current = items[0];
          stateRef.current = items[0].state || {};
          setSession(items[0]);
          setState(items[0].state || {});
        }
      } catch (e) {
        if (alive && operation === operationRef.current) console.error('Failed to load session', e);
      } finally {
        if (alive && operation === operationRef.current) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [autoLoad]);

  useEffect(() => {
    if (!session) return;
    const unsub = base44.entities.GameSession.subscribe((event) => {
      if (event.type === 'resync') { refreshRef.current?.(); return; }
      if (event.id !== sessionRef.current?.id) return;
      if (event.type === 'delete') {
        sessionRef.current = null;
        stateRef.current = null;
        setSession(null);
        setState(null);
        return;
      }
      const updated = { ...sessionRef.current, ...event.data };
      sessionRef.current = updated;
      stateRef.current = updated.state || {};
      setSession(updated);
      setState(updated.state || {});
    }, { sessionCode: session.sessionCode, playerId: viewerPlayerId });
    return unsub;
  }, [session?.id, session?.sessionCode, viewerPlayerId, connectionEpoch]);

  const updateState = useCallback(async (newState, { playerId } = {}) => {
    if (!sessionRef.current) return;
    const targetSessionId = sessionRef.current.id;
    const targetSessionCode = sessionRef.current.sessionCode;
    const previousState = stateRef.current;
    const merged = { ...previousState, ...newState };
    stateRef.current = merged;
    setState(merged);
    const payload = { statePatch: newState };
    if (playerId) {
      payload.sessionCode = targetSessionCode;
      payload.playerId = playerId;
    }
    // Αν υπάρχουν ήδη αλλαγές σε αναμονή, η νέα μπαίνει πίσω τους (ώστε να μείνει η σωστή σειρά).
    if (queueRef.current.length) {
      queueRef.current.push({ targetSessionId, payload });
      setPendingWrites(queueRef.current.length);
      flushQueue();
      return true;
    }
    try {
      const updated = await base44.entities.GameSession.update(targetSessionId, payload);
      applyServer(updated, targetSessionId);
    } catch (e) {
      if (isRetryableError(e)) {
        // Χωρίς σύνδεση: κρατάμε την αλλαγή στην οθόνη και τη στέλνουμε μόλις επανέλθει το δίκτυο.
        queueRef.current.push({ targetSessionId, payload });
        setPendingWrites(queueRef.current.length);
        retryTimerRef.current = retryTimerRef.current || setTimeout(() => { retryTimerRef.current = null; flushQueue(); }, 2000);
        console.warn('Update queued until the connection returns', e?.message);
        return true;
      }
      if (sessionRef.current?.id === targetSessionId) {
        stateRef.current = sessionRef.current?.state || previousState || {};
        setState(stateRef.current);
      }
      console.error('Failed to update state; local state was reverted', e);
      return false;
    }
  }, [applyServer, flushQueue]);

  const createSession = useCallback(async (sessionData) => {
    const operation = ++operationRef.current;
    const created = await base44.entities.GameSession.create(sessionData);
    if (operation !== operationRef.current) return created;
    sessionRef.current = created;
    stateRef.current = created.state || {};
    setSession(created);
    setState(created.state || {});
    return created;
  }, []);

  const deleteSession = useCallback(async () => {
    ++operationRef.current;
    const id = sessionRef.current?.id;
    if (id) await base44.entities.GameSession.delete(id);
    sessionRef.current = null;
    stateRef.current = null;
    setViewerPlayerId(null);
    setSession(null);
    setState(null);
  }, []);

  const refresh = useCallback(async () => {
    if (recoveryBusyRef.current) return;
    recoveryBusyRef.current = true;
    try {
      const operation = operationRef.current;
      const currentCode = sessionRef.current?.sessionCode;
      const currentId = sessionRef.current?.id;
      const query = currentCode ? { sessionCode: currentCode, ...(viewerRef.current ? { playerId: viewerRef.current } : {}) } : {};
      const { items } = await base44.entities.GameSession.filter(query, { sort: '-created_date', limit: 1 });
      if (operation !== operationRef.current || currentId !== sessionRef.current?.id) return;
      if (items && items.length > 0 && (!currentCode || items[0].sessionCode === currentCode)) {
        sessionRef.current = items[0];
        stateRef.current = items[0].state || {};
        setSession(items[0]);
        setState(items[0].state || {});
      }
    } catch (e) {
      console.error('Failed to refresh session after reconnect', e);
    } finally {
      recoveryBusyRef.current = false;
    }
  }, []);

  refreshRef.current = refresh;

  // Reconnect the live subscription and recover the latest server state after network return or app resume.
  useEffect(() => {
    const recover = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      setConnectionEpoch((value) => value + 1);
      refresh();
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') recover(); };
    window.addEventListener('online', recover);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('online', recover);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  const joinByCode = useCallback(async (code, playerId = null) => {
    const operation = ++operationRef.current;
    setLoading(true);
    setViewerPlayerId(playerId || null);
    try {
      const query = { sessionCode: code, ...(playerId ? { playerId } : {}) };
      const { items } = await base44.entities.GameSession.filter(query, { sort: '-created_date', limit: 1 });
      if (operation !== operationRef.current) return false;
      if (items && items.length > 0) {
        sessionRef.current = items[0];
        stateRef.current = items[0].state || {};
        setSession(items[0]);
        setState(items[0].state || {});
        return true;
      }
      sessionRef.current = null;
      stateRef.current = null;
      setSession(null);
      setState(null);
      return false;
    } catch (e) {
      if (operation === operationRef.current) console.error('Failed to join session', e);
      return false;
    } finally {
      if (operation === operationRef.current) setLoading(false);
    }
  }, []);

  return { session, state, loading, updateState, createSession, deleteSession, joinByCode, refresh };
}