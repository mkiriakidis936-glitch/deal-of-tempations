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
  const operationRef = useRef(0);

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
    try {
      const updated = await base44.entities.GameSession.update(targetSessionId, payload);
      if (updated?.state && sessionRef.current?.id === targetSessionId) {
        sessionRef.current = updated;
        stateRef.current = updated.state;
        setSession(updated);
        setState(updated.state);
      }
    } catch (e) {
      if (sessionRef.current?.id === targetSessionId) {
        stateRef.current = sessionRef.current?.state || previousState || {};
        setState(stateRef.current);
      }
      console.error('Failed to update state; local state was reverted', e);
      return false;
    }
  }, []);

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
      const query = currentCode ? { sessionCode: currentCode } : {};
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