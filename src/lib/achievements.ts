import { base44 } from '@/api/base44Client';
import { getAchievement, ACHIEVEMENTS_SETTING_KEY } from '@/data/achievements';

// awards = [{ achievementId, playerName }]
export async function awardAchievements(sessionCode, awards) {
  if (!sessionCode || !awards?.length) return;

  const unique = [];
  awards.forEach((a) => {
    if (!a?.playerName || !a?.achievementId) return;
    if (unique.some((u) => u.achievementId === a.achievementId && u.playerName === a.playerName)) return;
    unique.push(a);
  });

  let definitions = null;
  try {
    const settings = await base44.entities.AppSetting.filter({ key: ACHIEVEMENTS_SETTING_KEY }, { limit: 1 });
    definitions = settings.items?.[0]?.value?.items || null;
  } catch (_) { /* Keep the built-in definitions if settings are unavailable. */ }

  const existing = await base44.entities.Achievement.filter({ sessionCode }, { limit: 200 });
  const already = existing.items || [];

  const toCreate = unique
    .filter((a) => !already.some((e) => e.achievementId === a.achievementId && e.playerName === a.playerName))
    .map((a) => {
      const meta = definitions?.find((item) => item.id === a.achievementId) || getAchievement(a.achievementId);
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