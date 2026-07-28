/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Google Sans', 'Inter', 'system-ui', 'Arial', 'sans-serif'],
        },
        colors: {
          gem: {
            blue: '#1a73e8',
            purple: '#9b72cb',
            pink: '#d96570',
            bg: '#f0f3f9',
            surface: '#ffffff',
            dark: '#1e1f1f',
            darkSurface: '#282a2a',
            darkBorder: '#3c4043',
            border: '#e0e3e3',
            muted: '#444746',
          },
        },
        animation: {
          'fade-in': 'fadeIn 0.3s ease-out',
          'slide-up': 'slideUp 0.3s ease-out',
        },
        keyframes: {
          fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
          slideUp: {
            '0%': { opacity: '0', transform: 'translateY(8px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
        },
      },
    },
    plugins: [],
  };
  