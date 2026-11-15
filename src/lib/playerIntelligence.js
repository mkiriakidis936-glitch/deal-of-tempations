// Presenter-side VIP consent and boundary gate. Private answers are never copied into GameSession.
export function canAssignVipActivity(ctx, player, { activityType = null, activityLabel = 'δοκιμασία' } = {}) {
  if (!player?.id) return false;
  const answers = ctx.playerProfiles?.find((profile) => profile.playerId === player.id)?.vipProfile?.answers;
  if (!answers) return true;

  if (answers.activeParticipation === 'no') {
    window.alert(`${player.name} έχει δηλώσει ότι δεν επιθυμεί ενεργή συμμετοχή.`);
    return false;
  }

  if (activityType && answers.activityPreferences?.[activityType] === 'no') {
    window.alert(`${player.name} δεν έχει επιλέξει συμμετοχή σε ${activityLabel}.`);
    return false;
  }

  const boundaries = String(answers.boundaries || '').trim();
  if (boundaries && !window.confirm(
    `ΠΡΟΣΩΠΙΚΑ ΟΡΙΑ · ${player.name}\n\n${boundaries}\n\nΈλεγξε ότι η συγκεκριμένη ${activityLabel} δεν παραβιάζει τα όρια. Να συνεχίσεις;`
  )) return false;

  return true;
}
