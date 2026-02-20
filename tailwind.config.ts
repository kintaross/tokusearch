import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: "#D48166",
        "accent-brown": "#5C5248",
        "warm-cream": "#F9F6F2",
        "soft-greige": "#EFEAE4",
        "background-light": "#FAF9F6",
        "tag-saving": "#8A9A5B",
        brand: {
          50: '#e6f8f4',
          100: '#c2eee4',
          200: '#9ce3d3',
          300: '#6fd4be',
          400: '#42c4a9',
          500: '#27b593',
          600: '#1e9277',
          700: '#16705a',
          800: '#0f4d3e',
          900: '#082b22',
        },
        surface: {
          50: '#fdfcf9',
          100: '#f7f5f2',
          200: '#eeeae3',
        },
      },
      fontFamily: {
        display: ["var(--font-quicksand)", "var(--font-noto-sans-jp)", "sans-serif"],
        sans: ["var(--font-quicksand)", "var(--font-noto-sans-jp)", '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Meiryo', 'Yu Gothic', 'YuGothic', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: "1rem",
        "xl": "1.5rem",
        "2xl": "2rem",
        "3xl": "2.5rem",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
