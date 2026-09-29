import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#05080f',
          900: '#080d16',
          850: '#0b111d',
          800: '#0e1524',
          750: '#121a2b',
          700: '#182238',
          600: '#223050',
          500: '#2e4066',
        },
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(148,163,184,0.06) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        'panel-hover': '0 1px 0 0 rgba(148,163,184,0.08) inset, 0 16px 40px -16px rgba(0,0,0,0.7)',
        glow: '0 0 0 1px rgba(34,211,238,0.25), 0 0 24px -6px rgba(34,211,238,0.25)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)',
      },
      keyframes: {
        'flow-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'indeterminate': {
          '0%': { left: '-40%', width: '40%' },
          '50%': { left: '30%', width: '55%' },
          '100%': { left: '100%', width: '40%' },
        },
      },
      animation: {
        'flow-down': 'flow-down 2.4s linear infinite',
        'pulse-soft': 'pulse-soft 2.2s ease-in-out infinite',
        'fade-up': 'fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        indeterminate: 'indeterminate 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
