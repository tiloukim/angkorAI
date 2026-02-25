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
        sidebar: '#171717',
        'sidebar-hover': '#2a2a2a',
        main: '#212121',
        'user-bubble': '#2f2f2f',
        accent: '#10a37f',
        'accent-hover': '#0d8c6d',
      },
      fontFamily: {
        khmer: ['"Noto Sans Khmer"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
