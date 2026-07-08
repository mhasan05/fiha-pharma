"use client";

import { useDeliveryReportQuery } from "@/redux/feature/deliverySlice";
import ExportButtons from "@/components/delivery/export-buttons";
import PeriodFilter, { usePeriod } from "@/components/delivery/period-filter";

const money = (v: number) =>
  `৳${new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(v) || 0)}`;
const num = (v: number) => new Intl.NumberFormat("en-BD").format(Number(v) || 0);

export default function ReturnsReport() {
  const period = usePeriod();
  const { data, isFetching } = useDeliveryReportQuery({ name: "returns_summary", ...period.range });
  const summary = data?.summary || {};
  const byProduct = data?.by_product || [];
  const byReason = data?.by_reason || [];
  const byAgent = data?.by_delivery_man || [];

  const buildExport = () => ({
    filename: `returns_${new Date().toISOString().slice(0, 10)}`,
    title: "Returns Report",
    subtitle: `Total returned: ${num(summary.total_quantity)} units  ·  Value: ${money(summary.total_value)}`,
    sections: [
      { title: "By Product", headers: ["Product", "Qty", "Returns", "Value"], rows: byProduct.map((r: any) => [r.product_name || "—", Number(r.quantity) || 0, Number(r.count) || 0, Number(r.value) || 0]) },
      { title: "By Reason", headers: ["Reason", "Qty"], rows: byReason.map((r: any) => [r.reason || "—", Number(r.quantity) || 0]) },
      { title: "By Delivery Man", headers: ["Delivery Man", "Qty"], rows: byAgent.map((r: any) => [r.name || "—", Number(r.quantity) || 0]) },
    ],
  });

  return (
    <div className="px-4 py-8 text-white">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Returns</h1>
          <p className="text-gray-300">Product returns by product, reason and delivery man {isFetching && <span className="text-xs text-gray-500">· updating…</span>}</p>
        </div>
        <ExportButtons build={buildExport} disabled={byProduct.length === 0} />
      </div>

      <PeriodFilter state={period} fetching={isFetching} />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-amber-500">
          <p className="text-sm text-gray-400">Total Returned Qty</p>
          <p className="text-2xl font-bold text-amber-400">{num(summary.total_quantity)}</p>
        </div>
        <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-orange-500">
          <p className="text-sm text-gray-400">Total Return Value</p>
          <p className="text-2xl font-bold text-orange-400">{money(summary.total_value)}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 bg-[#2c2e34] font-semibold">By Product</div>
        <div className="overflow-x-auto max-h-[50vh]">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#2c2e34] sticky top-0"><tr>
              <th className="px-4 py-2 text-left text-xs text-gray-300 uppercase">Product</th>
              <th className="px-4 py-2 text-right text-xs text-gray-300 uppercase">Qty</th>
              <th className="px-4 py-2 text-right text-xs text-gray-300 uppercase">Returns</th>
              <th className="px-4 py-2 text-right text-xs text-gray-300 uppercase">Value</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-700">
              {byProduct.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-gray-400">No returns</td></tr> :
                byProduct.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-[#2c2e34]">
                    <td className="px-4 py-2 text-sm text-white">{r.product_name || "—"}</td>
                    <td className="px-4 py-2 text-sm text-right text-amber-300 tabular-nums">{num(r.quantity)}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-300 tabular-nums">{num(r.count)}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-200 tabular-nums">{money(r.value)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleTable title="By Reason" rows={byReason} labelKey="reason" />
        <SimpleTable title="By Delivery Man" rows={byAgent} labelKey="name" />
      </div>
    </div>
  );
}

function SimpleTable({ title, rows, labelKey }: { title: string; rows: any[]; labelKey: string }) {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-[#2c2e34] font-semibold">{title}</div>
      <div className="overflow-x-auto max-h-[50vh]">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-[#2c2e34] sticky top-0"><tr>
            <th className="px-4 py-2 text-left text-xs text-gray-300 uppercase">{title.replace("By ", "")}</th>
            <th className="px-4 py-2 text-right text-xs text-gray-300 uppercase">Qty</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-700">
            {rows.length === 0 ? <tr><td colSpan={2} className="text-center py-8 text-gray-400">No data</td></tr> :
              rows.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-[#2c2e34]">
                  <td className="px-4 py-2 text-sm text-white">{r[labelKey] || "—"}</td>
                  <td className="px-4 py-2 text-sm text-right text-amber-300 tabular-nums">{new Intl.NumberFormat("en-BD").format(r.quantity || 0)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
