"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useProductWiseReportQuery } from "@/redux/feature/reportSlice";

interface ReportRow {
  product_id: number;
  product_name: string;
  sku: string;
  company_name: string | null;
  lifetime_stocked_qty: number;
  total_sold_qty: number;
  delivered_sold_qty: number;
  total_returned_qty: number;
  current_stock_qty: number;
  cost_price: number;
  mrp: number;
  selling_price: number;
  current_stock_value: number;
  sold_value: number;
}

const num = (v: number) =>
  new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(Number(v) || 0);
const money = (v: number) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
    Number(v) || 0
  );

export default function ProductWiseReport() {
  const { data: response, isLoading, error, refetch } = useProductWiseReportQuery(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Sortable numeric columns (Lifetime Stocked → Sold Value).
  type SortKey =
    | "lifetime_stocked_qty"
    | "total_sold_qty"
    | "total_returned_qty"
    | "current_stock_qty"
    | "current_stock_value"
    | "sold_value";
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Same column: toggle max→min / min→max.
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc"); // first click shows max → min
    }
    setCurrentPage(1);
  };

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "desc" ? " ▼" : " ▲") : "";

  const rows: ReportRow[] = response?.data || [];

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const base = !q
      ? rows
      : rows.filter(
          (r) =>
            r.product_name?.toLowerCase().includes(q) ||
            r.sku?.toLowerCase().includes(q) ||
            (r.company_name || "").toLowerCase().includes(q)
        );

    if (!sortKey) return base;
    return [...base].sort((a, b) => {
      const diff = (Number(a[sortKey]) || 0) - (Number(b[sortKey]) || 0);
      return sortDir === "asc" ? diff : -diff;
    });
  }, [rows, searchTerm, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const current = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text("Product Wise Report", 40, 40);
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`Total products: ${filtered.length}`, 40, 58);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 72);

    autoTable(doc, {
      startY: 88,
      head: [[
        "#", "Product", "SKU", "Company",
        "Lifetime Stocked", "Total Sold", "Returned", "Current Stock",
        "Stock Value", "Sold Value",
      ]],
      body: filtered.map((r, i) => [
        i + 1,
        r.product_name,
        r.sku,
        r.company_name || "",
        num(r.lifetime_stocked_qty),
        num(r.total_sold_qty),
        num(r.total_returned_qty),
        num(r.current_stock_qty),
        money(r.current_stock_value),
        money(r.sold_value),
      ]),
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [26, 58, 82], textColor: 255 },
      columnStyles: {
        0: { halign: "right", cellWidth: 24 },
        4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" },
        7: { halign: "right" }, 8: { halign: "right" }, 9: { halign: "right" },
      },
    });
    doc.save(`product_wise_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <h3 className="font-semibold mb-2">Error loading report</h3>
          <button onClick={() => refetch()} className="mt-2 px-4 py-2 bg-red-600 text-white rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 text-white">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Product Wise Report</h1>
          <p className="text-gray-300">
            Lifetime stocked, sold, returned and current stock per product
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by product, SKU or company..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full md:w-96 px-4 py-2 bg-[#3a3c44] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#2c2e34]">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase">Product</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase">SKU</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase">Company</th>
                <th
                  onClick={() => handleSort("lifetime_stocked_qty")}
                  className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase cursor-pointer select-none hover:text-white"
                >
                  Lifetime Stocked{sortArrow("lifetime_stocked_qty")}
                </th>
                <th
                  onClick={() => handleSort("total_sold_qty")}
                  className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase cursor-pointer select-none hover:text-white"
                >
                  Total Sold{sortArrow("total_sold_qty")}
                </th>
                <th
                  onClick={() => handleSort("total_returned_qty")}
                  className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase cursor-pointer select-none hover:text-white"
                >
                  Returned{sortArrow("total_returned_qty")}
                </th>
                <th
                  onClick={() => handleSort("current_stock_qty")}
                  className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase cursor-pointer select-none hover:text-white"
                >
                  Current Stock{sortArrow("current_stock_qty")}
                </th>
                <th
                  onClick={() => handleSort("current_stock_value")}
                  className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase cursor-pointer select-none hover:text-white"
                >
                  Stock Value{sortArrow("current_stock_value")}
                </th>
                <th
                  onClick={() => handleSort("sold_value")}
                  className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase cursor-pointer select-none hover:text-white"
                >
                  Sold Value{sortArrow("sold_value")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {current.map((r) => (
                <tr key={r.product_id} className="hover:bg-[#2c2e34] transition">
                  <td className="px-3 py-3 text-sm font-medium text-white">{r.product_name}</td>
                  <td className="px-3 py-3 text-sm text-gray-300">{r.sku}</td>
                  <td className="px-3 py-3 text-sm text-gray-300">{r.company_name || "N/A"}</td>
                  <td className="px-3 py-3 text-sm text-right text-purple-300 tabular-nums">{num(r.lifetime_stocked_qty)}</td>
                  <td className="px-3 py-3 text-sm text-right text-green-300 tabular-nums">{num(r.total_sold_qty)}</td>
                  <td className="px-3 py-3 text-sm text-right text-amber-300 tabular-nums">{num(r.total_returned_qty)}</td>
                  <td className={`px-3 py-3 text-sm text-right tabular-nums font-semibold ${r.current_stock_qty < 0 ? "text-red-400" : "text-white"}`}>
                    {num(r.current_stock_qty)}
                  </td>
                  <td className="px-3 py-3 text-sm text-right text-gray-200 tabular-nums">৳{money(r.current_stock_value)}</td>
                  <td className="px-3 py-3 text-sm text-right text-gray-200 tabular-nums">৳{money(r.sold_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">No products found</div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-4 bg-[#2c2e34] border-t border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-[#3a3c44] text-white rounded hover:bg-[#4a4c54] disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-purple-600 text-white rounded">{currentPage}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
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
