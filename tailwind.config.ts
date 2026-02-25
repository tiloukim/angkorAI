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
        sidebar: '#f9f9f7',
        'sidebar-hover': '#efefed',
        main: '#ffffff',
        'user-bubble': '#f0f0ec',
        accent: '#10a37f',
        'accent-hover': '#0d8c6d',
        'text-main': '#1a1a1a',
        'text-sub': '#6b7280',
      },
      fontFamily: {
        khmer: ['"Noto Sans Khmer"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
