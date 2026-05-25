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
          xs:     'rgba(255,255,255,0.06)',
          sm:     'rgba(255,255,255,0.09)',
          md:     'rgba(255,255,255,0.13)',
          lg:     'rgba(255,255,255,0.18)',
          xl:     'rgba(255,255,255,0.24)',
          white:  'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.12)',
          hover:  'rgba(255,255,255,0.13)',
          strong: 'rgba(255,255,255,0.18)',
        },
        brand: {
          purple: '#6366f1',
          violet: '#8b5cf6',
          glow:   'rgba(99,102,241,0.35)',
        },
      },
      backdropBlur: {
        xs:    '4px',
        sm:    '8px',
        glass: '28px',
        lg:    '40px',
        xl:    '60px',
      },
      backdropSaturate: {
        160: '1.6',
        180: '1.8',
        200: '2.0',
      },
      boxShadow: {
        glass:  '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glass-lg': '0 12px 48px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.16)',
        glow:   '0 0 24px rgba(99,102,241,0.35)',
        'glow-lg': '0 0 40px rgba(99,102,241,0.50)',
        card:   '0 4px 24px rgba(0,0,0,0.28), 0 1px 4px rgba(0,0,0,0.16)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring':   'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-up':   'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1) forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp:   { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        glowPulse: { '0%, 100%': { boxShadow: '0 0 12px rgba(99,102,241,0.30)' }, '50%': { boxShadow: '0 0 28px rgba(99,102,241,0.60)' } },
      },
    },
  },
  plugins: [],
}

export default config
