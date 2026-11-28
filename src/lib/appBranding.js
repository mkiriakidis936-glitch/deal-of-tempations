// Εικονίδιο εφαρμογής, εικόνα εκκίνησης iPhone και εικόνα κοινοποίησης (WhatsApp, Viber, Messenger).
// Καθαρό αρχείο (χωρίς imports): το χρησιμοποιούν και ο server και το Admin.
// Το Admin φτιάχνει ΜΟΝΟ του κάθε μέγεθος από μία εικόνα και τα αποθηκεύει στο media_overrides.appBranding
// ως { '/icons/icon-192.png': '/media/…png', … }. Ο server σερβίρει το ανεβασμένο αρχείο σε αυτές τις διευθύνσεις.

export const BRANDING_FIELD = 'appBranding';

export const BRANDING_GROUPS = [
  {
    id: 'icon',
    label: 'Εικονίδιο εφαρμογής',
    hint: 'Αρχική οθόνη κινητού/tablet, καρτέλα του browser, ειδοποιήσεις. Τετράγωνη PNG, ιδανικά 1024×1024.',
    files: [
      { path: '/icons/favicon-32.png', w: 32, h: 32, type: 'image/png' },
      { path: '/icons/favicon-48.png', w: 48, h: 48, type: 'image/png' },
      { path: '/icons/apple-touch-icon.png', w: 180, h: 180, type: 'image/png', fill: '#000000' },
      { path: '/icons/icon-192.png', w: 192, h: 192, type: 'image/png' },
      { path: '/icons/icon-512.png', w: 512, h: 512, type: 'image/png' },
      // Android «maskable»: το σχήμα κόβεται σε κύκλο/στρογγυλό τετράγωνο, άρα αφήνουμε περιθώριο 10%.
      { path: '/icons/icon-maskable-512.png', w: 512, h: 512, type: 'image/png', fill: '#000000', pad: 0.1 },
    ],
  },
  {
    id: 'splash',
    label: 'Εικόνα εκκίνησης iPhone',
    hint: 'Εμφανίζεται για μια στιγμή όταν ανοίγει η εφαρμογή από την αρχική οθόνη του iPhone. Κάθετη 9:19.',
    files: [
      { path: '/splash/iphone-17-pro.jpg', w: 1206, h: 2622, type: 'image/jpeg' },
      { path: '/splash/iphone-17-pro-max.jpg', w: 1320, h: 2868, type: 'image/jpeg' },
      { path: '/splash/iphone-15-pro.jpg', w: 1179, h: 2556, type: 'image/jpeg' },
      { path: '/splash/iphone-15-pro-max.jpg', w: 1290, h: 2796, type: 'image/jpeg' },
    ],
  },
  {
    id: 'share',
    label: 'Εικόνα κοινοποίησης',
    hint: 'Η προεπισκόπηση όταν στέλνεις link σε WhatsApp, Viber, Messenger, Instagram. Οριζόντια 1200×630.',
    files: [
      { path: '/og-image.jpg', w: 1200, h: 630, type: 'image/jpeg' },
    ],
  },
];

export const BRANDING_PATHS = BRANDING_GROUPS.flatMap((group) => group.files.map((file) => file.path));

// Μόνο ασφαλείς τιμές: διαδρομή που δέχεται ο server και αρχείο στο /media/ (ανεβασμένο από το Admin).
export function brandingMap(value) {
  const out = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
  for (const path of BRANDING_PATHS) {
    const url = value[path];
    if (typeof url === 'string' && /^\/media\/[A-Za-z0-9._-]+$/.test(url)) out[path] = url;
  }
  return out;
}

// Πόσα αρχεία μιας ομάδας έχουν αλλάξει (0 = ενσωματωμένη εικόνα).
export const groupState = (map, group) => group.files.filter((file) => map[file.path]).length;
