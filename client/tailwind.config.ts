import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
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
        DEFAULT: '10px',
        md: '8px',
        sm: '6px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(16, 32, 28, 0.04)',
        DEFAULT: '0 2px 8px rgba(16, 32, 28, 0.06), 0 1px 2px rgba(16, 32, 28, 0.04)',
        lg: '0 12px 32px -8px rgba(16, 32, 28, 0.14), 0 4px 12px rgba(16, 32, 28, 0.06)',
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
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(6px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fade-in 0.15s ease',
        spin: 'spin 0.8s linear infinite',
      },
    },
  },
  plugins: [animate],
};

export default config;
