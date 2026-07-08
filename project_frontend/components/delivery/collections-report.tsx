"use client";

import { useDeliveryReportQuery } from "@/redux/feature/deliverySlice";
import ExportButtons from "@/components/delivery/export-buttons";
import PeriodFilter, { usePeriod } from "@/components/delivery/period-filter";

const money = (v: number) =>
  `৳${new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(v) || 0)}`;

export default function CollectionsReport() {
  const period = usePeriod();
  const { data, isFetching } = useDeliveryReportQuery({ name: "collection_summary", ...period.range });
  const summary = data?.summary || {};
  const byAgent = data?.by_delivery_man || [];
  const byCustomer = data?.by_customer || [];

  const buildExport = () => ({
    filename: `collections_${new Date().toISOString().slice(0, 10)}`,
    title: "Collections Report",
    subtitle: `Period: ${period.label}  ·  Today: ${money(summary.today_collection)}  ·  Total: ${money(summary.total_collection)}`,
    sections: [
      { title: "By Delivery Man", headers: ["Delivery Man", "Total"], rows: byAgent.map((r: any) => [r.name || "—", Number(r.total) || 0]) },
      { title: "By Customer", headers: ["Customer", "Shop", "Total"], rows: byCustomer.map((r: any) => [r.name || "—", r.shop_name || "", Number(r.total) || 0]) },
    ],
  });

  return (
    <div className="px-4 py-8 text-white">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Collections</h1>
          <p className="text-gray-300">Cash collected — today, by delivery man and by customer</p>
        </div>
        <ExportButtons build={buildExport} disabled={byAgent.length === 0 && byCustomer.length === 0} />
      </div>

      <PeriodFilter state={period} fetching={isFetching} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-purple-500">
          <p className="text-sm text-gray-400">Today's Collection</p>
          <p className="text-2xl font-bold text-purple-400">{money(summary.today_collection)}</p>
        </div>
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-green-500">
          <p className="text-sm text-gray-400">Total (filtered)</p>
          <p className="text-2xl font-bold text-green-400">{money(summary.total_collection)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Table title="By Delivery Man" rows={byAgent} nameKey="name" />
        <Table title="By Customer" rows={byCustomer} nameKey="name" shopKey="shop_name" />
      </div>
    </div>
  );
}

function Table({ title, rows, nameKey, shopKey }: { title: string; rows: any[]; nameKey: string; shopKey?: string }) {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-[#2c2e34] font-semibold">{title}</div>
      <div className="overflow-x-auto max-h-[60vh]">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-[#2c2e34] sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-gray-300 uppercase">Name</th>
              <th className="px-4 py-2 text-right text-xs text-gray-300 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {rows.length === 0 ? (
              <tr><td colSpan={2} className="text-center py-8 text-gray-400">No data</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="hover:bg-[#2c2e34]">
                <td className="px-4 py-2 text-sm text-white">
                  {r[nameKey] || "—"}{shopKey && r[shopKey] ? <span className="text-gray-500"> · {r[shopKey]}</span> : null}
                </td>
                <td className="px-4 py-2 text-sm text-right text-green-300 tabular-nums">{money(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
