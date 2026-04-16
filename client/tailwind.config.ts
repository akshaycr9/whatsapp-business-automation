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
      },
      fontSize: {
        // Slightly larger defaults for better readability
        base: ['16px', { lineHeight: '1.6' }],
        sm: ['14px', { lineHeight: '1.5' }],
        xs: ['12px', { lineHeight: '1.4' }],
      },
      colors: {
        // ── V2 / Stitch Material Design color palette ──────────────────
        // Namespaced under `stitch-*` to avoid any conflict with v1 shadcn tokens.
        // Usage: bg-stitch-surface, text-stitch-on-surface, etc.
        stitch: {
          surface: '#fcf8ff',
          'surface-low': '#f5f2ff',
          'surface-lowest': '#ffffff',
          'surface-container': '#efecff',
          'surface-high': '#e8e5ff',
          'surface-highest': '#e2e0fc',
          'surface-dim': '#dad7f3',
          primary: '#006d2f',
          'primary-container': '#25d366',
          'on-primary': '#ffffff',
          'on-primary-container': '#005523',
          'on-surface': '#1a1a2e',
          'on-surface-variant': '#3c4a3d',
          'on-background': '#1a1a2e',
          outline: '#6c7b6b',
          'outline-variant': '#bbcbb9',
          secondary: '#5d5c74',
          sidebar: '#1a1a2e',
        },
        // ── End V2 colors ───────────────────────────────────────────────
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
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
};

export default config;
