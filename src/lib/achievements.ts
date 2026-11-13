import { base44 } from '@/api/base44Client';
import { ACHIEVEMENTS, getAchievement, ACHIEVEMENTS_SETTING_KEY } from '@/data/achievements';

// awards = [{ achievementId, playerName }]
export async function awardAchievements(sessionCode, awards) {
  if (!sessionCode || !awards?.length) return;

  let configured = ACHIEVEMENTS;
  try {
    const settings = await base44.entities.AppSetting.filter({ key: ACHIEVEMENTS_SETTING_KEY }, { limit: 1 });
    const saved = settings.items?.[0]?.value?.items;
    if (Array.isArray(saved)) configured = ACHIEVEMENTS.map((base) => ({
      ...base,
      ...(saved.find((item) => item.id === base.id) || {}),
    }));
  } catch (_) { /* Keep the built-in definitions if settings are unavailable. */ }

  const unique = [];
  awards.forEach((award) => {
    if (!award?.playerName) return;
    const matching = award.conditionId
      ? configured.filter((item) => item.conditionId === award.conditionId && item.enabled !== false)
      : configured.filter((item) => item.id === award.achievementId && item.enabled !== false);
    matching.forEach((meta) => {
      if (unique.some((item) => item.achievementId === meta.id && item.playerName === award.playerName)) return;
      unique.push({ achievementId: meta.id, playerName: award.playerName, meta });
    });
  });

  const existing = await base44.entities.Achievement.filter({ sessionCode }, { limit: 200 });
  const already = existing.items || [];

  const toCreate = unique
    .filter((a) => !already.some((e) => e.achievementId === a.achievementId && e.playerName === a.playerName))
    .map((a) => {
      const meta = a.meta || getAchievement(a.achievementId);
      return {
        achievementId: a.achievementId,
        achievementName: meta?.name || a.achievementId,
        icon: meta?.icon || '🏅',
        reward: meta?.reward || '',
        playerName: a.playerName,
        sessionCode,
      };
    });

  if (toCreate.length) await base44.entities.Achievement.bulkCreate(toCreate);
}