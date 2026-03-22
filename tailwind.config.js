/** @type {import('tailwindcss').Config} */

// ─────────────────────────────────────────────────────────────────────────────
// ACCENT COLOR — change this ONE value and it cascades everywhere.
// Pick any Tailwind color or use a custom hex: e.g. '#8b5cf6' for purple.
// ─────────────────────────────────────────────────────────────────────────────
const ACCENT = '#3b82f6'; // blue-500 (default)

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Accent (single source of truth) ──────────────────────────────────
        accent: {
          DEFAULT: ACCENT,
          light: adjustAlpha(ACCENT, 0.15),  // soft background tint
          muted: adjustAlpha(ACCENT, 0.6),   // subdued text/border
        },

        // ── Semantic surface tokens ───────────────────────────────────────────
        surface: {
          DEFAULT: '#ffffff',
          dark: '#0f0f0f',
          secondary: '#f5f5f5',
          'secondary-dark': '#1a1a1a',
          tertiary: '#ebebeb',
          'tertiary-dark': '#252525',
          elevated: '#ffffff',
          'elevated-dark': '#1c1c1e',
        },

        // ── Semantic text tokens ──────────────────────────────────────────────
        text: {
          primary: '#09090b',
          'primary-dark': '#fafafa',
          secondary: '#71717a',
          'secondary-dark': '#a1a1aa',
          muted: '#a1a1aa',
          'muted-dark': '#52525b',
        },

        // ── Border tokens ─────────────────────────────────────────────────────
        border: {
          DEFAULT: '#e4e4e7',
          dark: '#27272a',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};

/**
 * Naive alpha helper — for production use a proper color library.
 * Returns the hex with reduced opacity expressed as 8-digit hex.
 */
function adjustAlpha(hex, alpha) {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}
