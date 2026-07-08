import type { ViewStyle } from "react-native";

/** JS-accessible design tokens that mirror tailwind.config.js.
 *  Brand colors follow the web frontend: primary = green (#0F9D6E),
 *  secondary = light slate (#F1F5F9). Red for dues/alerts. */
export const theme = {
  color: {
    primary: "#0F9D6E", // frontend --primary (hsl 160 82% 34%): buttons / active / CTAs
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
