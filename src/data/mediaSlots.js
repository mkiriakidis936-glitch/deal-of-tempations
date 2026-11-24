// Τα σημεία της εφαρμογής όπου αντιστοιχίζονται φωτογραφίες και βίντεο.
export const SURFACES = [
  { id: 'site', label: 'SITE', description: 'Ιστοσελίδα και δημόσια προωθητική προβολή' },
  { id: 'forms', label: 'FORMS', description: 'Προσκλήσεις και φόρμες συμμετοχής' },
  { id: 'tablet', label: 'TABLET', description: 'Κεντρική οθόνη και επιλογή Mode' },
  { id: 'tv', label: 'TV', description: 'Οθόνη τηλεόρασης και βίντεο έναρξης' },
  { id: 'mobile', label: 'MOBILE', description: 'Εμπειρία παικτών στο /play' },
];

export const IMAGE_SLOTS = [
  { id: 'emblem', label: 'Έμβλημα', where: '01_emblem.jpg — λογότυπο στο Site, στην πρόσκληση και στο διαβατήριο', surfaces: ['site', 'forms', 'mobile'] },
  { id: 'poster', label: 'Poster', where: '02_poster.jpg — εξώφυλλο βίντεο Site, Promo Heist και Cover Classic', surfaces: ['site'] },
  { id: 'heistNight', label: 'Heist Night — εικόνα', where: 'heistNight.jpg — κάρτα και Hero Heist Night στο Site', surfaces: ['site'] },
  { id: 'group', label: 'Παρέα', where: '03_group.jpg — Promo Heist «Το άγνωστο»', surfaces: ['site'] },
  { id: 'scene', label: 'Σκηνή', where: '04_scene.jpg — Promo Heist «Την αποκάλυψη»', surfaces: ['site'] },
  { id: 'party1', label: 'Pajama — κεντρική', where: '05_party1.jpg — κύρια εικόνα Promo Pajama και Cover Pajama', surfaces: ['site', 'forms'] },
  { id: 'slipper', label: 'Παντόφλα', where: '06_slipper.jpg — παντόφλα στην πρόσκληση και στο Promo Pajama', surfaces: ['site', 'forms'] },
  { id: 'party2', label: 'Pajama — νύχτα', where: '07_party2.jpg — Promo Pajama «Τη νύχτα»', surfaces: ['site'] },
  { id: 'vault', label: 'Vault', where: '08_vault.jpg — Promo Pajama και Vault', surfaces: ['site', 'forms'] },
  { id: 'banner', label: 'Banner Admin', where: '09_banner.jpg — επάνω banner στο Dashboard του Admin', surfaces: ['tablet'] },
  { id: 'logo', label: 'Λογότυπο φόρμας', where: '10_logo.jpg — δεν χρησιμοποιείται πια', surfaces: ['forms'], retired: true },
  { id: 'invitationBg', label: 'Φόντο φορμών', where: 'Διακριτικό φόντο πίσω από όλες τις φόρμες και τη VIP πρόσκληση', surfaces: ['forms'] },
  { id: 'photoHeistNight', label: 'Heist gallery — προεπιλεγμένη εικόνα', where: 'extra_heistNight.jpg — προεπιλεγμένη εικόνα Heist gallery', surfaces: ['site', 'forms'] },
  { id: 'photoGame', label: 'Pajama gallery — προεπιλεγμένη εικόνα παιχνιδιού', where: 'extra_game.jpg — προεπιλεγμένη εικόνα Pajama gallery', surfaces: ['site', 'forms'] },
  { id: 'photoSlippers', label: 'Pajama gallery — προεπιλεγμένη εικόνα παντόφλας', where: 'extra_slippers.jpg — προεπιλεγμένη εικόνα Pajama gallery', surfaces: ['site', 'forms'] },
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
  { id: 'promo', label: 'Promo', where: 'Promo, hero', surfaces: ['site'] },
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
  { id: 'modeCover_beach_bar', modeId: 'beach_bar', label: 'BEACH BAR HOME LOCKDOWN', filename: 'cover.jpg', surfaces: ['tablet', 'forms'] },
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
