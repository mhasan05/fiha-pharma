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
          50: "#F1F5F9",
          100: "#E2E8F0",
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
          DEFAULT: "#F1F5F9", // frontend --secondary
          foreground: "#0F172A", // frontend --secondary-foreground
        },
        // Neutral slate ramp for text, surfaces, borders (matches frontend).
        ink: {
          DEFAULT: "#0F172A", // primary text
          soft: "#334155",
          muted: "#64748B", // secondary text
          faint: "#94A3B8", // tertiary text / placeholders
        },
        surface: "#FFFFFF",
        canvas: "#FAFAFA", // app background
        border: "#E9EDF2",
        "border-strong": "#DCE2EA",

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
