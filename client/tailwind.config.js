/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#0C0E1D',
          50: '#E8E9F2',
          100: '#C4C6DB',
          200: '#9DA0C1',
          300: '#777AA7',
          400: '#52568D',
          500: '#3D4073',
          600: '#2D2F59',
          700: '#1E1F3F',
          800: '#0C0E1D',
          900: '#060713',
        },
        surface: {
          DEFAULT: '#211F36',
          light: '#616083',
          lighter: '#2A2944',
        },
        accent: {
          DEFAULT: '#51FAAA',
          dark: '#29D97A',
          muted: '#7AFFBE',
        },
        magenta: {
          DEFAULT: '#FF81FF',
          dark: '#E055E0',
          muted: '#FFA8FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-mint': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(81, 250, 170, 0.05)' },
          '50%': { boxShadow: '0 0 32px rgba(81, 250, 170, 0.15)' },
        },
        'pulse-magenta': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 129, 255, 0.05)' },
          '50%': { boxShadow: '0 0 32px rgba(255, 129, 255, 0.15)' },
        },
        'shimmer-slide': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(0.5deg)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-out-to-right': {
          from: { transform: 'translateX(0)', opacity: '1' },
          to: { transform: 'translateX(100%)', opacity: '0' },
        },
        'zoom-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'zoom-out': {
          from: { transform: 'scale(1)', opacity: '1' },
          to: { transform: 'scale(0.95)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'slide-in-up': 'slide-in-up 0.6s ease-out forwards',
        'pulse-mint': 'pulse-mint 3s ease-in-out infinite',
        'pulse-magenta': 'pulse-magenta 3s ease-in-out infinite',
        'shimmer-slide': 'shimmer-slide 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-out-to-right': 'slide-out-to-right 0.3s ease-out',
        'zoom-in': 'zoom-in 0.2s ease-out',
        'zoom-out': 'zoom-out 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
