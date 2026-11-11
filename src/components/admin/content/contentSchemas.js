// Field schemas for every GameContent category.
// shape: 'list' (many records, each data = item object)
//        'stringList' (many records, each data = { text })
//        'single' (one record, data = { text })
//        'json' (one record, data = { json: stringified })
// field types: 'text' | 'number' | 'textarea' | 'select'

export const CONTENT_CATEGORIES = [
  {
    id: 'board', label: '🗺️ Ταμπλό', shape: 'list',
    fields: [
      { key: 'name', label: 'Όνομα', type: 'text' },
      { key: 'type', label: 'Τύπος', type: 'select', options: ['street', 'glitch', 'warrant', 'blackmarket', 'safehouse', 'police'] },
    ],
  },
  {
    id: 'penalties', label: '⛓️ Σκάλα Ποινών', shape: 'list',
    fields: [
      { key: 'step', label: 'Βήμα', type: 'number' },
      { key: 'label', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'detail', label: 'Λεπτομέρεια', type: 'textarea' },
      { key: 'challenge', label: 'Challenge', type: 'textarea' },
    ],
  },
  {
    id: 'footwear_levels', label: '👢 Επίπεδα Υπόδησης', shape: 'list',
    fields: [
      { key: 'level', label: 'Level', type: 'number' },
      { key: 'label', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'steps', label: 'Βήματα', type: 'number' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'hidden_roles', label: '🎭 Κρυφοί Ρόλοι', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'toenail_perks', label: '💅 Toenail Perks', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'color', label: 'Χρώμα (hex)', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'warrant_cards', label: '📜 Warrant Cards', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'glitch_cards', label: '⚡ Glitch Cards', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'black_market_options', label: '🛍️ Black Market', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'cost', label: 'Κόστος', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'street_truths', label: '💬 Street Truths', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'text', label: 'Κείμενο', type: 'textarea' },
    ],
  },
  {
    id: 'street_dares', label: '🔥 Street Dares', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'text', label: 'Κείμενο', type: 'textarea' },
      { key: 'duration', label: 'Διάρκεια (″)', type: 'number' },
    ],
  },
  {
    id: 'hardcore_truths', label: '🔥 Hardcore Truths', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'text', label: 'Κείμενο', type: 'textarea' },
    ],
  },
  {
    id: 'ultimate_truths', label: '🔴 Ultimate Truths', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'text', label: 'Κείμενο', type: 'textarea' },
    ],
  },
  {
    id: 'extreme_protocols', label: '⚡ Extreme Protocols', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'duration', label: 'Διάρκεια (″)', type: 'number' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
      { key: 'ultra_duration', label: 'ULTRA Διάρκεια (″)', type: 'number', dataKey: 'ultra.duration' },
      { key: 'ultra_desc', label: 'ULTRA Περιγραφή', type: 'textarea', dataKey: 'ultra.desc' },
    ],
  },
  {
    id: 'marathon_stages', label: '🏆 Marathon Stages', shape: 'list',
    fields: [
      { key: 'stage', label: 'Στάδιο', type: 'number' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'wantedRange', label: 'Wanted Range', type: 'text' },
      { key: 'target', label: 'Στόχος', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'marathon_trials', label: '🦶 Marathon Trials', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'type', label: 'Τύπος', type: 'text' },
      { key: 'duration', label: 'Διάρκεια (″)', type: 'number' },
      { key: 'target', label: 'Στόχος', type: 'number' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'marathon_group_penalties', label: '🚨 Group Penalties', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'duration', label: 'Διάρκεια (″)', type: 'number' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'marathon_lockdown', label: '🔒 Lockdown Positions', shape: 'list',
    fields: [
      { key: 'role', label: 'Ρόλος', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'arrest_heist_ladder', label: '⛓️ Arrest & Heist Ladder', shape: 'list',
    fields: [
      { key: 'step', label: 'Βήμα', type: 'number' },
      { key: 'label', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'detail', label: 'Λεπτομέρεια', type: 'textarea' },
    ],
  },
  {
    id: 'arrest_heist_dares', label: '🔥 Arrest & Heist Dares', shape: 'list',
    fields: [
      { key: 'step', label: 'Βήμα', type: 'number' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'text', label: 'Κείμενο', type: 'textarea' },
    ],
  },
  {
    id: 'arrest_heist_truths', label: '💬 Arrest & Heist Truths', shape: 'list',
    fields: [
      { key: 'step', label: 'Βήμα', type: 'number' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'text', label: 'Κείμενο', type: 'textarea' },
    ],
  },
  {
    id: 'arrest_heist_intensity', label: '🚨 A&H Intensity', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'bomb_typing_types', label: '🪢 Bomb Typing Types', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'bomb_riddles_alpha', label: '💣 Alpha Riddles', shape: 'list',
    fields: [
      { key: 'id', label: '#', type: 'number' },
      { key: 'code', label: 'Κωδικός', type: 'text' },
      { key: 'question', label: 'Ερώτηση', type: 'textarea' },
      { key: 'answer', label: 'Απάντηση', type: 'text' },
      { key: 'logic', label: 'Λογική', type: 'text' },
    ],
  },
  {
    id: 'bomb_riddles_beta', label: '💣 Beta Riddles', shape: 'list',
    fields: [
      { key: 'id', label: '#', type: 'number' },
      { key: 'code', label: 'Κωδικός', type: 'text' },
      { key: 'question', label: 'Ερώτηση', type: 'textarea' },
      { key: 'answer', label: 'Απάντηση', type: 'text' },
      { key: 'logic', label: 'Λογική', type: 'text' },
    ],
  },
  {
    id: 'bomb_paso_trials', label: '🔥 P.A.S.O. Trials', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
      { key: 'success', label: 'Επιτυχία', type: 'textarea' },
    ],
  },
  {
    id: 'mini_games', label: '🎮 Mini-Games', shape: 'list',
    fields: [
      { key: 'id', label: '#', type: 'number' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'setup', label: 'Υλικά', type: 'textarea' },
      { key: 'action', label: 'Δράση', type: 'textarea' },
    ],
  },
  {
    id: 'plot_twists', label: '🎭 Plot Twists', shape: 'list',
    fields: [
      { key: 'id', label: '#', type: 'number' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'trigger', label: 'Trigger', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'digital_cards', label: '💳 Digital Cards', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'cost', label: 'Κόστος', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'game_modes', label: '🎮 Game Modes', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'intensity_levels', label: '🔥 Intensity Levels', shape: 'list',
    fields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Τίτλος', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'desc', label: 'Περιγραφή', type: 'textarea' },
    ],
  },
  {
    id: 'oracle_dilemmas', label: '🔮 Oracle Dilemmas', shape: 'list',
    fields: [
      { key: 'id', label: '#', type: 'number' },
      { key: 'fate', label: 'Fate', type: 'text' },
      { key: 'icon', label: 'Εικονίδιο', type: 'text' },
      { key: 'text', label: 'Κείμενο', type: 'textarea' },
    ],
  },
  {
    id: 'crypt_riddle_templates', label: '🗝️ Crypt Riddle Templates', shape: 'list',
    fields: [
      { key: 'id', label: '#', type: 'number' },
      { key: 'text', label: 'Κείμενο', type: 'textarea' },
    ],
  },
  {
    id: 'lockdown_commands', label: '📢 Lockdown Commands', shape: 'stringList',
    fields: [{ key: 'text', label: 'Εντολή', type: 'text' }],
  },
  {
    id: 'wheel_binding_materials', label: '🪢 Wheel Binding Materials', shape: 'stringList',
    fields: [{ key: 'text', label: 'Υλικό', type: 'text' }],
  },
  {
    id: 'wheel_tickle_tools', label: '🪶 Wheel Tickle Tools', shape: 'stringList',
    fields: [{ key: 'text', label: 'Εργαλείο', type: 'text' }],
  },
  {
    id: 'midnight_pact_offer', label: '🥂 Midnight Pact Offer', shape: 'single',
    fields: [{ key: 'text', label: 'Κείμενο', type: 'textarea' }],
  },
  {
    id: 'grand_jury_rewards', label: '👑 Grand Jury Rewards', shape: 'single',
    fields: [{ key: 'text', label: 'Κείμενο Ανταμοιβής', type: 'textarea' }],
  },
  {
    id: 'vault_trial_prompts', label: '🗝️ Vault Trial Prompts', shape: 'json',
    fields: [{ key: 'json', label: 'JSON', type: 'textarea' }],
  },
  {
    id: 'square_types', label: '🧩 Square Types', shape: 'json',
    fields: [{ key: 'json', label: 'JSON', type: 'textarea' }],
  },
];