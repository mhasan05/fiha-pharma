import { theme } from "@/theme";

/** Brand + semantic colors for non-className props (StatusBar, ActivityIndicator
 *  tint, navigation theme). Mirrors the design tokens in src/theme.ts. */
export const Colors = {
  primary: theme.color.primary,
  primaryDark: theme.color.primary600,
  success: theme.color.success,
  warning: theme.color.warning,
  danger: theme.color.danger,
  info: theme.color.info,
  muted: theme.color.inkMuted,
  background: theme.color.canvas,
  surface: theme.color.surface,
  border: theme.color.border,
} as const;

/** The only user role allowed to use this app. */
export const ALLOWED_ROLE = "delivery_man" as const;

/** SecureStore keys. */
export const StorageKeys = {
  accessToken: "da_access_token",
  user: "da_user",
} as const;
