import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';
import plugin from 'tailwindcss/plugin';

// ── Design tokens — single source of truth ──────────────────────────
const designTokens = {
  light: {
    background: '90 4% 96%',
    foreground: '165 14% 12%',
    'outer-bg': '90 6% 80%',
    card: '0 0% 100%',
    'card-foreground': '165 14% 12%',
    popover: '0 0% 100%',
    'popover-foreground': '165 14% 12%',
    primary: '172 74% 27%',
    'primary-foreground': '0 0% 100%',
    secondary: '90 7% 93%',
    'secondary-foreground': '165 10% 25%',
    muted: '90 7% 93%',
    'muted-foreground': '165 5% 44%',
    accent: '163 41% 94%',
    'accent-foreground': '172 74% 20%',
    destructive: '350 49% 44%',
    'destructive-foreground': '0 0% 100%',
    border: '90 10% 89%',
    input: '90 10% 89%',
    ring: '172 74% 27%',
    radius: '0.625rem',
    'sidebar-width': '16rem',
    'sidebar-width-collapsed': '4rem',
    'header-height': '3.5rem',
    // Chatflo design tokens (used in hardcoded styles)
    'cf-surface': '#ffffff',
    'cf-surface-2': '#fbfcfa',
    'cf-surface-sunken': '#eff1ed',
    'cf-border': '#e3e6e0',
    'cf-border-strong': '#c9cec4',
    // Brand colors
    'brand-900': '#07332e',
    'brand-800': '#0b5d54',
    'brand-700': '#107a6d',
    'brand-600': '#128c7e',
    'brand-500': '#17a398',
    'brand-400': '#3fbfae',
    'brand-300': '#8ddccd',
    'brand-200': '#c6ebe2',
    'brand-100': '#e7f5f1',
    'brand-050': '#f2faf7',
    // Ink colors
    'ink-900': '#1b2420',
    'ink-700': '#3a4641',
    'ink-500': '#6b7671',
    'ink-400': '#8a948f',
    'ink-300': '#b4bcb7',
    // Accent colors
    'accent-amber': '#b5790a',
    'accent-amber-bg': '#fcf3dd',
    'accent-rose': '#a9384d',
    'accent-rose-bg': '#fbe5e8',
    'accent-violet': '#5b4bb5',
    'accent-violet-bg': '#eae6fb',
    // Shadows
    'shadow-sm-cf': '0 1px 2px rgba(16, 32, 28, 0.04)',
    'shadow-cf': '0 2px 8px rgba(16, 32, 28, 0.06), 0 1px 2px rgba(16, 32, 28, 0.04)',
    'shadow-lg-cf': '0 12px 32px -8px rgba(16, 32, 28, 0.14), 0 4px 12px rgba(16, 32, 28, 0.06)',
  },
  dark: {
    background: '165 25% 7%',
    'outer-bg': '165 22% 4%',
    foreground: '130 7% 92%',
    card: '165 20% 10%',
    'card-foreground': '130 7% 92%',
    popover: '165 20% 10%',
    'popover-foreground': '130 7% 92%',
    primary: '172 74% 35%',
    'primary-foreground': '0 0% 100%',
    secondary: '165 16% 16%',
    'secondary-foreground': '130 7% 76%',
    muted: '165 20% 10%',
    'muted-foreground': '165 5% 55%',
    accent: '165 40% 11%',
    'accent-foreground': '163 41% 75%',
    destructive: '350 49% 55%',
    'destructive-foreground': '0 0% 100%',
    border: '165 16% 16%',
    input: '165 16% 16%',
    ring: '172 74% 35%',
    // Chatflo design tokens (dark mode)
    'cf-surface': '#161e1a',
    'cf-surface-2': '#1a2420',
    'cf-surface-sunken': '#242e29',
    'cf-border': '#242e29',
    'cf-border-strong': '#3a4641',
    // Brand colors (no change for dark mode)
    'brand-900': '#07332e',
    'brand-800': '#0b5d54',
    'brand-700': '#107a6d',
    'brand-600': '#128c7e',
    'brand-500': '#17a398',
    'brand-400': '#3fbfae',
    'brand-300': '#8ddccd',
    'brand-200': '#c6ebe2',
    'brand-100': '#e7f5f1',
    'brand-050': '#f2faf7',
    // Ink colors (light for dark mode)
    'ink-900': '#ebefec',
    'ink-700': '#a8b4b0',
    'ink-500': '#7a8582',
    'ink-400': '#5a6460',
    'ink-300': '#404a46',
    // Accent colors (no change for dark mode)
    'accent-amber': '#b5790a',
    'accent-amber-bg': '#fcf3dd',
    'accent-rose': '#a9384d',
    'accent-rose-bg': '#fbe5e8',
    'accent-violet': '#5b4bb5',
    'accent-violet-bg': '#eae6fb',
    // Shadows (no change for dark mode)
    'shadow-sm-cf': '0 1px 2px rgba(16, 32, 28, 0.04)',
    'shadow-cf': '0 2px 8px rgba(16, 32, 28, 0.06), 0 1px 2px rgba(16, 32, 28, 0.04)',
    'shadow-lg-cf': '0 12px 32px -8px rgba(16, 32, 28, 0.14), 0 4px 12px rgba(16, 32, 28, 0.06)',
  },
};

// ── Tailwind plugin to generate CSS variables from design tokens ──────
const generateCssVariables = plugin(function ({ addBase }) {
  const lightVars: Record<string, string> = {};
  const darkVars: Record<string, string> = {};

  Object.entries(designTokens.light).forEach(([key, value]) => {
    lightVars[`--${key}`] = value;
  });

  Object.entries(designTokens.dark).forEach(([key, value]) => {
    darkVars[`--${key}`] = value;
  });

  addBase({
    ':root': lightVars,
    '.dark': darkVars,
    '#root': {
      'max-width': '1920px',
      margin: '0 auto',
      height: '100vh',
      overflow: 'hidden',
      background: 'hsl(var(--background))',
    },
  });
});

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        base: ['14px', { lineHeight: '1.5' }],
        sm: ['13px', { lineHeight: '1.5' }],
        xs: ['12px', { lineHeight: '1.4' }],
      },
      colors: {
        // ── Chatflo brand palette (teal-green family) ──────────────────
        brand: {
          '900': '#07332e',
          '800': '#0b5d54',
          '700': '#107a6d',
          '600': '#128c7e',
          '500': '#17a398',
          '400': '#3fbfae',
          '300': '#8ddccd',
          '200': '#c6ebe2',
          '100': '#e7f5f1',
          '050': '#f2faf7',
        },
        // ── Ink (text) scale ───────────────────────────────────────────
        ink: {
          '900': '#1b2420',
          '700': '#3a4641',
          '500': '#6b7671',
          '400': '#8a948f',
          '300': '#b4bcb7',
        },
        // ── Surface tokens ─────────────────────────────────────────────
        surface: {
          '2': '#fbfcfa',
          sunken: '#eff1ed',
        },
        // ── Accent colors ──────────────────────────────────────────────
        'accent-amber': '#b5790a',
        'accent-amber-bg': '#fcf3dd',
        'accent-rose': '#a9384d',
        'accent-rose-bg': '#fbe5e8',
        'accent-violet': '#5b4bb5',
        'accent-violet-bg': '#eae6fb',
        // ── shadcn/ui HSL tokens (keep unchanged) ─────────────────────
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        xl: '20px',
        lg: '14px',
        sm: '6px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(16, 32, 28, 0.04)',
        lg: '0 12px 32px -8px rgba(16, 32, 28, 0.14), 0 4px 12px rgba(16, 32, 28, 0.06)',
      },
      keyframes: {
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(6px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'scale-in': 'scale-in 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fade-in 0.15s ease',
      },
    },
  },
  plugins: [animate, generateCssVariables],
};

export default config;
