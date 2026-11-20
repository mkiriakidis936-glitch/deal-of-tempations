import React from 'react';
import { cn } from '@/lib/utils';

const COLOR_MAP = {
  warrant_cards: 'bg-primary/20',
  glitch_cards: 'bg-tarot-royal/30',
  black_market_options: 'bg-tarot-forest/30',
  street_truths: 'bg-tarot-teal/30',
  street_dares: 'bg-destructive/40',
  hardcore_truths: 'bg-tarot-sienna/40',
  ultimate_truths: 'bg-destructive/60',
  extreme_protocols: 'bg-tarot-wine/40',
  marathon_trials: 'bg-tarot-teal/30',
  marathon_group_penalties: 'bg-rose-200',
  marathon_lockdown: 'bg-tarot-royal/30',
  arrest_heist_dares: 'bg-destructive/40',
  arrest_heist_truths: 'bg-tarot-teal/30',
  bomb_typing_types: 'bg-tarot-sienna/30',
  bomb_riddles_alpha: 'bg-primary/20',
  bomb_riddles_beta: 'bg-primary/20',
  bomb_paso_trials: 'bg-tarot-sienna/40',
  mini_games: 'bg-lime-200',
  plot_twists: 'bg-fuchsia-200',
  digital_cards: 'bg-teal-200',
  oracle_dilemmas: 'bg-violet-200',
  crypt_riddle_templates: 'bg-stone-200',
  lockdown_commands: 'bg-secondary',
  wheel_binding_materials: 'bg-tarot-sienna/30',
  wheel_tickle_tools: 'bg-tarot-sienna/30',
  midnight_pact_offer: 'bg-rose-200',
  vault_trial_prompts: 'bg-stone-200',
};

const TITLE_KEYS = ['name', 'label', 'role', 'fate'];

export default function CardPreview({ category, data }) {
  const { id, label, shape, fields } = category;
  const bg = COLOR_MAP[id] || 'bg-primary/20';
  const d = data || {};

  const titleKey = fields.find((f) => TITLE_KEYS.includes(f.key) && !f.dataKey);
  const title = titleKey ? (d[titleKey.key] || '') : (shape === 'stringList' ? label : '');
  const icon = d.icon || '';

  const bodyFields = fields.filter(
    (f) => ['text', 'textarea'].includes(f.type) && !f.dataKey && !TITLE_KEYS.includes(f.key)
  );
  const numFields = fields.filter((f) => f.type === 'number' && !f.dataKey);

  return (
    <div className={cn('comic-panel p-4 relative overflow-hidden', bg)} style={{ minHeight: 240 }}>
      <div className="absolute inset-0 comic-dots opacity-20 pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-2 h-full">
        <div className="text-[10px] font-bold uppercase tracking-wider bg-background text-foreground px-2 py-0.5 rounded self-start">
          {label}
        </div>
        {icon && <div className="text-4xl leading-none">{icon}</div>}
        {title && (
          <div className="font-heading text-2xl comic-text-stroke-thin leading-tight">{title}</div>
        )}
        {bodyFields.map((f) => {
          const val = d[f.key];
          if (!val && val !== 0) return null;
          return (
            <div
              key={f.key}
              className="text-sm font-medium whitespace-pre-wrap bg-card/70 rounded px-2 py-1 border border-border/20"
            >
              {val}
            </div>
          );
        })}
        {numFields.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-auto pt-2">
            {numFields.map((f) => {
              const val = d[f.key];
              if (val === '' || val == null) return null;
              return (
                <span key={f.key} className="text-[10px] font-bold bg-background text-foreground px-2 py-0.5 rounded">
                  {f.label}: {val}{f.key === 'duration' || f.key === 'ultra_duration' ? '″' : ''}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}