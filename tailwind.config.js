/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // KAST Brand Colors
        primary: {
          black: '#000000',
          white: '#FFFFFF',
          purple: '#9B59B6',
          'purple-light': '#BB7EDB',
          'purple-dark': '#7B3F96',
        },
        // Semantic Colors
        background: '#000000',
        foreground: '#FFFFFF',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#000000',
        },
        border: '#9B59B6',
        input: '#FFFFFF',
        ring: '#9B59B6',
        accent: {
          DEFAULT: '#9B59B6',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#333333',
          foreground: '#CCCCCC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #9B59B6' },
          '100%': { boxShadow: '0 0 20px #9B59B6, 0 0 30px #9B59B6' },
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
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}