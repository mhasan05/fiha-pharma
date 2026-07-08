import type { Product } from "@/types/api";

type StockInput = Pick<Product, "out_of_stock" | "stock_quantity" | "is_active">;

/**
 * How a product should be treated for ordering + display:
 * - "out" — flagged out of stock (or inactive): NOT orderable → red "Out of Stock".
 * - "low" — not flagged but stock ran below 1: still orderable → yellow.
 * - "in"  — normal, in stock → green.
 */
export type StockState = "in" | "low" | "out";

export function stockState(p: StockInput): StockState {
  if (p.is_active === false) return "out";
  if (p.out_of_stock) return "out"; // any out_of_stock:true → out of stock
  return (p.stock_quantity ?? 0) < 1 ? "low" : "in";
}

/** Only the "out" state blocks ordering. */
export function isOutOfStock(p: StockInput): boolean {
  return stockState(p) === "out";
}

/** Action-button background tint per state ("out" renders the red
 *  Out-of-Stock button instead, so its tint is unused). */
export const STOCK_TINT: Record<StockState, string> = {
  in: "#0F9D6E", // green (primary)
  low: "#F59E0B", // yellow / amber — low stock, still orderable
  out: "#0F9D6E",
};
