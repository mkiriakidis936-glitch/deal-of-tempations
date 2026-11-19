/** @type {import('tailwindcss').Config} */
// ─────────────────────────────────────────────────────────────
// iOS 27 · BLACK & GOLD
// Όλες οι «χρωματιστές» παλέτες (pink, emerald, purple, cyan…) που
// χρησιμοποιούνται σε εκατοντάδες αρχεία αντικαθίστανται εδώ από
// μία χρυσή κλίμακα. Έτσι ολόκληρο το app γίνεται μαύρο & χρυσό
// χωρίς να πειραχτεί καμία οθόνη μία-μία. Το κόκκινο μένει μόνο
// ως σημασιολογικό χρώμα κινδύνου (ΣΤΟΠ, ποινές), σε iOS απόχρωση.
// ─────────────────────────────────────────────────────────────
const gold = {
  50: '#FFF9E8', 100: '#FBEFC9', 200: '#F4E0A0', 300: '#EBCB72', 400: '#E0B34A',
  500: '#C99B2E', 600: '#946D17', 700: '#7F5F18', 800: '#4F3C13', 900: '#2C2410', 950: '#17130A',
};
const iosRed = {
  50: '#FFF1F0', 100: '#FFDEDB', 200: '#FFB9B3', 300: '#FF948B', 400: '#FF6B61',
  500: '#FF453A', 600: '#E0352B', 700: '#B3261E', 800: '#7A1A15', 900: '#4A100D', 950: '#2A0907',
};
const iosGray = {
  50: '#F5F5F7', 100: '#E5E5EA', 200: '#D1D1D6', 300: '#AEAEB2', 400: '#8E8E93',
  500: '#636366', 600: '#48484A', 700: '#3A3A3C', 800: '#2C2C2E', 900: '#1C1C1E', 950: '#000000',
};
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 14px)',
      },
      // V2: no fat comic outlines anywhere — every border-2/border-4 becomes a hairline.
      borderWidth: {
        2: '1px',
        4: '1px',
      },
      colors: {
        // iOS 27 black & gold remap of Tailwind's default hues
        pink: gold, fuchsia: gold, purple: gold, violet: gold, indigo: gold, blue: gold,
        sky: gold, cyan: gold, teal: gold, emerald: gold, green: gold, lime: gold,
        yellow: gold, amber: gold, orange: gold, rose: gold,
        red: iosRed,
        gray: iosGray, slate: iosGray, zinc: iosGray, neutral: iosGray, stone: iosGray,
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: {
          1: 'hsl(var(--surface-1))',
          2: 'hsl(var(--surface-2))',
          3: 'hsl(var(--surface-3))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        tarot: {
          gold: '#E8C26B',
          wine: '#1C1C1E',
          crimson: '#1C1C1E',
          teal: '#1C1C1E',
          forest: '#1C1C1E',
          royal: '#1C1C1E',
          parchment: '#F5E9C8',
          dark: '#000000',
          sienna: '#1C1C1E',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
        display: ['var(--font-display)'],
        ui: ['var(--font-ui)'],
        mono: ['var(--font-mono)'],
      },
      letterSpacing: {
        eyebrow: '0.32em',
        label: '0.18em',
        title: '0.06em',
      },
      boxShadow: {
        panel: '0 24px 60px -32px hsl(var(--shadow-color) / 0.95), inset 0 1px 0 hsl(var(--hairline) / 0.07)',
        raised: '0 10px 26px -14px hsl(var(--shadow-color) / 0.9), inset 0 1px 0 hsl(var(--hairline) / 0.10)',
        gold: '0 0 40px -8px hsl(var(--primary) / 0.35)',
        glass: '0 1px 0 0 rgba(255,255,255,0.10) inset, 0 30px 60px -28px rgba(0,0,0,0.9)',
        inset: 'inset 0 1px 0 hsl(var(--hairline) / 0.08)',
      },
      transitionTimingFunction: {
        lux: 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
