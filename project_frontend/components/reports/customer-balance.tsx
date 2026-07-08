"use client";

import { useMemo, useState } from "react";
import { useDeliveryReportQuery } from "@/redux/feature/deliverySlice";
import PeriodFilter, { usePeriod } from "@/components/delivery/period-filter";
import ExportButtons from "@/components/delivery/export-buttons";

interface Row {
  customer: number;
  name: string | null;
  shop_name: string | null;
  phone: string | null;
  order_count: number;
  total_order_amount: number;
  total_collected: number;
  total_due: number;
}

const money = (v: number) =>
  `৳${new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(v) || 0)}`;
const num = (v: number) => new Intl.NumberFormat("en-BD").format(Number(v) || 0);

export default function CustomerBalance() {
  const period = usePeriod();
  const { data, isLoading, isFetching, isError, refetch } = useDeliveryReportQuery({
    name: "customer_balance",
    ...period.range,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const rows: Row[] = data?.data || [];
  const summary = data?.summary || {};

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.shop_name || "").toLowerCase().includes(q) ||
        (r.phone || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const current = filtered.slice((page - 1) * perPage, page * perPage);

  const buildExport = () => ({
    filename: `customer_balance_${new Date().toISOString().slice(0, 10)}`,
    title: "Customer Balance Report",
    subtitle: `Period: ${period.label}  ·  Customers: ${num(summary.customers)}  ·  Total Due: ${money(summary.total_due)}`,
    sections: [
      {
        title: "Customer Balances",
        headers: ["Customer", "Shop", "Phone", "Orders", "Order Amount", "Collected", "Due"],
        rows: filtered.map((r) => [
          r.name || "—", r.shop_name || "", r.phone || "",
          r.order_count, r.total_order_amount, r.total_collected, r.total_due,
        ]),
      },
    ],
  });

  return (
    <div className="px-4 py-8 text-white">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customer Balances</h1>
          <p className="text-gray-300">Each customer's total order amount, collected and outstanding due</p>
        </div>
        <ExportButtons build={buildExport} disabled={filtered.length === 0} />
      </div>

      <PeriodFilter state={period} fetching={isFetching} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-purple-500"><p className="text-sm text-gray-400">Customers</p><p className="text-2xl font-bold text-purple-400">{num(summary.customers)}</p></div>
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-teal-500"><p className="text-sm text-gray-400">Total Order Amount</p><p className="text-2xl font-bold text-teal-400">{money(summary.total_order_amount)}</p></div>
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-green-500"><p className="text-sm text-gray-400">Total Collected</p><p className="text-2xl font-bold text-green-400">{money(summary.total_collected)}</p></div>
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-red-500"><p className="text-sm text-gray-400">Total Due</p><p className="text-2xl font-bold text-red-400">{money(summary.total_due)}</p></div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by customer, shop or phone…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full md:w-96 px-4 py-2 bg-[#3a3c44] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#2c2e34] sticky top-0 z-10 [&_th]:bg-[#2c2e34]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Customer / Shop</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Phone</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Order Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Collected</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : isError ? (
                <tr><td colSpan={6} className="text-center py-12 text-red-400">Error. <button onClick={() => refetch()} className="underline">Retry</button></td></tr>
              ) : current.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No customers</td></tr>
              ) : current.map((r) => (
                <tr key={r.customer} className="hover:bg-[#2c2e34] transition">
                  <td className="px-4 py-3 text-sm font-medium text-white">
                    {r.shop_name || r.name || "—"}
                    {r.shop_name && r.name ? <span className="text-gray-500"> · {r.name}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{r.phone || "—"}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-300 tabular-nums">{num(r.order_count)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-200 tabular-nums">{money(r.total_order_amount)}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-300 tabular-nums">{money(r.total_collected)}</td>
                  <td className={`px-4 py-3 text-sm text-right tabular-nums font-semibold ${r.total_due > 0 ? "text-red-400" : "text-gray-300"}`}>{money(r.total_due)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-4 bg-[#2c2e34] border-t border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">{filtered.length} customer(s)</div>
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
