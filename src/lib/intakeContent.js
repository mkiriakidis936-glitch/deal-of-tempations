// Turns the intake secrets into personalised truth questions
export function buildSecretTruths(intake) {
  if (!intake?.secrets) return [];
  return intake.secrets
    .split(/\n|(?<=[.!;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5)
    .map((s) => `🤫 ΠΡΟΣΩΠΙΚΟ ΜΥΣΤΙΚΟ: «${s}» — Πες ΟΛΗ την ιστορία πίσω από αυτό το μυστικό, με λεπτομέρειες!`);
}