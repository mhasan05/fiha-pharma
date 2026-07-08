"use client"

import { useAllDashboardQuery } from "@/redux/feature/dashboardSlice"
import { useLowStockCountQuery } from "@/redux/feature/notificationSlice"
import { useMemo } from "react"
import Link from "next/link"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { ChevronRight } from "lucide-react"

interface LowStockProduct {
  stock_quantity: number
  out_of_stock?: boolean
}

export default function InventoryHealthChart() {
  const { data: dashboard } = useAllDashboardQuery(undefined)
  const { data: lowStock, isLoading } = useLowStockCountQuery(undefined)

  const stats = useMemo(() => {
    const totalProducts = Number(dashboard?.data?.total_products) || 0
    const lowStockTotal = Number(lowStock?.low_stock_product_count) || 0
    const products: LowStockProduct[] = lowStock?.data || []
    const outOfStock = products.filter(
      (p) => Number(p.stock_quantity) <= 0
    ).length
    const critical = Math.max(0, products.length - outOfStock)
    const healthy = Math.max(0, totalProducts - lowStockTotal)

    return {
      total: totalProducts,
      healthy,
      critical,
      outOfStock,
    }
  }, [dashboard, lowStock])

  if (isLoading) {
    return (
      <div className="h-56 w-full flex items-center justify-center text-sm text-gray-500">
        Loading...
      </div>
    )
  }

  if (stats.total === 0) {
    return (
      <div className="h-56 w-full flex items-center justify-center text-sm text-gray-500">
        No products in inventory
      </div>
    )
  }

  const data = [
    { name: "Healthy", value: stats.healthy, color: "#10b981" },
    { name: "Critical", value: stats.critical, color: "#f59e0b" },
    { name: "Out of Stock", value: stats.outOfStock, color: "#ef4444" },
  ].filter((d) => d.value > 0)

  const healthyPct =
    stats.total > 0 ? (stats.healthy / stats.total) * 100 : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
      {/* Donut */}
      <div className="relative h-44 sm:h-52 sm:col-span-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "#1a1c20",
                border: "1px solid #374151",
                borderRadius: 6,
                fontSize: 12,
                color: "#fff",
                padding: "8px 12px",
              }}
              itemStyle={{ color: "#fff" }}
              labelStyle={{ color: "#9CA3AF" }}
              formatter={(v: number | string, _n, entry: any) => [
                `${Number(v).toLocaleString()} products`,
                entry?.payload?.name || "",
              ]}
            />
            <Pie
              data={data}
              dataKey="value"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              stroke="#23252b"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">
            {stats.total.toLocaleString()}
          </div>
          <div className="text-[9px] text-gray-400 uppercase tracking-wider">
            Total Products
          </div>
        </div>
      </div>

      {/* Right column: status breakdown with action links */}
      <div className="sm:col-span-3 space-y-2">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] text-emerald-300/80 uppercase tracking-wider">
              Stock Health
            </span>
            <span className="text-sm font-bold text-emerald-400 tabular-nums">
              {healthyPct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 w-full h-1.5 bg-gray-700/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, healthyPct)}%` }}
            />
          </div>
        </div>

        <Link href="/products" className="block group">
          <div className="rounded-lg border border-gray-700/60 hover:border-emerald-500/40 bg-[#1a1c20] px-3 py-2 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="flex-1 text-xs text-gray-300">Healthy</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {stats.healthy.toLocaleString()}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-emerald-400 shrink-0" />
            </div>
          </div>
        </Link>

        <Link href="/products/low-stock" className="block group">
          <div className="rounded-lg border border-gray-700/60 hover:border-amber-500/40 bg-[#1a1c20] px-3 py-2 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="flex-1 text-xs text-gray-300">Critical</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {stats.critical.toLocaleString()}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-amber-400 shrink-0" />
            </div>
          </div>
        </Link>

        <Link href="/products/low-stock" className="block group">
          <div className="rounded-lg border border-gray-700/60 hover:border-red-500/40 bg-[#1a1c20] px-3 py-2 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              <span className="flex-1 text-xs text-gray-300">Out of Stock</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {stats.outOfStock.toLocaleString()}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 shrink-0" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
