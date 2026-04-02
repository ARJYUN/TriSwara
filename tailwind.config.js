/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#0f0f14',
          50: '#1a1a24',
          100: '#16161f',
          200: '#12121a',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e0c070',
          dark: '#a07830',
        },
        indigo: {
          swara: '#4338ca',
        },
        emerald: {
          swara: '#059669',
        },
        amber: {
          swara: '#d97706',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        mono: ['Source Code Pro', 'monospace'],
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
