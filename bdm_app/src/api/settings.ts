import { api } from "./client";
import type { ApiEnvelope, AppUpdateResponse, ConditionalDiscount, PrivacyPolicy, SiteInfo } from "@/types/api";

/** GET /settings/site_info/ — public platform settings (first entry).
 *  Used to gate the app on maintenance mode before login. Short timeout so a
 *  slow network doesn't hold the splash screen for long. */
export async function getSiteInfo(): Promise<SiteInfo | null> {
  const { data } = await api.get<ApiEnvelope<SiteInfo[]>>("/settings/site_info/", { timeout: 8000 });
  return (data.data ?? [])[0] ?? null;
}

/** GET /settings/privacy-policy/ — the active privacy policy (first entry). */
export async function getPrivacyPolicy(): Promise<PrivacyPolicy | null> {
  const { data } = await api.get<ApiEnvelope<PrivacyPolicy[]>>("/settings/privacy-policy/");
  return (data.data ?? [])[0] ?? null;
}

/** GET /settings/terms-conditions/ — the active Terms & Conditions (first entry).
 *  Admin-editable; same shape as the privacy policy. */
export async function getTermsConditions(): Promise<PrivacyPolicy | null> {
  const { data } = await api.get<ApiEnvelope<PrivacyPolicy[]>>("/settings/terms-conditions/");
  return (data.data ?? [])[0] ?? null;
}

/** GET /settings/app-update/latest/ — whether a newer app version is available. */
export async function getLatestAppUpdate(): Promise<AppUpdateResponse> {
  const { data } = await api.get<AppUpdateResponse>("/settings/app-update/latest/");
  return data;
}

/** GET /settings/conditional-discounts/ — tiered special-discount rules. */
export async function getConditionalDiscounts(): Promise<ConditionalDiscount[]> {
  const { data } = await api.get<ApiEnvelope<ConditionalDiscount[]>>("/settings/conditional-discounts/");
  return data.data ?? [];
}

/** The bonus % that applies to a subtotal (mirrors the backend's get_bonus_rule:
 *  highest active rule whose minimum_purchase_amount <= subtotal). */
export function bonusPercentFor(subtotal: number, discounts: ConditionalDiscount[]): number {
  const applicable = discounts
    .filter((d) => d.is_active && Number(d.minimum_purchase_amount) <= subtotal)
    .sort((a, b) => Number(b.minimum_purchase_amount) - Number(a.minimum_purchase_amount));
  return applicable[0] ? Number(applicable[0].bonus_percentage) : 0;
}
