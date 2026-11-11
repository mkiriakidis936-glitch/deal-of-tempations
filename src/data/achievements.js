// DEAL OF TEMPTATION - Achievements / Badges
export const ACHIEVEMENTS = [
  { id: 'pedi_glam_queen', name: 'Βασίλισσα του Pedi-Glam', icon: '👑', desc: 'Πρώτη θέση σε παρτίδα Pajama Pedi-Glam.' },
  { id: 'saboteur_ghost', name: 'Φάντασμα του Saboteur', icon: '😈', desc: 'Ήταν ο Secret Saboteur της βραδιάς.' },
  { id: 'most_wanted', name: 'Πιο Καταζητούμενη', icon: '⭐', desc: 'Το μεγαλύτερο bounty σε Κλασική παρτίδα.' },
  { id: 'crew_legend', name: 'Θρύλος της Συμμορίας', icon: '🏆', desc: 'Μέλος νικήτριας ομάδας σε Marathon ή Arrest & Heist.' },
];

export function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}