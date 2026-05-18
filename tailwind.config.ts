import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          white:  'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.10)',
          hover:  'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.14)',
        },
        brand: {
          purple: '#6366f1',
          violet: '#8b5cf6',
          glow:   'rgba(99,102,241,0.35)',
        },
      },
      backdropBlur: {
        xs: '4px',
        glass: '24px',
      },
      boxShadow: {
        glass:  '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
        glow:   '0 0 24px rgba(99,102,241,0.30)',
        card:   '0 2px 12px rgba(0,0,0,0.20)',
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease',
        'slide-up':  'slideUp 0.3s ease',
        'pulse-slow':'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}

export default config
