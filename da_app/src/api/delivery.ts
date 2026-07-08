import { api } from "./client";
import type {
  ApiEnvelope,
  DeliveryDashboard,
  DeliverySummary,
  DeliveryOrder,
  DeliveryOrderDetail,
  DepositRequest,
  Paginated,
  ReturnedProduct,
  ReturnItemInput,
  ReturnRequest,
} from "@/types/api";

/** Unwraps a list payload across the backend's shapes:
 *  - { data: [...] }
 *  - { results: [...] }
 *  - { results: { status, data: [...] } }   (paginated + enveloped) */
function listOf<T>(payload: Paginated<T>): T[] {
  if (Array.isArray(payload.data)) return payload.data;
  const results = payload.results as unknown;
  if (Array.isArray(results)) return results as T[];
  if (results && typeof results === "object" && Array.isArray((results as { data?: T[] }).data)) {
    return (results as { data: T[] }).data;
  }
  return [];
}

export async function getDashboard(): Promise<DeliveryDashboard> {
  const { data } = await api.get<ApiEnvelope<DeliveryDashboard>>("/delivery/dashboard/");
  return data.data;
}

/** GET /delivery/summary/ — the agent's overall (all-time) summary totals. */
export async function getDeliverySummary(): Promise<DeliverySummary> {
  const { data } = await api.get<ApiEnvelope<DeliverySummary>>("/delivery/summary/");
  return data.data;
}

export type OrderFilter = "pending" | "delivered" | "all";

export async function getAssignedOrders(status: OrderFilter = "all"): Promise<DeliveryOrder[]> {
  const { data } = await api.get<Paginated<DeliveryOrder>>("/delivery/orders/", {
    params: { status },
  });
  return listOf(data);
}

export async function getOrderDetail(orderId: number): Promise<DeliveryOrderDetail> {
  const { data } = await api.get<ApiEnvelope<DeliveryOrderDetail> | DeliveryOrderDetail>(
    `/delivery/orders/${orderId}/`
  );
  return "data" in data ? data.data : data;
}

/** Mark an order delivered, optionally collecting payment in the same call. */
export async function deliverOrder(orderId: number, amount?: number): Promise<void> {
  const body = amount != null ? { amount } : {};
  await api.post(`/delivery/orders/${orderId}/deliver/`, body);
}

export async function collectPayment(
  orderId: number,
  amount: number,
  note?: string
): Promise<void> {
  await api.post(`/delivery/orders/${orderId}/collect/`, { amount, note });
}

export async function submitReturn(
  orderId: number,
  items: ReturnItemInput[],
  note?: string
): Promise<void> {
  await api.post(`/delivery/orders/${orderId}/return/`, { items, note });
}

export async function getReturnRequests(
  status?: ReturnRequest["status"]
): Promise<ReturnRequest[]> {
  const { data } = await api.get<Paginated<ReturnRequest>>("/delivery/return-requests/", {
    params: status ? { status } : undefined,
  });
  return listOf(data);
}

/** All finalized returned products for the agent's orders (incl. admin order-edits). */
export async function getReturnedProducts(
  source?: "admin" | "agent"
): Promise<{ items: ReturnedProduct[]; total_quantity: number }> {
  const { data } = await api.get<{
    total_quantity?: number;
    data?: ReturnedProduct[];
    results?: { total_quantity?: number; data?: ReturnedProduct[] };
  }>("/delivery/returned-products/", { params: source ? { source } : undefined });
  const env = inner(data);
  return { items: env.data ?? [], total_quantity: env.total_quantity ?? 0 };
}

/** Returns the inner envelope, unwrapping a `{ results: {...} }` paginated wrapper. */
function inner<T extends object>(payload: T & { results?: unknown }): T {
  const r = payload.results;
  if (r && typeof r === "object" && !Array.isArray(r)) return r as T;
  return payload;
}

export async function getDues(): Promise<{ items: DeliveryOrder[]; total_due: number }> {
  const { data } = await api.get<{
    total_due?: number;
    data?: DeliveryOrder[];
    results?: { total_due?: number; data?: DeliveryOrder[] };
  }>("/delivery/dues/");
  const env = inner(data);
  return { items: env.data ?? [], total_due: env.total_due ?? 0 };
}

export interface DepositSummary {
  cash_in_hand: number;
  undeposited_amount: number;
  data: DepositRequest[];
}

export async function getDeposits(status?: DepositRequest["status"]): Promise<DepositSummary> {
  const { data } = await api.get<{
    cash_in_hand?: number;
    undeposited_amount?: number;
    data?: DepositRequest[];
    results?: { cash_in_hand?: number; undeposited_amount?: number; data?: DepositRequest[] };
  }>("/delivery/deposits/", { params: status ? { status } : undefined });
  const env = inner(data);
  return {
    cash_in_hand: env.cash_in_hand ?? 0,
    undeposited_amount: env.undeposited_amount ?? 0,
    data: env.data ?? [],
  };
}

/** Bundles all undeposited collections into a new pending deposit request. */
export async function submitDeposit(note?: string): Promise<DepositRequest> {
  const { data } = await api.post<ApiEnvelope<DepositRequest> | DepositRequest>(
    "/delivery/deposits/",
    { note }
  );
  return "data" in data ? data.data : data;
}
