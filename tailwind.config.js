/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cinema: {
          bg: '#080818',
          card: '#0f0f28',
          border: '#1e1e40',
          muted: '#2a2a50',
        },
      },
      backgroundImage: {
        'cinema-gradient': 'linear-gradient(135deg, #080818 0%, #0d0d22 100%)',
      },
    },
  },
  plugins: [],
};
