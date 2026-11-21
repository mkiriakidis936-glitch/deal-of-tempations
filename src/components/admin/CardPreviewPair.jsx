import React from 'react';
import GameCard from '@/components/shared/GameCard';

export function cardFromItem(item, fallbackKicker) {
  if (typeof item === 'string') return { title: '', text: item, kicker: fallbackKicker };
  const data = item || {};
  return {
    title: data.title || data.name || data.label || data.say || data.question || '',
    text: data.text || data.desc || data.description || data.detail || data.challenge || data.where || data.hint || '',
    icon: data.icon,
    image: data.image,
    secs: data.secs || data.duration || data.timer,
    reward: data.reward || data.success,
    kicker: fallbackKicker,
  };
}

export default function CardPreviewPair({ card, accent = '#E8C26B' }) {
  const foot = card.secs ? `⏱ ${card.secs}″` : '';
  const badge = card.reward ? `+${card.reward}` : null;
  return (
    <div className="grid gap-3">
      <div>
        <div className="mb-1 text-[11px] font-bold text-foreground/60">📱 Κινητό</div>
        <div className="max-w-[230px] rounded-[26px] border-4 border-[#2c2c2e] bg-black p-2">
          <GameCard variant="compact" kicker={card.kicker} icon={card.icon} image={card.image} accent={accent} title={card.title} text={card.text} footLeft={foot} footRight={badge} />
        </div>
      </div>
      <div>
        <div className="mb-1 text-[11px] font-bold text-foreground/60">📺 TV</div>
        <div className="relative aspect-video max-w-[420px] overflow-hidden rounded-xl border border-border bg-black">
          <div className="absolute left-1/2 top-1/2 w-[460px] origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.33]">
            <GameCard variant="tv" kicker={card.kicker} icon={card.icon} image={card.image} accent={accent} title={card.title} text={card.text} footLeft={foot} footRight={badge} />
          </div>
        </div>
      </div>
    </div>
  );
}
