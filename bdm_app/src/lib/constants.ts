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

/** Seller/support contact — used by "Contact Support" / "Contact To Seller". */
export const SUPPORT_PHONE = "01558920438";
export const SUPPORT_MAIL = "support@bdmpharmacy.store";

/** Roles allowed to use this (shop-owner ordering) app. Staff/admin/delivery
 *  are blocked at login. */
export const ALLOWED_ROLES = ["shop_owner", "customer"] as const;

/** SecureStore / storage keys. */
export const StorageKeys = {
  accessToken: "bdm_access_token",
  user: "bdm_user",
  cart: "bdm_cart",
  theme: "bdm_theme",
  lang: "bdm_lang",
} as const;
