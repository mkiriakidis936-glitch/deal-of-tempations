import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export function useGameSession({ autoLoad = true } = {}) {
  const [session, setSession] = useState(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerPlayerId, setViewerPlayerId] = useState(null);
  const stateRef = useRef(null);
  const sessionRef = useRef(null);
  const [connectionEpoch, setConnectionEpoch] = useState(0);
  const recoveryBusyRef = useRef(false);

  useEffect(() => {
    if (!autoLoad) { setLoading(false); return; }
    (async () => {
      try {
        const { items } = await base44.entities.GameSession.filter({}, { sort: '-created_date', limit: 1 });
        if (items && items.length > 0) {
          sessionRef.current = items[0];
          stateRef.current = items[0].state || {};
          setSession(items[0]);
          setState(items[0].state || {});
        }
      } catch (e) {
        console.error('Failed to load session', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [autoLoad]);

  useEffect(() => {
    if (!session) return;
    const unsub = base44.entities.GameSession.subscribe((event) => {
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
    const merged = { ...stateRef.current, ...newState };
    stateRef.current = merged;
    setState(merged);
    const payload = { statePatch: newState };
    if (playerId) {
      payload.sessionCode = sessionRef.current.sessionCode;
      payload.playerId = playerId;
    }
    try {
      const updated = await base44.entities.GameSession.update(sessionRef.current.id, payload);
      if (updated?.state) {
        sessionRef.current = updated;
        stateRef.current = updated.state;
        setSession(updated);
        setState(updated.state);
      }
    } catch (e) {
      console.error('Failed to update state', e);
    }
  }, []);

  const createSession = useCallback(async (sessionData) => {
    const created = await base44.entities.GameSession.create(sessionData);
    sessionRef.current = created;
    stateRef.current = created.state || {};
    setSession(created);
    setState(created.state || {});
    return created;
  }, []);

  const deleteSession = useCallback(async () => {
    const id = sessionRef.current?.id;
    sessionRef.current = null;
    stateRef.current = null;
    setViewerPlayerId(null);
    setSession(null);
    setState(null);
    if (!id) return;
    try {
      await base44.entities.GameSession.delete(id);
    } catch (e) {
      console.warn('Session already removed', e?.message || e);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (recoveryBusyRef.current) return;
    recoveryBusyRef.current = true;
    try {
      const currentCode = sessionRef.current?.sessionCode;
      const query = currentCode ? { sessionCode: currentCode } : {};
      const { items } = await base44.entities.GameSession.filter(query, { sort: '-created_date', limit: 1 });
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
    setLoading(true);
    setViewerPlayerId(playerId || null);
    try {
      const query = { sessionCode: code, ...(playerId ? { playerId } : {}) };
      const { items } = await base44.entities.GameSession.filter(query, { sort: '-created_date', limit: 1 });
      if (items && items.length > 0) {
        sessionRef.current = items[0];
        stateRef.current = items[0].state || {};
        setSession(items[0]);
        setState(items[0].state || {});
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to join session', e);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { session, state, loading, updateState, createSession, deleteSession, joinByCode, refresh };
}