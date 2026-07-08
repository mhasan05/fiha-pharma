"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useOrderReportQuery } from "@/redux/feature/reportSlice";
import { useAreaListQuery } from "@/redux/feature/areaSlice";
import { useAllUsersQuery } from "@/redux/feature/userSlice";

interface ReportRow {
  sl_no: number;
  invoice_number: string;
  area: string | null;
  date: string | null;
  party: string | null;
  inv_amount: number;
  return_amount: number;
  final_total: number;
  collection: number;
  due_amount: number;
}

interface Area {
  area_id: number;
  area_name: string;
}

type Period = "all" | "today" | "month" | "year" | "range";
const PERIOD_LABELS: Record<Period, string> = {
  all: "All Time",
  today: "Today",
  month: "This Month",
  year: "This Year",
  range: "Custom Range",
};

const toApi = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const money = (v: number) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
    Number(v) || 0
  );

export default function OrderReport() {
  const [period, setPeriod] = useState<Period>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customer, setCustomer] = useState<string>("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [area, setArea] = useState<string>("all");

  const range = useMemo<{ from_datetime?: string; to_datetime?: string }>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    if (period === "today")
      return { from_datetime: toApi(new Date(y, m, d, 0, 0, 0)), to_datetime: toApi(new Date(y, m, d, 23, 59, 59)) };
    if (period === "month")
      return { from_datetime: toApi(new Date(y, m, 1, 0, 0, 0)), to_datetime: toApi(new Date(y, m + 1, 0, 23, 59, 59)) };
    if (period === "year")
      return { from_datetime: toApi(new Date(y, 0, 1, 0, 0, 0)), to_datetime: toApi(new Date(y, 11, 31, 23, 59, 59)) };
    if (period === "range" && startDate && endDate)
      return { from_datetime: toApi(new Date(`${startDate}T00:00:00`)), to_datetime: toApi(new Date(`${endDate}T23:59:59`)) };
    return {};
  }, [period, startDate, endDate]);

  const queryArgs = useMemo(
    () => ({ ...range, customer, area }),
    [range, customer, area]
  );

  const { data: response, isLoading, isFetching, error, refetch } = useOrderReportQuery(queryArgs);
  const { data: areaData } = useAreaListQuery(undefined);
  const { data: userData } = useAllUsersQuery(undefined);

  const rows: ReportRow[] = response?.data || [];
  const summary = response?.summary;

  // Customers = non-staff users, sorted alphabetically by display name.
  const customerLabel = (u: any) => u.shop_name || u.full_name || `User-${u.user_id}`;
  const customers = (userData?.results?.data || [])
    .filter((u: any) => !u.is_staff)
    .slice()
    .sort((a: any, b: any) =>
      customerLabel(a).toLowerCase().localeCompare(customerLabel(b).toLowerCase())
    );

  // Normalize: lowercase + collapse repeated/edge whitespace, so "ma  pharmecy"
  // (stored with a double space) still matches a "ma p" query.
  const norm = (s: string) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();

  // Suggestions: exact match first, then prefix matches, then substring/phone
  // matches. No hard cap so every valid customer surfaces — the list scrolls.
  const customerMatches = (() => {
    const q = norm(customerSearch);
    if (!q) return customers;
    const exact: any[] = [];
    const starts: any[] = [];
    const contains: any[] = [];
    for (const u of customers) {
      const label = norm(customerLabel(u));
      const phone = norm(u.phone);
      if (label === q) exact.push(u);
      else if (label.startsWith(q)) starts.push(u);
      else if (label.includes(q) || phone.includes(q)) contains.push(u);
    }
    return [...exact, ...starts, ...contains];
  })();

  const periodLabel =
    period === "range" && startDate && endDate ? `${startDate} to ${endDate}` : PERIOD_LABELS[period];

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text("Order Report", 40, 40);
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`Period: ${periodLabel}`, 40, 58);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 72);

    autoTable(doc, {
      startY: 88,
      head: [["SL", "Area", "Date", "Party / Shop", "Inv Amount", "Return", "Final Total", "Collection", "Due"]],
      body: rows.map((r) => [
        r.sl_no,
        r.area || "",
        r.date || "",
        r.party || "",
        money(r.inv_amount),
        money(r.return_amount),
        money(r.final_total),
        money(r.collection),
        money(r.due_amount),
      ]),
      foot: summary
        ? [[
            { content: "Total", colSpan: 4, styles: { halign: "right" } },
            money(summary.inv_amount),
            money(summary.return_amount),
            money(summary.final_total),
            money(summary.collection),
            money(summary.due_amount),
          ]]
        : undefined,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [26, 58, 82], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
      columnStyles: { 0: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "right" }, 8: { halign: "right" } },
    });
    doc.save(`order_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="px-4 py-8 text-white">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Order Report</h1>
          <p className="text-gray-300">Invoice, return, collection and due per order</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={rows.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-3 bg-gray-800 border border-gray-700 rounded-lg p-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Period</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="px-3 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm"
          >
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
            ))}
          </select>
        </div>

        {period === "range" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Start Date</label>
              <input type="date" value={startDate} max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">End Date</label>
              <input type="date" value={endDate} min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm" />
            </div>
          </>
        )}

        <div className="flex flex-col gap-1 relative">
          <label className="text-xs text-gray-400">Customer</label>
          <input
            type="text"
            value={customerSearch}
            placeholder="All Customers — type to search"
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setCustomerOpen(true);
              if (e.target.value.trim() === "") setCustomer("all");
            }}
            onFocus={() => setCustomerOpen(true)}
            onBlur={() => setTimeout(() => setCustomerOpen(false), 150)}
            className="px-3 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm min-w-[200px]"
          />
          {customerOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2a2a] border border-gray-600 rounded-md shadow-lg max-h-56 overflow-y-auto z-50">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setCustomer("all");
                  setCustomerSearch("");
                  setCustomerOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                All Customers
              </button>
              {customerMatches.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">No matches</div>
              ) : (
                customerMatches.map((u: any) => (
                  <button
                    key={u.user_id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setCustomer(String(u.user_id));
                      setCustomerSearch(customerLabel(u));
                      setCustomerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${
                      String(u.user_id) === customer ? "text-purple-400" : "text-white"
                    }`}
                  >
                    {customerLabel(u)}
                    {u.phone ? <span className="text-gray-500"> · {u.phone}</span> : null}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Area</label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="px-3 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm min-w-[140px]"
          >
            <option value="all">All Areas</option>
            {areaData?.data?.map((a: Area) => (
              <option key={a.area_id} value={a.area_id}>{a.area_name}</option>
            ))}
          </select>
        </div>

        {isFetching && <span className="text-xs text-gray-400 ml-auto">Updating…</span>}
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#2c2e34] sticky top-0 z-10 [&_th]:bg-[#2c2e34]">
              <tr>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase">SL</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase">Area</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase">Party / Shop</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase">Inv Amount</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase">Return</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase">Final Total</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase">Collection</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={9} className="text-center py-12 text-red-400">
                  Error loading report. <button onClick={() => refetch()} className="underline">Retry</button>
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No orders for this filter</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={`${r.invoice_number}-${r.sl_no}`} className="hover:bg-[#2c2e34] transition">
                    <td className="px-3 py-3 text-sm text-right text-gray-400 tabular-nums">{r.sl_no}</td>
                    <td className="px-3 py-3 text-sm text-gray-300">{r.area || "N/A"}</td>
                    <td className="px-3 py-3 text-sm text-gray-300 whitespace-nowrap">{r.date || ""}</td>
                    <td className="px-3 py-3 text-sm font-medium text-white">{r.party || "N/A"}</td>
                    <td className="px-3 py-3 text-sm text-right text-gray-200 tabular-nums">৳{money(r.inv_amount)}</td>
                    <td className="px-3 py-3 text-sm text-right text-amber-300 tabular-nums">৳{money(r.return_amount)}</td>
                    <td className="px-3 py-3 text-sm text-right text-white tabular-nums">৳{money(r.final_total)}</td>
                    <td className="px-3 py-3 text-sm text-right text-green-300 tabular-nums">৳{money(r.collection)}</td>
                    <td className={`px-3 py-3 text-sm text-right tabular-nums font-semibold ${r.due_amount > 0 ? "text-red-400" : "text-gray-300"}`}>
                      ৳{money(r.due_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {summary && rows.length > 0 && (
              <tfoot className="bg-[#2c2e34] border-t border-gray-600 font-semibold sticky bottom-0 z-10 [&_td]:bg-[#2c2e34]">
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-right text-sm text-gray-300">Total</td>
                  <td className="px-3 py-3 text-sm text-right text-gray-100 tabular-nums">৳{money(summary.inv_amount)}</td>
                  <td className="px-3 py-3 text-sm text-right text-amber-300 tabular-nums">৳{money(summary.return_amount)}</td>
                  <td className="px-3 py-3 text-sm text-right text-white tabular-nums">৳{money(summary.final_total)}</td>
                  <td className="px-3 py-3 text-sm text-right text-green-300 tabular-nums">৳{money(summary.collection)}</td>
                  <td className="px-3 py-3 text-sm text-right text-red-400 tabular-nums">৳{money(summary.due_amount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
