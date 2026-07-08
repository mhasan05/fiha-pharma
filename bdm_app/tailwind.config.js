/** @type {import('tailwindcss').Config} */
// Brand from the web frontend: primary = green (#0F9D6E), secondary = light
// slate (#F1F5F9). Red for dues/alerts, violet as a status accent.
// Note: primary-50/100 are kept as neutral slate (= secondary) so subtle
// surfaces (chips, search, secondary buttons, active tab pill) read neutral.
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F9D6E",
          // 50/100 are the neutral slate surfaces (chips, search, active pill) —
          // theme-aware so they darken in dark mode.
          50: "rgb(var(--c-neutral-50) / <alpha-value>)",
          100: "rgb(var(--c-neutral-100) / <alpha-value>)",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#0F9D6E",
          600: "#0C8259",
          700: "#0A6B4A",
          800: "#075E42",
          900: "#053D2B",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "rgb(var(--c-neutral-50) / <alpha-value>)",
          foreground: "rgb(var(--c-ink) / <alpha-value>)",
        },
        // Neutral slate ramp — theme-aware via CSS variables.
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          soft: "rgb(var(--c-ink-soft) / <alpha-value>)",
          muted: "rgb(var(--c-ink-muted) / <alpha-value>)",
          faint: "rgb(var(--c-ink-faint) / <alpha-value>)",
        },
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        border: "rgb(var(--c-border) / <alpha-value>)",
        "border-strong": "rgb(var(--c-border-strong) / <alpha-value>)",

        success: { DEFAULT: "#16A34A", soft: "#DCFCE7" },
        warning: { DEFAULT: "#D97706", soft: "#FEF3C7" },
        danger: { DEFAULT: "#E11D48", soft: "#FFE4E6" },
        info: { DEFAULT: "#2563EB", soft: "#DBEAFE" },
        violet: { DEFAULT: "#0C8259", soft: "#D1FAE5" },
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "26px",
      },
    },
  },
  plugins: [],
};
