export const GLOBAL_DESIGN_KEY = 'admin_global_design';

export const GLOBAL_DESIGN_DEFAULTS = {
  background: '#120f12',
  foreground: '#eee8dc',
  card: '#211b21',
  primary: '#d5b36a',
  accent: '#8f7041',
  border: '#66543c',
  heading: 'Cinzel',
  body: 'Cormorant Garamond',
  display: 'Cinzel Decorative',
  ui: 'Inter',
};

function hexToHsl(hex) {
  if (typeof hex !== 'string') return null;
  const value = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;

  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);

    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue /= 6;
  }

  return {
    css: `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`,
    lightness,
  };
}

function contrastForeground(color) {
  if (!color) return '0 0% 100%';
  return color.lightness > 0.58 ? '0 0% 8%' : '0 0% 98%';
}

export function applySavedGlobalDesign(value) {
  if (!value || typeof value !== 'object') return;

  const design = { ...GLOBAL_DESIGN_DEFAULTS, ...value };
  const colors = Object.fromEntries(
    ['background', 'foreground', 'card', 'primary', 'accent', 'border']
      .map((key) => [key, hexToHsl(design[key])])
  );

  if (Object.values(colors).some((color) => !color)) return;

  const root = document.documentElement;
  const vars = {
    '--background': colors.background.css,
    '--foreground': colors.foreground.css,
    '--card': colors.card.css,
    '--card-foreground': colors.foreground.css,
    '--popover': colors.card.css,
    '--popover-foreground': colors.foreground.css,
    '--primary': colors.primary.css,
    '--primary-foreground': contrastForeground(colors.primary),
    '--secondary': colors.card.css,
    '--secondary-foreground': colors.foreground.css,
    '--muted': colors.card.css,
    '--muted-foreground': colors.foreground.css,
    '--accent': colors.accent.css,
    '--accent-foreground': contrastForeground(colors.accent),
    '--border': colors.border.css,
    '--input': colors.background.css,
    '--ring': colors.primary.css,
    '--chart-1': colors.primary.css,
    '--chart-2': colors.accent.css,
    '--chart-3': colors.border.css,
    '--chart-4': colors.foreground.css,
    '--chart-5': colors.card.css,
    '--surface-1': colors.background.css,
    '--surface-2': colors.card.css,
    '--surface-3': colors.accent.css,
    '--hairline': colors.foreground.css,
    '--shadow-color': colors.background.css,
    '--sidebar-background': colors.background.css,
    '--sidebar-foreground': colors.foreground.css,
    '--sidebar-primary': colors.primary.css,
    '--sidebar-primary-foreground': contrastForeground(colors.primary),
    '--sidebar-accent': colors.card.css,
    '--sidebar-accent-foreground': colors.foreground.css,
    '--sidebar-border': colors.border.css,
    '--sidebar-ring': colors.primary.css,
  };

  Object.entries(vars).forEach(([name, token]) => root.style.setProperty(name, token));
  root.style.setProperty('--font-heading', `'${design.heading}', Georgia, 'Times New Roman', serif`);
  root.style.setProperty('--font-body', `'${design.body}', Georgia, 'Times New Roman', serif`);
  root.style.setProperty('--font-display', `'${design.display}', Georgia, 'Times New Roman', serif`);
  root.style.setProperty('--font-ui', `'${design.ui}', ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`);
}
