/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        ink: {
          900: '#0E0F14',
          700: '#1B1D24',
          500: '#3A3F4C',
          400: '#5C6275',
          300: '#7B8198',
          200: '#B5BACA',
          100: '#D9DCE5',
        },
      },
      backgroundImage: {
        'gradient-sunset': 'linear-gradient(135deg, #FF8A65 0%, #FF6B9D 55%, #C56CF0 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #4FC3F7 0%, #5C7AEA 55%, #7B61FF 100%)',
        'gradient-mint': 'linear-gradient(135deg, #6EE7B7 0%, #34D399 55%, #06B6D4 100%)',
        'gradient-lavender': 'linear-gradient(135deg, #C7B4FF 0%, #FFB4E6 55%, #FFD4A3 100%)',
        'glass-light': 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(20,20,30,0.55) 0%, rgba(20,20,30,0.25) 100%)',
      },
      boxShadow: {
        'glass-sm': '0 4px 16px rgba(20,20,30,0.06), inset 0 1px 0 rgba(255,255,255,0.35)',
        'glass-md': '0 8px 32px rgba(20,20,30,0.10), inset 0 1px 0 rgba(255,255,255,0.40)',
        'glass-lg': '0 20px 60px rgba(20,20,30,0.18), inset 0 1px 0 rgba(255,255,255,0.45)',
        'phone': '0 40px 100px rgba(0,0,0,0.45), 0 16px 40px rgba(0,0,0,0.25)',
        'press': '0 2px 8px rgba(20,20,30,0.10), inset 0 1px 0 rgba(255,255,255,0.30)',
      },
      backdropBlur: {
        xs: '4px',
        '4xl': '64px',
      },
      backdropSaturate: {
        180: '1.8',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-ios': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
