import { appApi } from '@/api/apiClient';
import { fetchSiteRecord, SITE_KEY } from '@/lib/media';
import { SITE_HOME_ID } from '@/data/siteContent';
import { SITE_MODE_IDS } from '@/components/site/SiteV2';

// Ημερολόγιο που μετράει μόνο του: «κλεισμένες θέσεις» = εγκεκριμένες αιτήσεις με την ίδια βραδιά (calendarDate).
const SOURCES = ['PlayerIntake', 'PajamaIntake', 'VIPInvitationSubmission'];

export const modesOfApplication = (item) => {
  if (Array.isArray(item.preferredModes) && item.preferredModes.length) return item.preferredModes;
  return [item.vipGameMode || item.gameMode].filter(Boolean);
};

// Οι βραδιές του ημερολογίου που ταιριάζουν με τα modes μιας αίτησης.
export function calendarOptionsFor(calendar = [], item) {
  const modes = modesOfApplication(item);
  return (calendar || []).filter((entry) => entry?.date && (!modes.length || modes.includes(SITE_MODE_IDS[entry.event])));
}

export async function loadCalendar() {
  const rec = await fetchSiteRecord();
  return rec?.value?.[SITE_HOME_ID]?.calendar || [];
}

// Ξαναμετρά τις κλεισμένες θέσεις κάθε βραδιάς και τις αποθηκεύει στο site.
export async function syncCalendarBookings() {
  const rec = await fetchSiteRecord();
  const home = rec?.value?.[SITE_HOME_ID];
  if (!rec?.id || !Array.isArray(home?.calendar) || !home.calendar.length) return 0;
  const lists = await Promise.all(SOURCES.map((entity) => appApi.entities[entity].filter({}, { limit: 1000 }).then((r) => r.items || []).catch(() => [])));
  const approved = lists.flat().filter((item) => item.approved === true && item.calendarDate);
  const seen = new Set();
  const counts = {};
  approved.forEach((item) => {
    const key = `${item.calendarDate}|${String(item.name || item.displayName || '').trim().toLowerCase()}`;
    if (seen.has(key)) return; // ίδια παίκτρια από δύο φόρμες = μία θέση
    seen.add(key);
    counts[item.calendarDate] = (counts[item.calendarDate] || 0) + 1;
  });
  const calendar = home.calendar.map((entry) => ({ ...entry, booked: counts[entry.date] || 0 }));
  await appApi.entities.AppSetting.update(rec.id, { value: { ...rec.value, [SITE_HOME_ID]: { ...home, calendar } } });
  return approved.length;
}

export { SITE_KEY };
