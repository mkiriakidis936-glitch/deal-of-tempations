const normalizeName = (value) => String(value || '').trim().toLocaleLowerCase('el-GR');

export function getVipAnswers(ctx, player) {
  const playerId = player?.id || player?.playerId;
  const name = normalizeName(player?.name);
  const profile = (ctx?.playerProfiles || []).find((item) =>
    (playerId && item.playerId === playerId) ||
    (name && normalizeName(item.name) === name)
  );
  return profile?.vipProfile?.answers || profile?.answers || null;
}

export function isVipActivityAllowed(ctx, player, activityType = null) {
  if (ctx?.playerProfilesReady === false) return false;
  const answers = getVipAnswers(ctx, player);
  if (!answers) return true;
  if (answers.activeParticipation === 'no') return false;
  if (activityType && answers.activityPreferences?.[activityType] === 'no') return false;
  if (activityType === 'surprises' && answers.unexpectedChallenge === 'no') return false;
  return true;
}

// Presenter-side consent and boundary check. Private answers stay outside shared GameSession state.
export function canAssignVipActivity(ctx, player, { activityType = null, activityLabel = 'δοκιμασία' } = {}) {
  if (!player) return false;
  if (ctx?.playerProfilesReady === false) {
    window.alert('Η φόρτωση των ιδιωτικών προτιμήσεων δεν ολοκληρώθηκε ακόμη. Δοκίμασε ξανά σε λίγο.');
    return false;
  }
  const answers = getVipAnswers(ctx, player);
  if (!answers) return true;
  if (answers.activeParticipation === 'no') {
    window.alert(`${player.name} έχει δηλώσει ότι δεν επιθυμεί ενεργή συμμετοχή.`);
    return false;
  }
  if (activityType && answers.activityPreferences?.[activityType] === 'no') {
    window.alert(`${player.name} δεν έχει επιλέξει συμμετοχή σε ${activityLabel}.`);
    return false;
  }
  if (activityType === 'surprises' && answers.unexpectedChallenge === 'no') {
    window.alert(`${player.name} δεν έχει επιλέξει απρόβλεπτες εκπλήξεις.`);
    return false;
  }
  const boundaries = String(answers.boundaries || '').trim();
  if (boundaries && !window.confirm(
    `ΠΡΟΣΩΠΙΚΑ ΟΡΙΑ · ${player.name}\n\n${boundaries}\n\nΈλεγξε ότι η συγκεκριμένη ${activityLabel} δεν παραβιάζει τα όρια. Να συνεχίσεις;`
  )) return false;
  return true;
}
