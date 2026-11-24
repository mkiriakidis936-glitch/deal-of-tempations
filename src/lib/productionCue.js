import { appApi } from '@/api/apiClient';

const commandId = () => globalThis.crypto?.randomUUID?.() || `cue-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export async function getProductionCue(sessionCode) {
  if (!sessionCode) return null;
  const { items = [] } = await appApi.entities.ProductionCue.filter({ sessionCode }, { limit: 1 });
  return items[0] || null;
}

export async function publishProductionCue(sessionCode, data) {
  if (!sessionCode) throw new Error('Δεν έχει επιλεγεί Event.');
  const existing = await getProductionCue(sessionCode);
  const cue = {
    sessionCode,
    active: true,
    queue: [],
    queueIndex: -1,
    ...data,
    playbackCommand: 'play',
    commandId: commandId(),
    commandAt: Date.now(),
    playbackStatus: 'pending',
    playbackError: '',
    activatedAt: new Date().toISOString(),
  };
  return existing?.id
    ? appApi.entities.ProductionCue.update(existing.id, cue)
    : appApi.entities.ProductionCue.create(cue);
}

export async function commandProductionCue(sessionCode, playbackCommand, volume) {
  const existing = await getProductionCue(sessionCode);
  if (!existing?.id || !existing.active) throw new Error('Δεν υπάρχει ενεργό Media στην TV.');
  return appApi.entities.ProductionCue.update(existing.id, {
    playbackCommand,
    ...(Number.isFinite(volume) ? { volume } : {}),
    commandId: commandId(),
    commandAt: Date.now(),
    playbackStatus: 'pending',
    playbackError: '',
  });
}

export async function stopProductionCue(sessionCode) {
  const existing = await getProductionCue(sessionCode);
  if (!existing?.id) return null;
  return appApi.entities.ProductionCue.update(existing.id, {
    active: true,
    playbackCommand: 'close',
    commandId: commandId(),
    commandAt: Date.now(),
    playbackStatus: 'closing',
  });
}
