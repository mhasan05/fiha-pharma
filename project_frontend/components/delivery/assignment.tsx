"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useAssignableOrdersQuery,
  useDeliveryAgentsQuery,
  useAssignOrderMutation,
} from "@/redux/feature/deliverySlice";

const FILTERS = [
  { key: "unassigned", label: "Unassigned" },
  { key: "assigned", label: "Assigned" },
  { key: "all", label: "All Shipped" },
] as const;

const money = (v: number) =>
  `৳${new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(v) || 0)}`;

export default function Assignment() {
  const [filter, setFilter] = useState<string>("unassigned");
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, refetch } = useAssignableOrdersQuery({ assigned: filter, status: "shipped", page });
  const { data: agentsData } = useDeliveryAgentsQuery(undefined);
  const [assignOrder, { isLoading: assigning }] = useAssignOrderMutation();

  const orders = data?.results?.data || [];
  const count = data?.count || 0;
  const totalPages = Math.ceil(count / 20);
  const agents = agentsData?.data || [];

  const handleAssign = async (orderId: number, deliveryMan: string) => {
    if (!deliveryMan) return;
    try {
      await assignOrder({ id: orderId, delivery_man: Number(deliveryMan) }).unwrap();
      toast.success("Order assigned", { position: "top-right" });
    } catch {
      toast.error("Failed to assign order", { position: "top-right" });
    }
  };

  return (
    <div className="px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-2">Order Assignment</h1>
      <p className="text-gray-300 mb-6">Assign shipped orders to delivery agents (auto-assigned by area on ship; override here)</p>

      {/* Agent load summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {agents.map((a: any) => (
          <div key={a.user_id} className="bg-[#3a3c44] p-3 rounded-lg">
            <p className="text-sm font-medium text-white truncate">{a.full_name}</p>
            <p className="text-xs text-gray-400">{a.area_name || "No area"}</p>
            <p className="text-xs text-amber-400 mt-1">{a.pending_deliveries} pending</p>
          </div>
        ))}
        {agents.length === 0 && <p className="text-sm text-gray-400">No delivery agents yet.</p>}
      </div>

      <div className="inline-flex rounded-lg border border-gray-700 bg-gray-800 p-1 mb-6">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${filter === f.key ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}>
            {f.label}
          </button>
        ))}
        {isFetching && <span className="px-3 py-2 text-xs text-gray-400">Updating…</span>}
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#2c2e34]"><tr>
              <th className="px-4 py-3 text-left text-xs text-gray-300 uppercase">Invoice</th>
              <th className="px-4 py-3 text-left text-xs text-gray-300 uppercase">Shop</th>
              <th className="px-4 py-3 text-left text-xs text-gray-300 uppercase">Area</th>
              <th className="px-4 py-3 text-right text-xs text-gray-300 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs text-gray-300 uppercase">Assigned To</th>
              <th className="px-4 py-3 text-left text-xs text-gray-300 uppercase">Assign / Reassign</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading…</td></tr> :
                orders.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">No orders</td></tr> :
                orders.map((o: any) => (
                  <tr key={o.order_id} className="hover:bg-[#2c2e34]">
                    <td className="px-4 py-3 text-sm font-medium text-white whitespace-nowrap">{o.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{o.shop_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{o.area || "—"}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-200 tabular-nums">{money(o.invoice_amount)}</td>
                    <td className="px-4 py-3 text-sm">
                      {o.assigned_to_name
                        ? <span className="text-green-400">{o.assigned_to_name}</span>
                        : <span className="text-red-400">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        defaultValue={o.assigned_to || ""}
                        disabled={assigning}
                        onChange={(e) => handleAssign(o.order_id, e.target.value)}
                        className="px-2 py-1.5 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm min-w-[160px]"
                      >
                        <option value="">Select agent…</option>
                        {agents.map((a: any) => (
                          <option key={a.user_id} value={a.user_id}>
                            {a.full_name}{a.area_name ? ` (${a.area_name})` : ""} · {a.pending_deliveries} pend.
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-4 bg-[#2c2e34] border-t border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">{count} order(s)</div>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-[#3a3c44] text-white rounded hover:bg-[#4a4c54] disabled:opacity-50">Previous</button>
              <span className="px-3 py-1 bg-purple-600 text-white rounded">{page}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 bg-[#3a3c44] text-white rounded hover:bg-[#4a4c54] disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
