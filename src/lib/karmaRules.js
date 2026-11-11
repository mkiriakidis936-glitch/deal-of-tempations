// ΚΑΝΟΝΕΣ KARMA — single source of truth για όλα τα karma mini-games.

export const KARMA_MAX = 25; // ταβάνι karma
export const KARMA_FAUCET = 3; // χάρισμα όταν μια παίκτρια μένει στα 0
export const KARMA_BETS = [1, 2, 3, 5];

export function clampKarma(value) {
  return Math.max(0, Math.min(KARMA_MAX, Math.round(value || 0)));
}

export function betOptions(karma) {
  const current = karma || 0;
  return KARMA_BETS.map((amount) => ({
    amount,
    label: `${amount} Karma`,
    enabled: current >= amount,
  }));
}

export function isBroke(karma) {
  return (karma || 0) < KARMA_BETS[0];
}