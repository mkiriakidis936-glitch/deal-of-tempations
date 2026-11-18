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
  { id: 'logo', label: 'Λογότυπο φόρμας', where: '10_logo.jpg — λογότυπο φόρμας ερωτηματολογίου πρόσκλησης', surfaces: ['forms'] },
  { id: 'invitationBg', label: 'Φόντο φόρμας πρόσκλησης', where: '11_invitationBg.jpg — φόντο της φόρμας πρόσκλησης', surfaces: ['forms'] },
  { id: 'photoHeistNight', label: 'Heist gallery — προεπιλεγμένη εικόνα', where: 'extra_heistNight.jpg — προεπιλεγμένη εικόνα Heist gallery', surfaces: ['site', 'forms'] },
  { id: 'photoGame', label: 'Pajama gallery — προεπιλεγμένη εικόνα παιχνιδιού', where: 'extra_game.jpg — προεπιλεγμένη εικόνα Pajama gallery', surfaces: ['site', 'forms'] },
  { id: 'photoSlippers', label: 'Pajama gallery — προεπιλεγμένη εικόνα παντόφλας', where: 'extra_slippers.jpg — προεπιλεγμένη εικόνα Pajama gallery', surfaces: ['site', 'forms'] },
  { id: 'extraHeistRoom', label: 'Κεφαλίδα φόρμας Arrest & Heist', where: 'extra_heistRoom.jpg — κεφαλίδα φόρμας Arrest & Heist', surfaces: ['forms'] },
  { id: 'extraPediGlam', label: 'Κεφαλίδα φόρμας Pajama Pedi-Glam', where: 'extra_pediGlam.jpg — κεφαλίδα φόρμας Pajama Pedi-Glam', surfaces: ['forms'] },
  { id: 'wallpaperPhone', label: 'Wallpaper κινητού 9:16', where: 'wallpaper_phone_9x16.jpg — φόντο κινητού', surfaces: ['mobile'] },
  { id: 'wallpaperTablet', label: 'Wallpaper tablet 4:3', where: 'wallpaper_tablet_4x3.jpg — φόντο tablet', surfaces: ['tablet'] },
  { id: 'wallpaperTv', label: 'Wallpaper TV 16:9', where: 'wallpaper_tv_16x9.jpg — φόντο TV', surfaces: ['tv'] },
  { id: 'patternSeamless', label: 'Seamless pattern', where: 'pattern_seamless.jpg — επαναλαμβανόμενο μοτίβο', surfaces: ['site'] },
];

export const PHOTO_SPOTS = [
  { id: 'siteHero', label: 'Site — κεντρικό φόντο', where: '12_siteHero.jpg — φόντο αρχικής σελίδας', surfaces: ['site'] },
  { id: 'siteTrailer', label: 'Site — τρέιλερ', where: 'Αρχική σελίδα, ενότητα τρέιλερ', surfaces: ['site'] },
  { id: 'tv', label: 'TV — οθόνη αναμονής', where: '13_tv.jpg — εικόνα οθόνης αναμονής TV', surfaces: ['tv'] },
  { id: 'promo', label: 'Promo', where: 'Promo, hero', surfaces: ['site'] },
  { id: 'invitation', label: 'Εικόνα teaser πρόσκλησης', where: '15_invitation.jpg — εικόνα teaser πρόσκλησης', surfaces: ['forms'] },
  { id: 'pajama', label: 'Pajama invitation — φόντο', where: '16_pajama.jpg — φόντο Pajama πρόσκλησης', surfaces: ['forms'] },
];
export const PHOTO_SPOT_IDS = PHOTO_SPOTS.map((v) => v.id);

export const GALLERIES = [
  { id: 'heistPhotos', label: 'Heist — γκαλερί', where: '12 αριθμημένες εικόνες: heist_01 έως heist_12', requiredCount: 12, surfaces: ['site', 'forms'] },
  { id: 'pajamaPhotos', label: 'Pajama — γκαλερί', where: '12 αριθμημένες εικόνες: pajama_01 έως pajama_12', requiredCount: 12, surfaces: ['site', 'forms'] },
  { id: 'siteVideos', kind: 'video', label: 'Site — επιπλέον βίντεο', where: 'Αρχική σελίδα, κάτω από το τρέιλερ (όσα θες)', surfaces: ['site'] },
];

export const MODE_COVER_SLOTS = [
  { id: 'modeCover_classic', modeId: 'classic', label: 'Κλασικό', surfaces: ['tablet', 'forms'] },
  { id: 'modeCover_marathon', modeId: 'marathon', label: 'Mega Marathon', surfaces: ['tablet', 'forms'] },
  { id: 'modeCover_arrest_heist', modeId: 'arrest_heist', label: 'Arrest & Heist', surfaces: ['tablet', 'forms'] },
  { id: 'modeCover_pajama', modeId: 'pajama', label: 'Pajama Mode', surfaces: ['tablet', 'forms'] },
  { id: 'modeCover_pedi_extended', modeId: 'pedi_extended', label: 'Pedi-Glam Extended', surfaces: ['tablet', 'forms'] },
  { id: 'modeCover_lockdown', modeId: 'lockdown', label: 'PAJAMA LOCKDOWN 18+', surfaces: ['tablet', 'forms'] },
  { id: 'modeCover_beach_bar', modeId: 'beach_bar', label: 'BEACH BAR HOME LOCKDOWN', surfaces: ['tablet', 'forms'] },
];

// Τα δύο βίντεο έναρξης της τηλεόρασης.
export const VIDEO_SLOTS = [
  { id: 'welcomeVideo', label: 'WELCOME VIDEO', where: 'TV — όταν συνδέεται σε ενεργή συνεδρία', surfaces: ['tv'] },
  { id: 'countdownVideo', label: 'COUNTDOWN VIDEO', where: 'TV — αμέσως μετά την εντολή Έναρξη Παιχνιδιού', surfaces: ['tv'] },
];
