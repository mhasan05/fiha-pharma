"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAdminReturnRequestsQuery, useReviewReturnRequestMutation } from "@/redux/feature/deliverySlice";

interface RItem { id: number; product_name: string | null; quantity: number; unit_price: number | null; line_total: number; reason: string | null; }
interface ReturnReq {
  id: number;
  invoice_number: string;
  shop_name: string | null;
  delivery_man_name: string | null;
  status: "pending" | "confirmed" | "rejected";
  note: string | null;
  created_at: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  total_quantity: number;
  total_value: number;
  items: RItem[];
}

const TABS = ["pending", "confirmed", "rejected", "all"] as const;
type Tab = (typeof TABS)[number];

const money = (v: number) => `৳${new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(v) || 0)}`;
const statusBadge = (s: string) => ({ pending: "bg-yellow-500/20 text-yellow-400", confirmed: "bg-green-500/20 text-green-400", rejected: "bg-red-500/20 text-red-400" }[s] || "bg-gray-500/20 text-gray-400");

export default function ReturnRequests() {
  const [tab, setTab] = useState<Tab>("pending");
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useAdminReturnRequestsQuery({ status: tab, page });
  const [review, { isLoading: reviewing }] = useReviewReturnRequestMutation();

  const rows: ReturnReq[] = data?.results?.data || [];
  const count = data?.count || 0;
  const totalPages = Math.ceil(count / 20);

  const act = async (id: number, action: "confirm" | "reject") => {
    let note = "";
    if (action === "reject") note = window.prompt("Reason for rejection (optional):") ?? "";
    try {
      await review({ id, action, note }).unwrap();
      toast.success(action === "confirm" ? "Return confirmed — stock restored" : "Return rejected", { position: "top-right" });
    } catch {
      toast.error(`Failed to ${action} return`, { position: "top-right" });
    }
  };

  return (
    <div className="px-4 py-8 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Return Requests</h1>
        <p className="text-gray-300">Confirm received returns — stock is restored only after confirmation</p>
      </div>

      <div className="inline-flex rounded-lg border border-gray-700 bg-gray-800 p-1 mb-6">
        {TABS.map((t) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-5 py-2 rounded-md text-sm font-medium capitalize transition-colors ${tab === t ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}>
            {t}
          </button>
        ))}
        {isFetching && <span className="px-3 py-2 text-xs text-gray-400">Updating…</span>}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : isError ? (
          <div className="text-center py-12 text-red-400">Error. <button onClick={() => refetch()} className="underline">Retry</button></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No {tab === "all" ? "" : tab} return requests</div>
        ) : rows.map((r) => (
          <div key={r.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#2c2e34]">
              <div>
                <span className="font-semibold">{r.invoice_number}</span>
                <span className="text-gray-400"> · {r.shop_name || "—"}</span>
                <div className="text-xs text-gray-400 mt-0.5">
                  By {r.delivery_man_name || "—"} · {new Date(r.created_at).toLocaleString()}
                  {r.note ? ` · "${r.note}"` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300">{r.total_quantity} unit(s) · {money(r.total_value)}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded capitalize ${statusBadge(r.status)}`}>{r.status}</span>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => act(r.id, "confirm")} disabled={reviewing} className="px-3 py-1 text-xs rounded bg-green-600 hover:bg-green-700 disabled:opacity-50">Confirm</button>
                    <button onClick={() => act(r.id, "reject")} disabled={reviewing} className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 disabled:opacity-50">Reject</button>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead><tr className="text-left text-xs text-gray-400 uppercase">
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Rate</th>
                <th className="px-4 py-2 text-right">Value</th>
                <th className="px-4 py-2">Reason</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-700">
                {r.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-2 text-sm text-white">{it.product_name || "—"}</td>
                    <td className="px-4 py-2 text-sm text-right text-amber-300 tabular-nums">{it.quantity}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-300 tabular-nums">{money(it.unit_price || 0)}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-200 tabular-nums">{money(it.line_total)}</td>
                    <td className="px-4 py-2 text-sm text-gray-400">{it.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {r.reviewed_by_name && (
              <div className="px-4 py-2 text-xs text-gray-500 bg-[#23252b]">
                Reviewed by {r.reviewed_by_name}{r.reviewed_at ? ` on ${new Date(r.reviewed_at).toLocaleString()}` : ""}{r.review_note ? ` · ${r.review_note}` : ""}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-400">{count} request(s)</div>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-[#3a3c44] text-white rounded hover:bg-[#4a4c54] disabled:opacity-50">Previous</button>
            <span className="px-3 py-1 bg-purple-600 text-white rounded">{page}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 bg-[#3a3c44] text-white rounded hover:bg-[#4a4c54] disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
