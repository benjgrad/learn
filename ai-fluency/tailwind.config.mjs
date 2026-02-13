import starlightPlugin from '@astrojs/starlight-tailwind';

const levelColors = {
  'level-0': { light: '#6b7280', dark: '#9ca3af' }, // Foundations - gray
  'level-1': { light: '#3b82f6', dark: '#60a5fa' }, // Casual Consumer - blue
  'level-2': { light: '#8b5cf6', dark: '#a78bfa' }, // Prompt Engineer - violet
  'level-3': { light: '#06b6d4', dark: '#22d3ee' }, // Context Engineer - cyan
  'level-4': { light: '#f97316', dark: '#fb923c' }, // AI Component Engineer - orange
  'level-5': { light: '#ef4444', dark: '#f87171' }, // AI System Engineer - red
  'level-6': { light: '#10b981', dark: '#34d399' }, // AI Platformizer - emerald
  'level-7': { light: '#ec4899', dark: '#f472b6' }, // AI Pioneer - pink
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        prose: '75ch',
      },
      colors: {
        // Learning block semantic colors
        predict: {
          light: '#f59e0b',
          DEFAULT: '#d97706',
          dark: '#b45309',
          bg: 'rgb(254 243 199 / 0.5)',
          'bg-dark': 'rgb(120 53 15 / 0.2)',
          border: '#f59e0b',
        },
        practice: {
          light: '#3b82f6',
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          bg: 'rgb(219 234 254 / 0.5)',
          'bg-dark': 'rgb(30 58 138 / 0.2)',
          border: '#3b82f6',
        },
        reflect: {
          light: '#8b5cf6',
          DEFAULT: '#7c3aed',
          dark: '#6d28d9',
          bg: 'rgb(237 233 254 / 0.5)',
          'bg-dark': 'rgb(76 29 149 / 0.2)',
          border: '#8b5cf6',
        },
        connect: {
          light: '#10b981',
          DEFAULT: '#059669',
          dark: '#047857',
          bg: 'rgb(209 250 229 / 0.5)',
          'bg-dark': 'rgb(6 78 59 / 0.2)',
          border: '#10b981',
        },
        ...Object.fromEntries(
          Object.entries(levelColors).map(([key, val]) => [key, val])
        ),
      },
    },
  },
  plugins: [starlightPlugin()],
};
