module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        'gothic': ['"Century Gothic"', 'sans-serif'],
      },
      animation: {
        'fade': 'fadeInOut 1s ease-in-out infinite',
      },
      keyframes: {
        fadeInOut: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
