import { vars } from "nativewind";
import { createContext, useContext } from "react";
import type { ViewStyle } from "react-native";

/** JS-accessible design tokens that mirror tailwind.config.js.
 *  Brand colors follow the web frontend: primary = green (#0F9D6E),
 *  secondary = light slate (#F1F5F9). Red for dues/alerts. */
export const theme = {
  color: {
    primary: "#0F9D6E", // frontend --primary (green): buttons / active / CTAs
    primary600: "#0C8259",
    primary50: "#F1F5F9", // frontend --secondary: subtle neutral surfaces
    primary100: "#E2E8F0",
    secondary: "#F1F5F9", // frontend --secondary
    secondaryFg: "#0F172A", // frontend --secondary-foreground
    ink: "#0F172A",
    inkSoft: "#334155",
    inkMuted: "#64748B",
    inkFaint: "#94A3B8",
    surface: "#FFFFFF",
    canvas: "#FAFAFA",
    border: "#E9EDF2",
    borderStrong: "#DCE2EA",
    success: "#16A34A",
    successSoft: "#DCFCE7",
    warning: "#D97706",
    warningSoft: "#FEF3C7",
    danger: "#E11D48", // red — dues / outstanding / destructive
    dangerSoft: "#FFE4E6",
    info: "#2563EB",
    infoSoft: "#DBEAFE",
    violet: "#0C8259", // status accent (e.g. "Awaiting Pickup")
    violetSoft: "#D1FAE5",
    white: "#FFFFFF",
  },
} as const;

/** Dark-mode overrides for the theme-aware (non-brand) colors. */
const darkColor = {
  ...theme.color,
  ink: "#F1F3F7",
  inkSoft: "#CBD5E1",
  inkMuted: "#94A3B8",
  inkFaint: "#717A8A",
  surface: "#1E2026",
  canvas: "#121317",
  border: "#2D3037",
  borderStrong: "#3E424B",
  primary50: "#272A31",
  primary100: "#33373F",
  secondary: "#272A31",
} as const;

export type ColorPalette = { [K in keyof typeof theme.color]: string };

/** The JS color palette for a theme mode. */
export function paletteFor(mode: "light" | "dark"): ColorPalette {
  return mode === "dark" ? darkColor : theme.color;
}

/** Single source of truth for JS colors, provided by ThemeRoot from the
 *  persisted preference (prefsStore.mode) — NOT from the system scheme — so
 *  JS colors (useColors) and CSS-variable classes never drift apart. */
export const ThemeContext = createContext<ColorPalette>(theme.color);

/**
 * Runtime CSS-variable maps applied on a root <View> so the semantic
 * `bg-surface` / `text-ink` / … classes actually switch theme ON NATIVE.
 * (NativeWind does not apply `.dark`-overridden CSS variables from a stylesheet
 * on native — only on web — so we set them at runtime here. Values mirror
 * global.css.)
 */
export const themeVars = {
  light: vars({
    "--c-canvas": "250 250 250",
    "--c-surface": "255 255 255",
    "--c-ink": "15 23 42",
    "--c-ink-soft": "51 65 85",
    "--c-ink-muted": "100 116 139",
    "--c-ink-faint": "148 163 184",
    "--c-border": "233 237 242",
    "--c-border-strong": "220 226 234",
    "--c-neutral-50": "241 245 249",
    "--c-neutral-100": "226 232 240",
  }),
  dark: vars({
    "--c-canvas": "18 19 23",
    "--c-surface": "30 32 38",
    "--c-ink": "241 243 247",
    "--c-ink-soft": "203 213 225",
    "--c-ink-muted": "148 163 184",
    "--c-ink-faint": "113 122 138",
    "--c-border": "45 48 55",
    "--c-border-strong": "62 66 75",
    "--c-neutral-50": "39 42 49",
    "--c-neutral-100": "51 55 63",
  }),
};

/** Reactive color palette for JS color props (e.g. Ionicons `color`). Reads the
 *  palette from ThemeContext (driven by prefsStore.mode), so it always matches
 *  the CSS-variable classes. */
export function useColors(): ColorPalette {
  return useContext(ThemeContext);
}

/** Gradient stops for hero cards. */
export const gradient = {
  due: ["#EC5B5B", "#C0392B"] as const, // red "Total Outstanding" hero
  collection: ["#0C8259", "#0A6B4A"] as const, // deep green "Today's Collection" hero (brand family)
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;

/** Soft, minimal elevation presets. */
export const shadow = {
  xs: {
    shadowColor: "#18181B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  } satisfies ViewStyle,
  sm: {
    shadowColor: "#18181B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
  md: {
    shadowColor: "#18181B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  } satisfies ViewStyle,
  hero: {
    shadowColor: "#18181B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 7,
  } satisfies ViewStyle,
  primary: {
    shadowColor: "#18181B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  } satisfies ViewStyle,
  up: {
    shadowColor: "#18181B",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 16,
  } satisfies ViewStyle,
} as const;
