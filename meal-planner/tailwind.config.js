/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16231F', spruce: { DEFAULT: '#1F6F5C', dark: '#154D40', soft: '#DCEBE5' },
        mustard: { DEFAULT: '#E0A526', soft: '#FBF0D2' }, paper: '#F3F6F4', line: '#D3DED8', berry: '#A13D63',
      },
      fontFamily: { sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'] },
    },
  },
  plugins: [],
};
