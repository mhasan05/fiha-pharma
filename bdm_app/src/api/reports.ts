import { api } from "./client";
import type { CustomerBalance } from "@/types/api";

interface CustomerBalanceResponse {
  status: string;
  summary?: Partial<CustomerBalance>;
}

/** GET /reports/customer_balance/ — the logged-in customer's own totals.
 *  The backend scopes a non-staff user to themselves, so `summary` is this
 *  customer's order amount / collected / outstanding due. */
export async function getCustomerBalance(): Promise<CustomerBalance> {
  const { data } = await api.get<CustomerBalanceResponse>("/reports/customer_balance/");
  const s = data.summary ?? {};
  return {
    total_order_amount: Number(s.total_order_amount) || 0,
    total_collected: Number(s.total_collected) || 0,
    total_due: Number(s.total_due) || 0,
  };
}
