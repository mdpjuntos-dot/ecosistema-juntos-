/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        yarbis: {
          50: '#fef3f2',
          100: '#fee4e2',
          200: '#fcccc9',
          300: '#f9a9a0',
          400: '#f47970',
          500: '#ef4444',
          600: '#dc2626',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#5f0f0f',
        },
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      animation: {
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-chat': 'bounce 1s infinite',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
  darkMode: 'class',
};
