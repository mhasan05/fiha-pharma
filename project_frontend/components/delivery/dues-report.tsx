"use client";

import { useDeliveryReportQuery } from "@/redux/feature/deliverySlice";
import ExportButtons from "@/components/delivery/export-buttons";
import PeriodFilter, { usePeriod } from "@/components/delivery/period-filter";

const money = (v: number) =>
  `৳${new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(v) || 0)}`;

export default function DuesReport() {
  const period = usePeriod();
  const { data, isFetching } = useDeliveryReportQuery({ name: "due_summary", ...period.range });
  const summary = data?.summary || {};
  const customerDues = data?.customer_dues || [];
  const agentDues = data?.delivery_man_dues || [];

  const buildExport = () => ({
    filename: `dues_${new Date().toISOString().slice(0, 10)}`,
    title: "Dues Report",
    subtitle: `Customer due: ${money(summary.total_customer_due)}  ·  Delivery-man cash-in-hand: ${money(summary.total_delivery_man_due)}`,
    sections: [
      { title: "Customer Dues", headers: ["Customer", "Shop", "Due"], rows: customerDues.map((r: any) => [r.name || "—", r.shop_name || "", Number(r.due) || 0]) },
      { title: "Delivery-man Cash-in-hand", headers: ["Delivery Man", "Cash in hand"], rows: agentDues.map((r: any) => [r.name || "—", Number(r.cash_in_hand) || 0]) },
    ],
  });

  return (
    <div className="px-4 py-8 text-white">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dues</h1>
          <p className="text-gray-300">Outstanding customer dues and delivery-man cash-in-hand {isFetching && <span className="text-xs text-gray-500">· updating…</span>}</p>
        </div>
        <ExportButtons build={buildExport} disabled={customerDues.length === 0 && agentDues.length === 0} />
      </div>

      <PeriodFilter state={period} fetching={isFetching} />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-red-500">
          <p className="text-sm text-gray-400">Total Customer Due</p>
          <p className="text-2xl font-bold text-red-400">{money(summary.total_customer_due)}</p>
        </div>
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-purple-500">
          <p className="text-sm text-gray-400">Delivery-man Cash-in-hand</p>
          <p className="text-2xl font-bold text-purple-400">{money(summary.total_delivery_man_due)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#2c2e34] font-semibold">Customer Dues</div>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-[#2c2e34] sticky top-0"><tr>
                <th className="px-4 py-2 text-left text-xs text-gray-300 uppercase">Customer / Shop</th>
                <th className="px-4 py-2 text-right text-xs text-gray-300 uppercase">Due</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-700">
                {customerDues.length === 0 ? <tr><td colSpan={2} className="text-center py-8 text-gray-400">No dues</td></tr> :
                  customerDues.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-[#2c2e34]">
                      <td className="px-4 py-2 text-sm text-white">{r.shop_name || r.name || "—"}</td>
                      <td className="px-4 py-2 text-sm text-right text-red-300 tabular-nums">{money(r.due)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#2c2e34] font-semibold">Delivery-man Cash-in-hand</div>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-[#2c2e34] sticky top-0"><tr>
                <th className="px-4 py-2 text-left text-xs text-gray-300 uppercase">Delivery Man</th>
                <th className="px-4 py-2 text-right text-xs text-gray-300 uppercase">Cash in hand</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-700">
                {agentDues.length === 0 ? <tr><td colSpan={2} className="text-center py-8 text-gray-400">No outstanding cash</td></tr> :
                  agentDues.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-[#2c2e34]">
                      <td className="px-4 py-2 text-sm text-white">{r.name || "—"}</td>
                      <td className="px-4 py-2 text-sm text-right text-purple-300 tabular-nums">{money(r.cash_in_hand)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
