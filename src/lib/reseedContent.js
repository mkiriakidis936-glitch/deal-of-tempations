import * as GCFG from '@/data/gameConfig';
import * as GCNT from '@/data/gameContent';
import { base44 } from '@/api/base44Client';

// Χτίζει τον πίνακα εγγραφών GameContent από τα static αρχεία (ίδιο mapping με την αρχική σπορά).
export function buildGameContentRecords() {
  const records = [];
  function addList(cat, arr, mapFn) {
    if (!Array.isArray(arr)) return;
    arr.forEach((it, i) => {
      records.push({
        category: cat,
        itemId: String((it && (it.id || it.step || it.position || it.level)) || ('i' + i)),
        data: mapFn ? mapFn(it, i) : it,
        order: i,
      });
    });
  }
  function addStringList(cat, arr) {
    if (!Array.isArray(arr)) return;
    arr.forEach((s, i) => records.push({ category: cat, itemId: 's' + i, data: { text: s }, order: i }));
  }

  addList('board', GCFG.BOARD, (it) => ({ name: it.name, type: it.type }));
  addList('penalties', GCFG.FULL_PENALTY_LADDER);
  addList('footwear_levels', GCFG.FOOTWEAR_LEVELS);
  addList('hidden_roles', GCFG.HIDDEN_ROLES);
  addList('toenail_perks', GCFG.TOENAIL_PERKS);
  addList('warrant_cards', GCNT.WARRANT_CARDS);
  addList('glitch_cards', GCNT.GLITCH_CARDS);
  addList('black_market_options', GCNT.BLACK_MARKET_OPTIONS);
  addList('street_truths', GCNT.STREET_TRUTHS);
  addList('street_dares', GCNT.STREET_DARES);
  addList('hardcore_truths', GCNT.HARDCORE_TRUTHS);
  addList('ultimate_truths', GCNT.ULTIMATE_TRUTHS);
  addList('extreme_protocols', GCNT.EXTREME_PROTOCOLS);
  addList('marathon_stages', GCFG.MARATHON_STAGES);
  addList('marathon_trials', GCNT.MARATHON_TRIALS);
  addList('marathon_group_penalties', GCNT.MARATHON_GROUP_PENALTIES);
  addList('marathon_lockdown', GCNT.MARATHON_LOCKDOWN);
  addList('arrest_heist_ladder', GCFG.ARREST_HEIST_LADDER);
  addList('arrest_heist_dares', GCNT.ARREST_HEIST_DARES);
  addList('arrest_heist_truths', GCNT.ARREST_HEIST_TRUTHS);
  addList('arrest_heist_intensity', GCFG.ARREST_HEIST_INTENSITY);
  addList('bomb_typing_types', GCFG.BOMB_TYPING_TYPES);
  addList('bomb_riddles_alpha', GCFG.BOMB_RIDDLES_ALPHA);
  addList('bomb_riddles_beta', GCFG.BOMB_RIDDLES_BETA);
  addList('bomb_paso_trials', GCFG.BOMB_PASO_TRIALS);
  addList('mini_games', GCNT.MINI_GAMES);
  addList('plot_twists', GCNT.PLOT_TWISTS);
  addList('digital_cards', GCNT.DIGITAL_CARDS);
  addList('game_modes', GCFG.GAME_MODES);
  addList('intensity_levels', GCFG.INTENSITY_LEVELS);
  addList('oracle_dilemmas', GCNT.ORACLE_DILEMMAS);
  addList('crypt_riddle_templates', GCNT.CRYPT_RIDDLE_TEMPLATES, (s, i) => ({ id: i + 1, text: s }));
  addStringList('lockdown_commands', GCNT.LOCKDOWN_COMMANDS);
  addStringList('wheel_binding_materials', GCFG.WHEEL_BINDING_MATERIALS);
  addStringList('wheel_tickle_tools', GCFG.WHEEL_TICKLE_TOOLS);
  records.push({ category: 'midnight_pact_offer', itemId: 'main', data: { text: GCNT.MIDNIGHT_PACT_OFFER }, order: 0 });
  records.push({ category: 'grand_jury_rewards', itemId: 'main', data: { text: GCNT.GRAND_JURY_REWARDS }, order: 0 });
  records.push({ category: 'vault_trial_prompts', itemId: 'main', data: { json: JSON.stringify(GCNT.VAULT_TRIAL_PROMPTS) }, order: 0 });
  records.push({ category: 'square_types', itemId: 'main', data: { json: JSON.stringify(GCFG.SQUARE_TYPES) }, order: 0 });

  return records;
}

// Διαγράφει όλο το περιεχόμενο και το ξανασπέρνει από τα static αρχεία.
export async function reseedGameContent() {
  const records = buildGameContentRecords();
  // καθαρισμός
  let more = true;
  while (more) {
    const res = await base44.entities.GameContent.deleteMany({});
    more = res?.has_more;
  }
  // δημιουργία σε παρτίδες
  for (let i = 0; i < records.length; i += 400) {
    await base44.entities.GameContent.bulkCreate(records.slice(i, i + 400));
  }
  return records.length;
}