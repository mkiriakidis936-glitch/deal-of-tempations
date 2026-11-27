// Η ΤΑΙΝΙΑ · θέσεις media του MEGA UPDATE, με τα ΑΚΡΙΒΗ ονόματα αρχείων του φακέλου
// «DEAL OF TEMPATIONS ALL / 11_MEGA_UPDATE» και των prompts. Ίδιο όνομα = μπαίνει μόνο του με «Αυτόματη σύνδεση».
// Κάθε θέση είναι μια «φάση» (section) του mode deal_movie, άρα φαίνεται στο Admin → Χάρτης media.

const S = (id, filename, label, group, extra = {}) => ({ id, filename, label: `${group} · ${label}`, group, ...extra });
const V = (id, filename, label, where) => S(id, filename, label, '🎞️ Βίντεο ταινίας', { kind: 'video', surfaces: ['tv'], where, need: 'recommended' });

export const CONT_SLUG = { classic: 'cont1_classic', arrest_heist: 'cont2_arrest_heist', lockdown: 'cont3_pajama_lockdown', marathon_4h: 'cont4_pajama_heist_arrest', villa_takeover: 'cont5_villa_takeover' };
const CONT_NAME = { classic: 'Classic', arrest_heist: 'Arrest Heist', lockdown: 'Pajama Lockdown', marathon_4h: 'Pajama Heist & Arrest', villa_takeover: 'Villa Takeover' };
const CONT_NO = { classic: 1, arrest_heist: 2, lockdown: 3, marathon_4h: 4, villa_takeover: 5 };

// Πράξεις (act01–09): εικόνα ανά πράξη, 16:9 TV και 9:16 κινητό. Αντιστοίχιση από τον τίτλο της πράξης.
export const ACT_ART = [
  ['act01_classic', 'Η Εκκίνηση στον Χάρτη', /ΕΚΚΙΝΗΣΗ/],
  ['act02_arrest_heist', 'Καταδίωξη & Λεία', /ΚΑΤΑΔΙΩΞΗ|ΛΕΗΛΑΣΙΕΣ|ΕΚΤΑΚΤΟ/],
  ['act03_pajama_lockdown', 'Κλειστές Πόρτες & Μυστικά', /ΚΛΕΙΣΤΕΣ ΠΟΡΤΕΣ/],
  ['act04_villa_domination', 'Κυριαρχία στη Βίλα', /ΚΥΡΙΑΡΧΙΑ/],
  ['act05_night_clash', 'Νυχτερινή Σύγκρουση', /ΝΥΧΤΕΡΙΝΗ ΣΥΓΚΡΟΥΣΗ/],
  ['act06_final_blow', 'Το Τελικό Χτύπημα', /ΤΕΛΙΚΟ ΧΤΥΠΗΜΑ/],
  ['act07_villa_zones', 'Μάχη Ζωνών', /ΖΩΝΩΝ/],
  ['act08_last_interrogation', 'Η Τελευταία Ανάκριση', /ΤΕΛΕΥΤΑΙΑ ΑΝΑΚΡΙΣΗ/],
  ['act09_grand_finale', 'Grand Finale', /GRAND FINALE/],
];
export const actArtId = (title = '') => ACT_ART.find(([, , re]) => re.test(String(title).toUpperCase()))?.[0] || '';

// Δοκιμασίες → εικόνα μηχανισμού (κινητό) και _16x9 (TV).
export const TRIAL_MECH = {
  shoe: 'mech_shoe_off_one', sock: 'mech_sock_off_one', onefoot: 'mech_dance_one_leg', tickle: 'mech_tickle_feet', mask: 'mech_sleep_mask',
  cuffs: 'mech_hands_tied_cuffs', feettie: 'mech_feet_together_tied', toetie: 'mech_big_toes_tied', flipflops: 'mech_flipflops_feet_tied',
  bounddance: 'mech_dance_hands_behind', tiptoe: 'mech_tiptoe_hands_up', hogtie: 'mech_capture_scene', nightsock: 'mech_sleep_sock_heist_stealth',
};
const MECH_EXTRA = { pajamas: ['mech_pajamas_switch', 'Αλλαγή σε πιτζάμες'], counter: ['mech_shoe_sock_counter', 'Μετρητής παπουτσιών/καλτσών'], trophy: ['mech_sock_trophy', 'Τρόπαιο κάλτσας'] };
const MECH_LABEL = {
  shoe: 'Ένα παπούτσι', sock: 'Μία κάλτσα', onefoot: 'Χορός στο ένα πόδι', tickle: 'Γαργάλημα πελμάτων', mask: 'Μάσκα ύπνου', cuffs: 'Χειροπέδες / δεμένα χέρια',
  feettie: 'Δεμένα πόδια', toetie: 'Δεμένοι μεγάλοι αντίχειρες', flipflops: 'Σαγιονάρες & δεμένα πόδια', bounddance: 'Χορός με χέρια πίσω', tiptoe: 'Μύτες & χέρια ψηλά',
  hogtie: 'Σκηνή σύλληψης', nightsock: 'Night Sock Heist',
};

// Κάρτες της Ταινίας → εικόνα 4:5 (κινητό/Tablet) και _16x9 (TV).
export const CARD_ART = {
  who: 'card_who_said_it', deal10: 'card_agreement_10s', rule: 'card_round_rule', bluff: 'card_truth_or_bluff', dilemma: 'card_points_dilemma',
  blackmarket: 'card_black_market', wantedcheck: 'card_most_wanted_check', chain: 'card_chain_of_thought', hotseat: 'card_hot_chair', council: 'card_council_verdict',
  swap: 'card_position_swap', warrant: 'card_alarm_warrant', finaltruth: 'card_final_truth_double', lastrisk: 'card_last_risk', partyvote: 'card_crew_vote',
};

// Χρώμα νυχιών (όπως δηλώνεται στο κινητό) → φωτογραφία.
export const NAIL_ART = { Κόκκινο: 'nails_red', Μαύρο: 'nails_black', Ροζ: 'nails_pink', Σκούρο: 'nails_burgundy', Nude: 'nails_nude', Φούξια: 'nails_fuchsia' };

export const MOVIE_MEGA_SECTIONS = [
  // Βίντεο χάρτη & καταστάσεων
  ...Object.keys(CONT_SLUG).map((c) => V(`vid_jump_${c}`, `map_jump_to_cont${CONT_NO[c]}.mp4`, `Άλμα χάρτη → Ήπειρος ${CONT_NO[c]} ${CONT_NAME[c]}`, 'TV: παίζει στη μετάβαση προς αυτή την ήπειρο (Previously On).')),
  V('vid_previously', 'map_previously_on.mp4', 'Previously On (χάρτης)', 'TV: φόντο της μετάβασης όταν δεν υπάρχει βίντεο άλματος.'),
  V('vid_standby', 'standby_loop.mp4', 'Standby (loop)', 'TV: φόντο όσο η ταινία είναι σε Standby.'),
  V('vid_night', 'night_mode_transition.mp4', 'Μετάβαση σε νύχτα', 'TV: φόντο της Νυχτερινής λειτουργίας.'),
  V('vid_act_title', 'act_title_reveal.mp4', 'Αποκάλυψη τίτλου πράξης', 'TV: πίσω από την κάρτα τίτλου στην αρχή κάθε πράξης.'),
  V('vid_finale_map', 'map_finale_all_light.mp4', 'Φινάλε: όλος ο χάρτης φωτίζεται', 'TV: τα πρώτα δευτερόλεπτα του Μεγάλου Φινάλε.'),
  V('vid_big_gift', 'final_big_gift.mp4', 'Το Μεγάλο Δώρο', 'TV: φόντο του Μεγάλου Δώρου στο φινάλε.'),
  // Σκηνικά ηπείρων
  ...Object.entries(CONT_SLUG).flatMap(([c, slug]) => [
    S(`hero_${c}`, `${slug}_hero_16x9.jpg`, `${CONT_NAME[c]} — φόντο TV 16:9`, '🌍 Σκηνικά ηπείρων', { surfaces: ['tv'], where: 'TV: φόντο της ενεργής πράξης σε αυτή την ήπειρο.' }),
    S(`card_${c}`, `${slug}_card_4x5.jpg`, `${CONT_NAME[c]} — κάρτα 4:5`, '🌍 Σκηνικά ηπείρων', { surfaces: ['tablet'], where: 'Tablet: κάρτα της ηπείρου στην Οθόνη 1.' }),
    S(`phone_${c}`, `${slug}_phone_9x16.jpg`, `${CONT_NAME[c]} — φόντο κινητού 9:16`, '🌍 Σκηνικά ηπείρων', { surfaces: ['mobile'], where: 'Κινητό: φόντο όσο παίζεται αυτή η ήπειρος.' }),
    S(`icon_${c}`, `icon_${slug}.png`, `${CONT_NAME[c]} — εικονίδιο χάρτη`, '🗺️ Χάρτης & εικονίδια', { surfaces: ['tv', 'tablet', 'mobile'], where: 'Πάνω στον χάρτη, στο κέντρο της ηπείρου.' }),
  ]),
  ...[['crown', 'Στέμμα'], ['gift', 'Δώρο'], ['loot', 'Λεία'], ['token', 'Token'], ['wanted_star', 'Αστέρι Wanted'], ['warrant', 'Ένταλμα']].map(([k, l]) => S(`icon_${k}`, `icon_${k}.png`, l, '🗺️ Χάρτης & εικονίδια', { surfaces: ['tv', 'mobile'], where: 'Εικονίδιο στη βαθμολογία της TV και στο κινητό.' })),
  S('map_frame', 'map_10_frame_only.png', 'Πλαίσιο χάρτη', '🗺️ Χάρτης & εικονίδια', { surfaces: ['tv', 'tablet', 'mobile'], where: 'Πλαίσιο γύρω από τον χάρτη (αντί για τις χρωματιστές γραμμές).' }),
  // Φόντα οθονών
  ...[
    ['bg_tv_act_title', 'TV — τίτλος πράξης', ['tv']], ['bg_tv_previously_on', 'TV — Previously On', ['tv']], ['bg_tv_standby', 'TV — Standby', ['tv']],
    ['bg_tv_night_mode', 'TV — νύχτα', ['tv']], ['bg_tv_big_gift', 'TV — Μεγάλο Δώρο', ['tv']], ['bg_tv_final_recap', 'TV — τελική ανασκόπηση', ['tv']],
    ['wanted_poster_bg', 'Αφίσα Wanted', ['tv', 'mobile']], ['bg_tablet_console', 'Tablet — κονσόλα', ['tablet']], ['bg_phone_waiting', 'Κινητό — αναμονή', ['mobile']], ['bg_phone_night', 'Κινητό — νύχτα', ['mobile']],
  ].map(([f, l, surfaces]) => S(f, `${f}.jpg`, l, '🖼️ Φόντα οθονών', { surfaces, where: 'Φόντο της αντίστοιχης οθόνης.' })),
  // Πράξεις
  ...ACT_ART.flatMap(([id, l]) => [
    S(`${id}_16x9`, `${id}_16x9.jpg`, `${l} — TV 16:9`, '🎬 Πράξεις', { surfaces: ['tv'], where: 'TV: φόντο αυτής της πράξης (πριν από το σκηνικό της ηπείρου).', need: 'optional' }),
    S(`${id}_9x16`, `${id}_9x16.jpg`, `${l} — κινητό 9:16`, '🎬 Πράξεις', { surfaces: ['mobile'], where: 'Κινητό: φόντο αυτής της πράξης.', need: 'optional' }),
  ]),
  // Νύχια
  ...['red', 'black', 'pink', 'burgundy', 'nude', 'fuchsia', 'palette'].map((c) => S(`nails_${c}`, `nails_${c}.jpg`, c === 'palette' ? 'Παλέτα χρωμάτων' : c, '💅 Χρώμα νυχιών', { surfaces: ['mobile', 'tv'], where: 'Δήλωση νυχιών στο κινητό και κλήρωση στην TV.' })),
  // Δοκιμασίες
  ...Object.entries(TRIAL_MECH).flatMap(([t, f]) => [
    S(`mech_${t}`, `${f}.jpg`, `${MECH_LABEL[t]} — κινητό`, '⛓️ Γύροι & δοκιμασίες', { surfaces: ['mobile'], where: 'Κινητό της παίκτριας τη στιγμή της δοκιμασίας.' }),
    S(`mech_${t}_tv`, `${f}_16x9.jpg`, `${MECH_LABEL[t]} — TV 16:9`, '⛓️ Γύροι & δοκιμασίες', { surfaces: ['tv'], where: 'TV τη στιγμή της δοκιμασίας.' }),
  ]),
  ...Object.entries(MECH_EXTRA).flatMap(([k, [f, l]]) => [
    S(`mech_${k}`, `${f}.jpg`, `${l} — κινητό`, '⛓️ Γύροι & δοκιμασίες', { surfaces: ['mobile'], where: 'Κινητό.' }),
    S(`mech_${k}_tv`, `${f}_16x9.jpg`, `${l} — TV 16:9`, '⛓️ Γύροι & δοκιμασίες', { surfaces: ['tv'], where: 'TV.' }),
  ]),
  // Κάρτες
  ...Object.entries(CARD_ART).flatMap(([id, f]) => [
    S(`cardart_${id}`, `${f}.jpg`, `${f.replace('card_', '').replace(/_/g, ' ')} — 4:5`, '🎴 Κάρτες ταινίας', { surfaces: ['mobile', 'tablet'], where: 'Κινητό & Tablet όταν βγαίνει η κάρτα.', need: 'optional' }),
    S(`cardart_${id}_tv`, `${f}_16x9.jpg`, `${f.replace('card_', '').replace(/_/g, ' ')} — TV 16:9`, '🎴 Κάρτες ταινίας', { surfaces: ['tv'], where: 'TV όταν βγαίνει η κάρτα.', need: 'optional' }),
  ]),
];
