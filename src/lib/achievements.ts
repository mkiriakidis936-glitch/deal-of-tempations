import { base44 } from '@/api/base44Client';
import { getAchievement } from '@/data/achievements';

// awards = [{ achievementId, playerName }]
export async function awardAchievements(sessionCode, awards) {
  if (!sessionCode || !awards?.length) return;

  const unique = [];
  awards.forEach((a) => {
    if (!a?.playerName || !a?.achievementId) return;
    if (unique.some((u) => u.achievementId === a.achievementId && u.playerName === a.playerName)) return;
    unique.push(a);
  });

  const existing = await base44.entities.Achievement.filter({ sessionCode }, { limit: 200 });
  const already = existing.items || [];

  const toCreate = unique
    .filter((a) => !already.some((e) => e.achievementId === a.achievementId && e.playerName === a.playerName))
    .map((a) => {
      const meta = getAchievement(a.achievementId);
      return {
        achievementId: a.achievementId,
        achievementName: meta?.name || a.achievementId,
        icon: meta?.icon || '🏅',
        playerName: a.playerName,
        sessionCode,
      };
    });

  if (toCreate.length) await base44.entities.Achievement.bulkCreate(toCreate);
}