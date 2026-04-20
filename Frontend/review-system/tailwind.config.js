/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        chain: {
          bg: 'var(--bg-color)',
          card: 'var(--card-bg)',
          border: 'var(--card-border)',
          accent: 'var(--button-bg)',
          hero: 'var(--hero-bg)',
          text: 'var(--text-color)',
          header: 'var(--header-text)',
        },
      },
      boxShadow: {
        chain: 'var(--shadow)',
      },
    },
  },
  plugins: [],
};
