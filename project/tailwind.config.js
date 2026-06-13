/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        opera: {
          bg: '#0B0F19',
          surface: '#111827',
          card: '#1A1F35',
          border: '#2A3050',
          muted: '#7B83A6',
          text: '#E2E4EE',
          indigo: '#6366F1',
          'indigo-light': '#818CF8',
          mint: '#4EEAAC',
          'mint-light': '#6FFFC8',
          warm: '#F59E0B',
          rose: '#F472B6',
          sage: '#A8B5A2',
          'sage-light': '#C4D1BE',
          'sage-dark': '#6B7A65',
          slate: '#64748B',
          'slate-light': '#94A3B8',
          'slate-dark': '#334155',
          chat: {
            bg: '#0E1117',
            header: '#151921',
            bubble: '#1C2230',
            'bubble-self': '#1A2B25',
            input: '#151921',
            online: '#4EEAAC',
          },
        },
      },
      backgroundImage: {
        'gradient-indigo-mint': 'linear-gradient(135deg, #6366F1 0%, #4EEAAC 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glow-indigo': '0 0 24px rgba(99, 102, 241, 0.2)',
        'glow-mint': '0 0 24px rgba(78, 234, 172, 0.2)',
      },
    },
  },
  plugins: [],
};
