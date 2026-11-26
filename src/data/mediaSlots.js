// Τα σημεία της εφαρμογής όπου αντιστοιχίζονται φωτογραφίες και βίντεο.
export const SURFACES = [
  { id: 'site', label: 'SITE', description: 'Ιστοσελίδα και δημόσια προωθητική προβολή' },
  { id: 'forms', label: 'FORMS', description: 'Προσκλήσεις και φόρμες συμμετοχής' },
  { id: 'tablet', label: 'TABLET', description: 'Κεντρική οθόνη και επιλογή Mode' },
  { id: 'tv', label: 'TV', description: 'Οθόνη τηλεόρασης και βίντεο έναρξης' },
  { id: 'mobile', label: 'MOBILE', description: 'Εμπειρία παικτών στο /play' },
  { id: 'promo', label: 'PROMO', description: 'Σελίδα /promo' },
];

export const IMAGE_SLOTS = [
  { id: 'emblem', label: 'Έμβλημα', where: 'Λογότυπο: πάνω μπάρα Site, κεφαλίδα φορμών, σελίδα αναμνήσεων', surfaces: ['site', 'forms', 'memories'] },
  { id: 'poster', label: 'Poster', where: 'Εφεδρική εικόνα όταν ένα mode δεν έχει δική του (Site, φόρμες, Promo)', surfaces: ['site', 'forms', 'promo'] },
  { id: 'heistNight', label: 'Heist Night — εικόνα', where: 'Εφεδρική εικόνα του Heist Night στο Site', surfaces: ['site'] },
  { id: 'group', label: 'Παρέα', where: 'Φόντο της τελευταίας ενότητας του Site', surfaces: ['site'] },
  { id: 'scene', label: 'Σκηνή', where: 'δεν χρησιμοποιείται πια', surfaces: ['site'], retired: true },
  { id: 'party1', label: 'Pajama — κεντρική', where: 'δεν χρησιμοποιείται πια', surfaces: ['site'], retired: true },
  { id: 'slipper', label: 'Παντόφλα', where: 'δεν χρησιμοποιείται πια', surfaces: ['site'], retired: true },
  { id: 'party2', label: 'Pajama — νύχτα', where: 'δεν χρησιμοποιείται πια', surfaces: ['site'], retired: true },
  { id: 'vault', label: 'Vault', where: 'δεν χρησιμοποιείται πια', surfaces: ['site'], retired: true },
  { id: 'banner', label: 'Banner Admin', where: 'Banner στο Admin → Στατιστικά', surfaces: ['admin'] },
  { id: 'logo', label: 'Λογότυπο φόρμας', where: '10_logo.jpg — δεν χρησιμοποιείται πια', surfaces: ['forms'], retired: true },
  { id: 'invitationBg', label: 'Φόντο φορμών', where: 'Διακριτικό φόντο πίσω από όλες τις φόρμες και τη VIP πρόσκληση', surfaces: ['forms'] },
  { id: 'photoHeistNight', label: 'Heist gallery — προεπιλεγμένη εικόνα', where: 'Πρώτη εικόνα της γκαλερί Heist στο Site', surfaces: ['site'] },
  { id: 'photoGame', label: 'Pajama gallery — προεπιλεγμένη εικόνα παιχνιδιού', where: 'Εικόνα της γκαλερί Pajama στο Site', surfaces: ['site'] },
  { id: 'photoSlippers', label: 'Pajama gallery — προεπιλεγμένη εικόνα παντόφλας', where: 'Εικόνα της γκαλερί Pajama στο Site', surfaces: ['site'] },
  { id: 'extraHeistRoom', label: 'Κεφαλίδα φόρμας Arrest & Heist', where: 'Πάνω μέρος της φόρμας Arrest & Heist (αλλιώς η κεντρική εικόνα του mode)', surfaces: ['forms'] },
  { id: 'extraPediGlam', label: 'Κεφαλίδα φόρμας Pajama Pedi-Glam', where: 'αποσύρθηκε', surfaces: ['forms'], retired: true },
  { id: 'wallpaperPhone', label: 'Wallpaper κινητού 9:16', where: 'wallpaper_phone_9x16.jpg — φόντο κινητού', surfaces: ['mobile'] },
  { id: 'wallpaperTablet', label: 'Wallpaper tablet 4:3', where: 'wallpaper_tablet_4x3.jpg — φόντο tablet', surfaces: ['tablet'] },
  { id: 'wallpaperTv', label: 'Wallpaper TV 16:9', where: 'wallpaper_tv_16x9.jpg — φόντο TV', surfaces: ['tv'] },
  { id: 'patternSeamless', label: 'Seamless pattern', where: 'pattern_seamless.jpg — επαναλαμβανόμενο μοτίβο', surfaces: ['site'], retired: true },
];

export const PHOTO_SPOTS = [
  { id: 'siteHero', label: 'Site — κεντρικό φόντο', where: '12_siteHero.jpg — φόντο αρχικής σελίδας', surfaces: ['site'] },
  { id: 'siteTrailer', label: 'Site — τρέιλερ', where: 'Αρχική σελίδα, ενότητα τρέιλερ', surfaces: ['site'] },
  { id: 'tv', label: 'TV — οθόνη αναμονής', where: '13_tv.jpg — εικόνα οθόνης αναμονής TV', surfaces: ['tv'] },
  { id: 'promo', label: 'Promo — κεντρική', where: 'Μεγάλη εικόνα (ή βίντεο) στην κορυφή του /promo', surfaces: ['promo'] },
  { id: 'invitation', label: 'Εικόνα VIP πρόσκλησης', where: 'Κεφαλίδα της VIP πρόσκλησης και του teaser', surfaces: ['forms'] },
  { id: 'pajama', label: 'Pajama invitation — φόντο', where: '16_pajama.jpg — φόντο Pajama πρόσκλησης', surfaces: ['forms'], retired: true },
];
export const PHOTO_SPOT_IDS = PHOTO_SPOTS.map((v) => v.id);

export const GALLERIES = [
  { id: 'heistPhotos', label: 'Heist — γκαλερί', where: 'Site: γκαλερί της Αρχικής και του Heist Night (όταν το Arrest Heist δεν έχει δική του)', requiredCount: 0, surfaces: ['site', 'forms'] },
  { id: 'pajamaPhotos', label: 'Pajama — γκαλερί', where: 'Site: γκαλερί της Αρχικής και των Pajama Lockdown, Pajama Heist & Arrest, Villa Takeover (όταν δεν έχουν δική τους)', requiredCount: 0, surfaces: ['site'] },
  { id: 'siteVideos', kind: 'video', label: 'Επιπλέον βίντεο', where: 'Όσα θες. Σε κάθε βίντεο διαλέγεις πού εμφανίζεται: Αρχική Site ή σελίδα συγκεκριμένου mode (Site + Tablet Setup).', surfaces: ['site', 'tablet'] },
];

export const MODE_COVER_SLOTS = [
  { id: 'modeCover_classic', modeId: 'classic', label: 'Κλασικό', filename: 'modeCover_classic.jpg', surfaces: ['tablet', 'forms'] },
  { id: 'modeCover_marathon', modeId: 'marathon', label: 'Mega Marathon', filename: 'modeCover_marathon.jpg', surfaces: ['tablet', 'forms'], retired: true },
  { id: 'modeCover_arrest_heist', modeId: 'arrest_heist', label: 'Arrest & Heist', filename: 'modeCover_arrest_heist.jpg', surfaces: ['tablet', 'forms'] },
  { id: 'modeCover_pajama', modeId: 'pajama', label: 'Pajama Mode', filename: 'modeCover_pajama.jpg', surfaces: ['tablet', 'forms'], retired: true },
  { id: 'modeCover_pedi_extended', modeId: 'pedi_extended', label: 'Pedi-Glam Extended', filename: '', surfaces: ['tablet', 'forms'], retired: true },
  { id: 'modeCover_lockdown', modeId: 'lockdown', label: 'PAJAMA LOCKDOWN 18+', filename: 'cover.jpg', surfaces: ['tablet', 'forms'] },
  { id: 'modeCover_pedi_glam', modeId: 'pedi_glam', label: 'Pajama Pedi-Glam 90′', filename: '', surfaces: ['tablet', 'forms'], retired: true },
  { id: 'modeCover_marathon_4h', modeId: 'marathon_4h', label: 'Pajama Heist & Arrest', filename: '', surfaces: ['tablet', 'forms'] },
  { id: 'modeCover_villa_takeover', modeId: 'villa_takeover', label: 'Villa Takeover 48/72', filename: '', surfaces: ['tablet', 'forms'] },
];

// Τα βίντεο έναρξης της τηλεόρασης.
export const VIDEO_SLOTS = [
  { id: 'gameIntroVideo', label: 'INTRO ΠΑΙΧΝΙΔΙΟΥ (όλα τα modes)', where: 'TV — στην αρχή κάθε νέας παρτίδας, πριν από τους κανόνες, όταν το mode δεν έχει δικό του intro (MODE MEDIA CENTER)', surfaces: ['tv'] },
  { id: 'welcomeVideo', label: 'WELCOME VIDEO', where: 'TV — όταν συνδέεται σε ενεργή συνεδρία', surfaces: ['tv'] },
  { id: 'countdownVideo', label: 'COUNTDOWN VIDEO', where: 'TV — αμέσως μετά την εντολή Έναρξη Παιχνιδιού', surfaces: ['tv'] },
];
