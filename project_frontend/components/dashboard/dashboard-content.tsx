
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAllDashboardQuery } from "@/redux/feature/dashboardSlice";
import { useNegativeStockProductsQuery } from "@/redux/feature/notificationSlice";
import SalesChart from "@/components/charts/sales-chart";
import RevenueChart from "@/components/charts/revenue-chart";
import {
  CircleDollarSign,
  Receipt,
  TrendingUp,
  Tag,
  Boxes,
  Layers,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";

type Period = "all" | "today" | "month" | "year" | "range";

const PERIOD_LABELS: Record<Period, string> = {
  all: "All Time",
  today: "Today",
  month: "This Month",
  year: "This Year",
  range: "Custom Range",
};

// Human-readable date like "1 June 2026".
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

// Format a Date as local "YYYY-MM-DDTHH:MM:SS" (matches the orders API format).
const toApi = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export default function DashboardContent() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Resolve the active period into a from/to range. Period boundaries are
  // stable within a given day, so the query args don't churn between renders.
  const range = useMemo<{ from_datetime?: string; to_datetime?: string }>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    if (period === "today") {
      return {
        from_datetime: toApi(new Date(y, m, d, 0, 0, 0)),
        to_datetime: toApi(new Date(y, m, d, 23, 59, 59)),
      };
    }
    if (period === "month") {
      return {
        from_datetime: toApi(new Date(y, m, 1, 0, 0, 0)),
        to_datetime: toApi(new Date(y, m + 1, 0, 23, 59, 59)),
      };
    }
    if (period === "year") {
      return {
        from_datetime: toApi(new Date(y, 0, 1, 0, 0, 0)),
        to_datetime: toApi(new Date(y, 11, 31, 23, 59, 59)),
      };
    }
    if (period === "range" && startDate && endDate) {
      return {
        from_datetime: toApi(new Date(`${startDate}T00:00:00`)),
        to_datetime: toApi(new Date(`${endDate}T23:59:59`)),
      };
    }
    return {};
  }, [period, startDate, endDate]);

  const { data: dashboard, isLoading, isError, isFetching } = useAllDashboardQuery(range);
  const { data: negativeStock } = useNegativeStockProductsQuery(undefined);

  // Period label for the report: This Month / This Year show the actual
  // date span from the period's start up to today (e.g. "1 June 2026 to 14 June 2026").
  const periodLabel = (() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    if (period === "today") return fmtDate(today);
    if (period === "month") return `${fmtDate(new Date(y, m, 1))} to ${fmtDate(today)}`;
    if (period === "year") return `${fmtDate(new Date(y, 0, 1))} to ${fmtDate(today)}`;
    if (period === "range" && startDate && endDate)
      return `${fmtDate(new Date(`${startDate}T00:00:00`))} to ${fmtDate(
        new Date(`${endDate}T00:00:00`)
      )}`;
    return PERIOD_LABELS[period]; // All Time
  })();

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const handleDownloadPDF = async () => {
    const data = dashboard?.data;
    if (!data) return;

    const moneyFmt = (v: number) =>
      `${new Intl.NumberFormat("en-BD", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(Number(v) || 0)} BDT`;
    const unitFmt = (v: number) =>
      new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(Number(v) || 0);

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;

    // ---- Letterhead: logo + company name + contact info ----
    const logo = await loadImage(`${window.location.origin}/invoicelogo.jpg`);
    let logoWidth = 0;
    if (logo) {
      // Preserve the logo's natural aspect ratio; constrain by height and a max width.
      const maxHeight = 50;
      const maxWidth = 120;
      const ratio = logo.naturalWidth / logo.naturalHeight || 1;
      let h = maxHeight;
      let w = h * ratio;
      if (w > maxWidth) {
        w = maxWidth;
        h = w / ratio;
      }
      logoWidth = w;
      doc.addImage(logo, "JPEG", marginX, 28, w, h);
    }

    const brandX = marginX + (logoWidth ? logoWidth + 14 : 0);
    doc.setTextColor(26, 58, 82);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Fiha Pharma", brandX, 48);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text("Wholesale Pharmaceutical Supplier", brandX, 62);

    // Contact info (right aligned)
    doc.setFontSize(9);
    doc.setTextColor(75);
    doc.text("Phone: 01558920438", pageWidth - marginX, 74, { align: "right" });
    doc.text(
      "Holding No-58, Word No-45, Helal Market, Uttar Khan, Uttara, Dhaka-1230",
      pageWidth - marginX,
      86,
      { align: "right" }
    );

    // Divider
    doc.setDrawColor(26, 58, 82);
    doc.setLineWidth(1.5);
    doc.line(marginX, 96, pageWidth - marginX, 96);

    // ---- Report title + meta ----
    doc.setTextColor(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Dashboard Summary", marginX, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`Period: ${periodLabel}`, marginX, 136);
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, 150);

    autoTable(doc, {
      startY: 166,
      head: [["Metric", "Value"]],
      body: [
        ["Total Stock (lifetime value)", moneyFmt(data.lifetime_stock_amount)],
        ["Current Stock (value)", moneyFmt(data.grand_total_product_cost_price)],
        ["Sell Unit", unitFmt(data.total_sell_units)],
        ["Total Sell", moneyFmt(data.total_sales)],
        ["Total Profit", moneyFmt(data.total_profit)],
      ],
      styles: { fontSize: 11, cellPadding: 8 },
      headStyles: { fillColor: [26, 58, 82], textColor: 255 },
      columnStyles: { 1: { halign: "right" } },
    });

    doc.save(`dashboard_${period}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Handle loading and error states
  if (isLoading) return <div>Loading...</div>;
  if (isError || !dashboard?.data) return <div>Error loading data</div>;

  const formatStatValue = (title: string, value: number) => {
    const safeValue = Number(value) || 0;
    const isMoney =
      title === "Total Sell (Selling Price)" ||
      title === "Total Sell (Cost Price)" ||
      title === "Total Discount Applied" ||
      title === "Total Profit" ||
      title === "Current Stock (Cost Price)" ||
      title === "Lifetime Stock (Cost Price)" ||
      title === "Negative Stock (Cost Price)";

    if (isMoney) {
      return `${new Intl.NumberFormat("en-BD", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(safeValue)} BDT`;
    }

    return new Intl.NumberFormat("en-BD", {
      maximumFractionDigits: 0,
    }).format(safeValue);
  };

  const totalProfit = Number(dashboard?.data?.total_profit) || 0;

  const negativeStockCost = Number(negativeStock?.total_restock_cost) || 0;

  type StatCard = { title: string; value: number; icon: string; href?: string; Icon?: LucideIcon };

  // Financial cards — shown in the main dashboard section.
  // Row 1 is the P&L equation: Selling − Cost = Profit.
  const financialCards: StatCard[] = [
    { title: "Total Sell (Selling Price)", value: dashboard?.data?.total_sales || 0, icon: "💰", Icon: CircleDollarSign },
    { title: "Total Sell (Cost Price)", value: dashboard?.data?.total_sell_cost_price || 0, icon: "🧾", Icon: Receipt },
    { title: "Total Profit", value: totalProfit, icon: "💵", Icon: TrendingUp },
    { title: "Total Discount Applied", value: dashboard?.data?.total_discount || 0, icon: "🏷️", Icon: Tag },
    { title: "Current Stock (Cost Price)", value: dashboard?.data?.grand_total_product_cost_price || 0, icon: "💰", Icon: Boxes },
    { title: "Lifetime Stock (Cost Price)", value: dashboard?.data?.lifetime_stock_amount || 0, icon: "💰", Icon: Layers },
    { title: "Negative Stock (Cost Price)", value: negativeStockCost, icon: "📉", href: "/products/negative-stock", Icon: TrendingDown },
  ];

  // Operational / count cards — shown in the Overview panel beside the chart.
  const overviewCards: StatCard[] = [
    { title: "Pending Order", value: dashboard?.data?.total_pending_orders || 0, icon: "⏳", href: "/orders" },
    { title: "Sell Unit", value: dashboard?.data?.total_sell_units || 0, icon: "📤" },
    { title: "Total Product", value: dashboard?.data?.total_products || 0, icon: "📦", href: "/products" },
    { title: "Total Customer", value: dashboard?.data?.total_customers || 0, icon: "👥", href: "/user" },
  ];

  // Calculate total quantity sold for percentage calculation
  const totalSold = dashboard.data.top_selling_product.reduce(
    (sum: number, item: { total_quantity_sold: number }) =>
      sum + item.total_quantity_sold,
    0
  );

  // Map top_selling_product to mostSoldItems with quantity and percentage
  type MostSoldItem = {
    name: string;
    quantity: number;
    percentage: number;
  };

  const mostSoldItems: MostSoldItem[] = dashboard.data.top_selling_product.map(
    (item: { product_name: string; total_quantity_sold: number }) => ({
      name: item.product_name,
      quantity: Number(item.total_quantity_sold) || 0,
      percentage:
        totalSold > 0
          ? Number(((item.total_quantity_sold / totalSold) * 100).toFixed(1))
          : 0,
    })
  );

  return (
    <div className="p-3 sm:p-4 lg:p-6 flex gap-4 ">
      <div className="flex-1 min-w-0 w-full">
        {/* Filter + Download bar */}
        <div className="mb-4 flex flex-wrap items-end gap-3 bg-gray-800 border border-gray-700 rounded-lg p-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="px-3 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm"
            >
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <option key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {period === "range" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {isFetching && <span className="text-xs text-gray-400">Updating…</span>}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-sm"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>

        {/* Financial Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {financialCards.map((card, index) => (
            <Card
              key={card.title}
              onClick={() => card.href && router.push(card.href)}
              className={`bg-gray-800 border-gray-700 ${card.href ? "cursor-pointer hover:bg-gray-700/60 transition" : ""}`}
            >
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 min-w-0">
                <div className="shrink-0">
                  <div
                    className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center ${card.title === "Negative Stock (Cost Price)"
                      ? "bg-red-500/15 text-red-400"
                      : card.title === "Total Profit"
                        ? "bg-green-500/15 text-green-400"
                        : "bg-purple-500/15 text-purple-300"
                      }`}
                  >
                    {card.Icon && <card.Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />}
                  </div>
                </div>
                <div className="flex flex-col min-w-0 w-full">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1">
                    {card.title}
                  </div>
                  <div
                    className={`text-sm sm:text-xl lg:text-2xl font-bold leading-tight break-words min-w-0 ${card.title === "Negative Stock (Cost Price)" ? "text-red-400" : "text-white"
                      }`}
                  >
                    {formatStatValue(card.title, Number(card.value))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Sales Analytics */}
          <Card className="bg-[#23252b] border-gray-700 xl:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-white text-lg">Sales vs Profit Analytics</CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Monthly sales and profit overview
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SalesChart />
            </CardContent>
          </Card>

          {/* Overview panel (operational counts) */}
          <Card className="bg-[#23252b] border-gray-700 xl:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Overview</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Customers, products & orders</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {overviewCards.map((card) => (
                <div
                  key={card.title}
                  onClick={() => card.href && router.push(card.href)}
                  className={`flex items-center gap-3 rounded-lg bg-gray-800 border border-gray-700 p-3 ${card.href ? "cursor-pointer hover:bg-gray-700/60 transition" : ""
                    }`}
                >
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-orange-500/20 flex items-center justify-center text-xl">
                    {card.icon}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm text-gray-400">{card.title}</span>
                    <span className="text-lg sm:text-xl font-bold text-white leading-tight break-words">
                      {formatStatValue(card.title, Number(card.value))}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Revenue (current month) */}
          {(() => {
            const monthLong = new Date().toLocaleString("en-US", { month: "long" });
            const monthShort = new Date().toLocaleString("en-US", { month: "short" }).toLowerCase();
            const profitByMonth: { month: string; revenue: number }[] =
              dashboard?.data?.profit_by_month || [];
            const currentMonthProfit =
              profitByMonth.find((p) =>
                p.month?.toLowerCase().startsWith(monthShort)
              )?.revenue ??
              dashboard?.data?.monthly_revenue?.[0]?.total_revenue ??
              0;
            return (
              <Card className="bg-[#23252b] border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-white text-lg">
                        Profit ({monthLong})
                      </CardTitle>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Sales vs profit for the current month
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                        This Month
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-white">
                        ৳{Number(currentMonthProfit).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <RevenueChart />
                </CardContent>
              </Card>
            );
          })()}

          {/* Most Sold Items */}
          <Card className="bg-[#23252b] border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-white text-lg">Most Sold Items</CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Top performers by units sold</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Units</div>
                  <div className="text-base sm:text-lg font-semibold text-white tabular-nums">
                    {totalSold.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {mostSoldItems.length === 0 ? (
                <div className="text-sm text-gray-500 py-8 text-center">No sales data yet</div>
              ) : (
                <div className="space-y-3">
                  {mostSoldItems.map((item: MostSoldItem, idx: number) => {
                    const rankStyle =
                      idx === 0
                        ? { badge: "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/40", bar: "bg-yellow-400" }
                        : idx === 1
                          ? { badge: "bg-gray-400/15 text-gray-300 ring-1 ring-gray-400/40", bar: "bg-gray-300" }
                          : idx === 2
                            ? { badge: "bg-orange-600/15 text-orange-400 ring-1 ring-orange-600/40", bar: "bg-orange-400" }
                            : { badge: "bg-gray-700/60 text-gray-400", bar: "bg-emerald-500" };
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <div
                          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${rankStyle.badge}`}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <span className="text-sm text-white truncate" title={item.name}>{item.name}</span>
                            <div className="flex items-baseline gap-2 shrink-0">
                              <span className="text-[11px] text-gray-400 tabular-nums">
                                {item.quantity.toLocaleString()} units
                              </span>
                              <span className="text-sm font-semibold text-white tabular-nums">
                                {item.percentage}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-gray-700/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${rankStyle.bar}`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}