"use client";

import { useDeliveryReportQuery } from "@/redux/feature/deliverySlice";
import ExportButtons from "@/components/delivery/export-buttons";
import PeriodFilter, { usePeriod } from "@/components/delivery/period-filter";

const num = (v: number) => new Intl.NumberFormat("en-BD").format(Number(v) || 0);

function rateColor(rate: number) {
  if (rate >= 90) return "text-green-400";
  if (rate >= 70) return "text-yellow-400";
  return "text-red-400";
}

export default function PerformanceReport() {
  const period = usePeriod();
  const { data, isFetching } = useDeliveryReportQuery({ name: "delivery_performance", ...period.range });
  const s = data?.summary || {};
  const rows = data?.by_delivery_man || [];

  const buildExport = () => ({
    filename: `delivery_performance_${new Date().toISOString().slice(0, 10)}`,
    title: "Delivery Performance Report",
    subtitle: `Assigned: ${num(s.assigned)}  ·  Delivered: ${num(s.delivered)}  ·  Pending: ${num(s.pending_deliveries)}  ·  Success: ${s.success_rate ?? 0}%`,
    sections: [
      {
        title: "By Delivery Man",
        headers: ["Delivery Man", "Assigned", "Delivered", "Pending", "Cancelled", "Success Rate (%)"],
        rows: rows.map((r: any) => [r.name || "—", r.assigned, r.delivered, r.pending, r.cancelled, r.success_rate]),
      },
    ],
  });

  return (
    <div className="px-4 py-8 text-white">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Delivery Performance</h1>
          <p className="text-gray-300">Success rate and pending deliveries per agent {isFetching && <span className="text-xs text-gray-500">· updating…</span>}</p>
        </div>
        <ExportButtons build={buildExport} disabled={rows.length === 0} />
      </div>

      <PeriodFilter state={period} fetching={isFetching} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-purple-500"><p className="text-sm text-gray-400">Assigned</p><p className="text-2xl font-bold text-purple-400">{num(s.assigned)}</p></div>
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-green-500"><p className="text-sm text-gray-400">Delivered</p><p className="text-2xl font-bold text-green-400">{num(s.delivered)}</p></div>
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-amber-500"><p className="text-sm text-gray-400">Pending</p><p className="text-2xl font-bold text-amber-400">{num(s.pending_deliveries)}</p></div>
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-teal-500"><p className="text-sm text-gray-400">Success Rate</p><p className={`text-2xl font-bold ${rateColor(s.success_rate || 0)}`}>{s.success_rate ?? 0}%</p></div>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#2c2e34] sticky top-0"><tr>
              <th className="px-4 py-3 text-left text-xs text-gray-300 uppercase">Delivery Man</th>
              <th className="px-4 py-3 text-right text-xs text-gray-300 uppercase">Assigned</th>
              <th className="px-4 py-3 text-right text-xs text-gray-300 uppercase">Delivered</th>
              <th className="px-4 py-3 text-right text-xs text-gray-300 uppercase">Pending</th>
              <th className="px-4 py-3 text-right text-xs text-gray-300 uppercase">Cancelled</th>
              <th className="px-4 py-3 text-right text-xs text-gray-300 uppercase">Success Rate</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-700">
              {rows.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">No agents with assigned orders</td></tr> :
                rows.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-[#2c2e34]">
                    <td className="px-4 py-3 text-sm font-medium text-white">{r.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-300 tabular-nums">{num(r.assigned)}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-300 tabular-nums">{num(r.delivered)}</td>
                    <td className="px-4 py-3 text-sm text-right text-amber-300 tabular-nums">{num(r.pending)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-400 tabular-nums">{num(r.cancelled)}</td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold tabular-nums ${rateColor(r.success_rate)}`}>{r.success_rate}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
