import { PAJAMA_ACTS } from '@/data/pajamaProgram';

function atmosphere({ label, accent, base, curtain, curtainDark, cardBg }) {
  return {
    label,
    accent,
    base,
    curtain,
    curtainDark,
    cardBg,
    stage: `radial-gradient(ellipse 72% 55% at 50% -10%, ${accent}59, transparent 70%)`,
    border: `${accent}73`,
    accentSoft: `${accent}1f`,
    text: '#f7ecd8',
    dim: 'rgba(247,236,216,.6)',
  };
}

export const PAJAMA_ATMOSPHERE = {
  act1: atmosphere({
    label: 'ΚΕΧΡΙΜΠΑΡΙ & ΒΕΛΟΥΔΟ',
    accent: '#e8b464',
    base: '#140a06',
    curtain: 'rgba(96,32,14,.92)',
    curtainDark: 'rgba(38,12,6,.96)',
    cardBg: 'linear-gradient(160deg, rgba(56,30,12,.95), rgba(16,9,5,.97))',
  }),
  act2: atmosphere({
    label: 'ΑΣΗΜΙ & ΚΑΘΡΕΦΤΕΣ',
    accent: '#cfdcea',
    base: '#080b12',
    curtain: 'rgba(26,36,54,.92)',
    curtainDark: 'rgba(8,12,20,.96)',
    cardBg: 'linear-gradient(160deg, rgba(26,34,48,.95), rgba(8,10,16,.97))',
  }),
  act3: atmosphere({
    label: 'ΚΟΚΚΙΝΗ ΔΙΚΗ',
    accent: '#e26a6a',
    base: '#120508',
    curtain: 'rgba(104,16,24,.92)',
    curtainDark: 'rgba(38,6,10,.96)',
    cardBg: 'linear-gradient(160deg, rgba(58,14,20,.95), rgba(16,5,8,.97))',
  }),
  act4: atmosphere({
    label: 'ΜΠΟΡΝΤΟ & ΧΡΥΣΟΣ',
    accent: '#d9a94a',
    base: '#100509',
    curtain: 'rgba(72,14,36,.92)',
    curtainDark: 'rgba(30,6,16,.96)',
    cardBg: 'linear-gradient(160deg, rgba(52,16,30,.95), rgba(16,6,12,.97))',
  }),
  act5: atmosphere({
    label: 'ΠΑΓΕΡΟ ΞΥΠΝΗΜΑ',
    accent: '#93cfe6',
    base: '#06131a',
    curtain: 'rgba(20,48,62,.9)',
    curtainDark: 'rgba(6,16,22,.96)',
    cardBg: 'linear-gradient(160deg, rgba(18,38,48,.95), rgba(6,14,20,.97))',
  }),
  act6: atmosphere({
    label: 'ΠΡΩΙΝΟ ΤΡΑΠΕΖΙ',
    accent: '#f2c884',
    base: '#14100a',
    curtain: 'rgba(96,70,26,.9)',
    curtainDark: 'rgba(34,26,10,.96)',
    cardBg: 'linear-gradient(160deg, rgba(52,40,18,.95), rgba(18,14,8,.97))',
  }),
  act7: atmosphere({
    label: 'ΧΡΥΣΟ ΔΩΡΟ',
    accent: '#ffd700',
    base: '#0d0713',
    curtain: 'rgba(52,22,74,.92)',
    curtainDark: 'rgba(20,8,28,.96)',
    cardBg: 'linear-gradient(160deg, rgba(38,20,52,.95), rgba(14,7,20,.97))',
  }),
};

export function getAtmosphere(actIndex = 0) {
  const act = PAJAMA_ACTS[Math.min(Math.max(actIndex || 0, 0), PAJAMA_ACTS.length - 1)];
  return PAJAMA_ATMOSPHERE[act.id] || PAJAMA_ATMOSPHERE.act1;
}
