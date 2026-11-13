// DEAL OF TEMPTATION - Achievements / Badges
export const ACHIEVEMENTS = [
  { id: 'pedi_glam_queen', conditionId: 'pajama_top_score', enabled: true, name: 'Βασίλισσα του Pedi-Glam', icon: '👑', desc: 'Πρώτη θέση σε παρτίδα Pajama Pedi-Glam.' },
  { id: 'saboteur_ghost', conditionId: 'pajama_saboteur', enabled: true, name: 'Φάντασμα του Saboteur', icon: '😈', desc: 'Ήταν ο Secret Saboteur της βραδιάς.' },
  { id: 'most_wanted', conditionId: 'classic_highest_bounty', enabled: true, name: 'Πιο Καταζητούμενη', icon: '⭐', desc: 'Το μεγαλύτερο bounty σε Κλασική παρτίδα.' },
  { id: 'crew_legend', conditionId: 'winning_team', enabled: true, name: 'Θρύλος της Συμμορίας', icon: '🏆', desc: 'Μέλος νικήτριας ομάδας σε Marathon ή Arrest & Heist.' },
];

export const ACHIEVEMENTS_SETTING_KEY = 'achievement_definitions';

export function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}