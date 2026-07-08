import { api } from "./client";
import type { ApiEnvelope, CartLine, Order, Paginated } from "@/types/api";

function unwrap<T>(payload: Paginated<T>): T[] {
  const results = payload.results;
  if (Array.isArray(results)) return results;
  if (results && Array.isArray((results as { data?: T[] }).data)) {
    return (results as { data?: T[] }).data ?? [];
  }
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

/** GET /orders/orders/ — my order history. */
export async function getOrders(): Promise<Order[]> {
  const { data } = await api.get<Paginated<Order>>("/orders/orders/", {
    params: { page_size: 100 },
  });
  return unwrap(data);
}

/** GET /orders/orders/<id>/ — one order with items. */
export async function getOrder(id: number): Promise<Order> {
  const { data } = await api.get<ApiEnvelope<Order> | Order>(`/orders/orders/${id}/`);
  return "data" in data ? (data as ApiEnvelope<Order>).data : (data as Order);
}

/** POST /orders/orders/ — place an order for the current shop owner.
 *  The backend merges into an existing pending order (adding items) and sets
 *  the delivery charge itself. Returns the created/updated order. */
export async function createOrder(userId: number, lines: CartLine[]): Promise<Order> {
  const items = lines.map((l) => ({ product: l.product_id, quantity: l.quantity }));
  const { data } = await api.post<ApiEnvelope<Order>>("/orders/orders/", {
    user_id: userId,
    items,
  });
  return data.data;
}

/** PATCH /orders/orders/<id>/ — replace a pending order's items with `lines`.
 *  Unlike createOrder (which adds to the pending order), the backend update
 *  SETS each line to the submitted quantity, so editing 4→5 yields 5, not 9. */
export async function updateOrder(orderId: number, lines: CartLine[]): Promise<Order> {
  const items = lines.map((l) => ({ product: l.product_id, quantity: l.quantity }));
  const { data } = await api.patch<ApiEnvelope<Order>>(`/orders/orders/${orderId}/`, { items });
  return data.data;
}
