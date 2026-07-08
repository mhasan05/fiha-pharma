import { bonusPercentFor } from "@/api/settings";
import type { ConditionalDiscount, Order } from "@/types/api";

/** Calendar-month key (YYYY-MM) used to group orders/rewards. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** The special-discount reward earned on a single order.
 *  Prefer the backend-computed `special_bonus`; otherwise mirror the cart
 *  rule (highest active tier for the order's purchase amount). */
export function rewardForOrder(order: Order, discounts: ConditionalDiscount[]): number {
  if (order.special_bonus != null) return Number(order.special_bonus) || 0;
  const base = Number(order.subtotal_amount ?? order.total_amount) || 0;
  const pct = bonusPercentFor(base, discounts);
  return Math.round(((base * pct) / 100) * 100) / 100;
}

export interface RewardMonth {
  key: string;
  label: string;
  count: number;
  spent: number;
  reward: number;
}

/** Group orders into month buckets with spend + reward totals, newest first. */
export function groupRewardsByMonth(orders: Order[], discounts: ConditionalDiscount[]): RewardMonth[] {
  const map = new Map<string, RewardMonth>();
  for (const o of orders) {
    const d = new Date(o.order_date);
    if (Number.isNaN(d.getTime())) continue;
    const key = monthKey(d);
    const g = map.get(key) ?? {
      key,
      label: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      count: 0,
      spent: 0,
      reward: 0,
    };
    g.count += 1;
    g.spent += Number(o.total_amount) || 0;
    g.reward += rewardForOrder(o, discounts);
    map.set(key, g);
  }
  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
}
