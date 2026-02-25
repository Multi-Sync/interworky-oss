/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/_common/**/*.{js,ts,jsx,tsx,mdx}', // We are going to need this for common components
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'interworky-gradient': 'linear-gradient(to bottom right, #058A7C, #FCD966)',
      },
      colors: {
        primary: '#058A7C',
        popupOverlay: '#D9D9D999',
        secondary: '#000000',
        'secondary-light': '#00000099',
        tertiary: '#908E8E',
        'primary-light': '#E1F1EF',
        // Dark mode colors (existing)
        'app-bg': '#0a0a0a',
        surface: '#171717',
        'surface-elevated': '#1f1f1f',
        'border-default': '#262626',
        'border-subtle': '#404040',
        // Light mode colors (new)
        'app-bg-light': '#f9fafb',
        'surface-light': '#ffffff',
        'surface-elevated-light': '#f3f4f6',
        'border-default-light': '#e5e7eb',
        'border-subtle-light': '#f3f4f6',
        // Analytics backgrounds
        'analytics-dark': '#0a0e27',
        'analytics-light': '#f8fafc',
        // Performance backgrounds
        'performance-dark': '#0a0e27',
        'performance-light': '#f8fafc',
      },
      fontSize: {
        title: '1.5rem',
        body: '0.875rem',
        subTitle: '1.25rem',
      },
      fontWeight: {
        semiBold: '600',
      },
      boxShadow: {
        assistantinfoShadow: '0 0 5px #D9D9D9',
      },
      fontFamily: {
        Readex: ['Readex Pro', 'sans-serif'],
        Inter: ['Inter', 'sans-serif'],
        Outfit: ['Outfit', 'sans-serif'],
        'Cabinet-Grotesk': ['Cabinet Grotesk', 'sans-serif'],
        Futura: ['Futura', 'sans-serif'],
        'Albert-Sans': ['Albert Sans', 'sans-serif'],
        DynaPuff: ['DynaPuff', 'cursive'],
        'Nunito-Sans': ['Nunito Sans', 'sans-serif'],
        sans: ['Nunito Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        rainbowLetterTrail: {
          '0%': { color: 'rgba(255, 0, 150, 1)' },
          '50%': { color: 'rgba(255, 128, 0, 0.75)' },
          '100%': { color: 'rgba(0, 0, 0, 1)' },
        },
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeSlideUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        rainbowLetterTrail: 'rainbowLetterTrail 1s ease-in-out backwards',
        shine: 'shine 2s infinite',
        'fade-slide-up': 'fadeSlideUp 0.5s ease-out forwards',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss/plugin')(function ({ addUtilities }) {
      addUtilities({
        '.scrollbar': {
          '&::-webkit-scrollbar': {
            width: '8px',
            marginTop: '22px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#525252',
            minHeight: '70px',
            borderRadius: '4px',
            cursor: 'auto',
            marginTop: '22px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#737373',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#262626',
            borderRadius: '4px',
            marginTop: '20px',
            marginBottom: '20px',
          },
        },
      });
    }),
  ],
};
