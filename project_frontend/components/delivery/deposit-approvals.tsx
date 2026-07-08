"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useAdminDepositsQuery,
  useApproveDepositMutation,
  useRejectDepositMutation,
} from "@/redux/feature/deliverySlice";

interface Deposit {
  id: number;
  delivery_man: number;
  delivery_man_name: string | null;
  amount: number;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  requested_at: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  payment_count: number;
}

const TABS = ["pending", "approved", "rejected", "all"] as const;
type Tab = (typeof TABS)[number];

const money = (v: number) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
    Number(v) || 0
  );

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
  };
  return map[s] || "bg-gray-500/20 text-gray-400";
};

export default function DepositApprovals() {
  const [tab, setTab] = useState<Tab>("pending");
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useAdminDepositsQuery({ status: tab, page });
  const [approve, { isLoading: approving }] = useApproveDepositMutation();
  const [reject, { isLoading: rejecting }] = useRejectDepositMutation();

  const deposits: Deposit[] = data?.results?.data || [];
  const count: number = data?.count || 0;
  const pageSize = 20;
  const totalPages = Math.ceil(count / pageSize);

  const handleApprove = async (id: number) => {
    try {
      await approve(id).unwrap();
      toast.success("Deposit approved", { position: "top-right" });
    } catch {
      toast.error("Failed to approve deposit", { position: "top-right" });
    }
  };

  const handleReject = async (id: number) => {
    const note = window.prompt("Reason for rejection (optional):") ?? "";
    try {
      await reject({ id, note }).unwrap();
      toast.success("Deposit rejected — cash returned to agent's pool", { position: "top-right" });
    } catch {
      toast.error("Failed to reject deposit", { position: "top-right" });
    }
  };

  return (
    <div className="px-4 py-8 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Deposit Approvals</h1>
        <p className="text-gray-300">Review and settle delivery agents' cash deposits</p>
      </div>

      {/* Status tabs */}
      <div className="inline-flex rounded-lg border border-gray-700 bg-gray-800 p-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setPage(1);
            }}
            className={`px-5 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
        {isFetching && <span className="px-3 py-2 text-xs text-gray-400">Updating…</span>}
      </div>

      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#2c2e34]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Delivery Man</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Payments</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Requested</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Reviewed</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : isError ? (
                <tr><td colSpan={7} className="text-center py-12 text-red-400">
                  Error loading deposits. <button onClick={() => refetch()} className="underline">Retry</button>
                </td></tr>
              ) : deposits.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No {tab === "all" ? "" : tab} deposits</td></tr>
              ) : (
                deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-[#2c2e34] transition">
                    <td className="px-4 py-3 text-sm font-medium text-white">{d.delivery_man_name || `#${d.delivery_man}`}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-300 tabular-nums">৳{money(d.amount)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-300 tabular-nums">{d.payment_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                      {d.requested_at ? new Date(d.requested_at).toLocaleString() : ""}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded capitalize ${statusBadge(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {d.reviewed_by_name ? (
                        <>
                          {d.reviewed_by_name}
                          {d.reviewed_at ? <div>{new Date(d.reviewed_at).toLocaleDateString()}</div> : null}
                          {d.review_note ? <div className="text-gray-500 italic">{d.review_note}</div> : null}
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.status === "pending" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(d.id)}
                            disabled={approving || rejecting}
                            className="px-3 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(d.id)}
                            disabled={approving || rejecting}
                            className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-4 bg-[#2c2e34] border-t border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">{count} deposit(s)</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-[#3a3c44] text-white rounded hover:bg-[#4a4c54] disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-purple-600 text-white rounded">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 bg-[#3a3c44] text-white rounded hover:bg-[#4a4c54] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
