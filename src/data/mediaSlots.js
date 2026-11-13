// Τα «σημεία» της εφαρμογής όπου μπορείς να βάλεις δικές σου φωτογραφίες/βίντεο (Admin → Φωτογραφίες & Βίντεο).
export const IMAGE_SLOTS = [
  { id: 'emblem', label: 'Έμβλημα', where: 'Λογότυπο στο Site, στην πρόσκληση και στο διαβατήριο' },
  { id: 'poster', label: 'Poster', where: 'Εξώφυλλο βίντεο στο Site και εικόνα στο Promo Heist' },
  { id: 'group', label: 'Παρέα', where: 'Promo Heist — «Το άγνωστο»' },
  { id: 'scene', label: 'Σκηνή', where: 'Promo Heist — «Την αποκάλυψη»' },
  { id: 'party1', label: 'Pajama — κεντρική', where: 'Promo Pajama — κύρια εικόνα' },
  { id: 'slipper', label: 'Παντόφλα', where: 'Pajama πρόσκληση και Promo Pajama' },
  { id: 'party2', label: 'Pajama — νύχτα', where: 'Promo Pajama — «Τη νύχτα»' },
  { id: 'vault', label: 'Vault', where: 'Promo Pajama και φόντο στο Pajama invite' },
  { id: 'banner', label: 'Banner Admin', where: 'Επάνω banner στο Dashboard του Admin' },
  { id: 'logo', label: 'Λογότυπο φόρμας', where: 'Φόρμα ερωτηματολογίου πρόσκλησης' },
  { id: 'invitationBg', label: 'Φόντο πρόσκλησης', where: 'Εικόνα πριν ξεκινήσει το βίντεο στο teaser πρόσκλησης' },
];

export const PHOTO_SPOTS = [
  { id: 'siteHero', label: 'Site — φόντο', where: 'Αρχική σελίδα, φόντο hero' },
  { id: 'siteTrailer', label: 'Site — τρέιλερ', where: 'Αρχική σελίδα, ενότητα τρέιλερ' },
  { id: 'tv', label: 'TV', where: 'Οθόνη TV' },
  { id: 'promo', label: 'Promo', where: 'Promo, hero' },
  { id: 'invitation', label: 'Πρόσκληση', where: 'Teaser πρόσκλησης' },
  { id: 'pajama', label: 'Pajama πρόσκληση', where: 'Φόντο στο Pajama invite' },
];
export const PHOTO_SPOT_IDS = PHOTO_SPOTS.map((v) => v.id);

export const GALLERIES = [
  { id: 'heistPhotos', label: 'Heist — γκαλερί', where: 'Site (Gallery) και teaser πρόσκλησης' },
  { id: 'pajamaPhotos', label: 'Pajama — γκαλερί', where: 'Site (Gallery) και Pajama πρόσκληση' },
  { id: 'siteVideos', kind: 'video', label: 'Site — επιπλέον βίντεο', where: 'Αρχική σελίδα, κάτω από το τρέιλερ (όσα θες)' },
];

export const MODE_COVER_SLOTS = [
  { id: 'modeCover_classic', modeId: 'classic', label: 'Κλασικό' },
  { id: 'modeCover_marathon', modeId: 'marathon', label: 'Mega Marathon' },
  { id: 'modeCover_arrest_heist', modeId: 'arrest_heist', label: 'Arrest & Heist' },
  { id: 'modeCover_pajama', modeId: 'pajama', label: 'Pajama Mode' },
  { id: 'modeCover_pedi_extended', modeId: 'pedi_extended', label: 'Pedi-Glam Extended' },
  { id: 'modeCover_lockdown', modeId: 'lockdown', label: 'Pajama Lockdown' },
  { id: 'modeCover_beach_bar', modeId: 'beach_bar', label: 'Beach Bar Lockdown' },
  { id: 'modeCover_marathon_4h', modeId: 'marathon_4h', label: '5H Pajama Marathon' },
];
