import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ContentCrudTab from '@/components/admin/content/ContentCrudTab';
import { CONTENT_CATEGORIES } from '@/components/admin/content/contentSchemas';

const MODE_GROUPS = [
  {
    id: 'classic',
    label: '🎲 CLASSIC MODE',
    desc: '44 κουτιά · Σκάλα 7 Ποινών · Στάδια 1-3',
    color: 'bg-tarot-wine',
    cats: ['board', 'penalties', 'footwear_levels', 'hidden_roles', 'toenail_perks', 'warrant_cards', 'glitch_cards', 'black_market_options', 'street_truths', 'street_dares', 'hardcore_truths', 'ultimate_truths', 'extreme_protocols'],
  },
  {
    id: 'marathon',
    label: '🏆 MEGA MARATHON (48h)',
    desc: '2 ομάδες · 4 στάδια · $200.000 Loot',
    color: 'bg-tarot-royal',
    cats: ['marathon_stages', 'marathon_trials', 'marathon_group_penalties', 'marathon_lockdown'],
  },
  {
    id: 'arrest_heist',
    label: '🚨 ARREST & HEIST',
    desc: '6 γύροι · Σκάλα Σύλληψης · Grand Heist Escape',
    color: 'bg-destructive',
    badge: '⚡ ΝΕΟ',
    cats: ['arrest_heist_ladder', 'arrest_heist_dares', 'arrest_heist_truths', 'arrest_heist_intensity'],
  },
  {
    id: 'bomb',
    label: '💣 BOMB EVENT',
    desc: 'Γρίφοι · P.A.S.O. Trials · Typing Types',
    color: 'bg-tarot-sienna',
    cats: ['bomb_typing_types', 'bomb_riddles_alpha', 'bomb_riddles_beta', 'bomb_paso_trials'],
  },
  {
    id: 'special',
    label: '🎭 FINALE & SPECIAL',
    desc: 'Mini-Games · Plot Twists · Oracle · Wheel · Grand Jury',
    color: 'bg-tarot-forest',
    cats: ['mini_games', 'plot_twists', 'digital_cards', 'oracle_dilemmas', 'crypt_riddle_templates', 'lockdown_commands', 'wheel_binding_materials', 'wheel_tickle_tools', 'midnight_pact_offer', 'grand_jury_rewards', 'vault_trial_prompts'],
  },
  {
    id: 'global',
    label: '⚙️ GLOBAL SETTINGS',
    desc: 'Game Modes · Intensity Levels · Square Types',
    color: 'bg-tarot-teal',
    cats: ['game_modes', 'intensity_levels', 'square_types'],
  },
];

export default function AdminContent({ modeFilter }) {
  const visibleGroups = modeFilter
    ? MODE_GROUPS.filter((g) => modeFilter === 'special' ? ['bomb', 'special', 'global'].includes(g.id) : g.id === modeFilter)
    : MODE_GROUPS;
  const firstCat = visibleGroups.flatMap((g) => g.cats)[0];
  const [tab, setTab] = useState(firstCat || 'arrest_heist_ladder');
  const active = CONTENT_CATEGORIES.find((c) => c.id === tab);
  const activeGroup = MODE_GROUPS.find((g) => g.cats.includes(tab));

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-primary">
        <div className="font-heading text-xl comic-text-stroke">📦 ΔΙΑΧΕΙΡΙΣΗ ΠΕΡΙΕΧΟΜΕΝΟΥ</div>
        <div className="text-xs font-bold mt-1">
          Οργανωμένο ανά Mode — κάθε ομάδα ελέγχει ξεχωριστά το περιεχόμενό της.
        </div>
      </ComicPanel>

      {activeGroup && (
        <ComicPanel className={`${activeGroup.color} p-2`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading text-sm text-foreground">{activeGroup.label}</span>
            {activeGroup.badge && (
              <span className="text-xs bg-primary text-tarot-dark font-bold px-2 py-0.5 rounded comic-pulse">
                {activeGroup.badge}
              </span>
            )}
            <span className="text-xs text-foreground/70">{activeGroup.desc}</span>
          </div>
        </ComicPanel>
      )}

      <div className="space-y-3">
        {visibleGroups.map((group) => {
          const groupCats = group.cats
            .map((id) => CONTENT_CATEGORIES.find((c) => c.id === id))
            .filter(Boolean);
          return (
            <div key={group.id} className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-heading text-xs px-2 py-1 rounded ${group.color} text-foreground`}>
                  {group.label}
                </span>
                {group.badge && (
                  <span className="text-[10px] bg-primary text-tarot-dark font-bold px-1.5 py-0.5 rounded comic-pulse">
                    {group.badge}
                  </span>
                )}
              </div>
              <div className="flex gap-1 flex-wrap pl-3 border-l-2 border-border/40">
                {groupCats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setTab(c.id)}
                    className={`text-xs px-2 py-1 rounded border-2 border-border font-bold transition-all ${tab === c.id ? 'bg-primary text-tarot-dark comic-pulse' : 'bg-card hover:bg-secondary'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <ComicPanel className="bg-card">
        {active && <ContentCrudTab category={active} />}
      </ComicPanel>
    </div>
  );
}