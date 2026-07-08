"use client"

import { useAllDashboardQuery } from "@/redux/feature/dashboardSlice"
import { useMemo } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const compact = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

interface SalesPoint {
  month: string
  total_sales: number
}
interface ProfitPoint {
  month: string
  revenue: number
}

export default function SalesChart() {
  const { data: dashboard, isLoading } = useAllDashboardQuery(undefined)

  const data = useMemo(() => {
    const sales: SalesPoint[] = dashboard?.data?.sales_by_month || []
    const profit: ProfitPoint[] = dashboard?.data?.profit_by_month || []
    return MONTHS.map((m) => {
      const prefix = m.toLowerCase().slice(0, 3)
      const s = sales.find((x) => x.month?.toLowerCase().startsWith(prefix))
      const p = profit.find((x) => x.month?.toLowerCase().startsWith(prefix))
      return {
        month: m,
        sales: Number(s?.total_sales) || 0,
        profit: Number(p?.revenue) || 0,
      }
    })
  }, [dashboard])

  const ytdTotal = data.reduce((s, d) => s + d.sales + d.profit, 0)

  return (
    <div>
      {/* Chart */}
      <div className="w-full h-56 sm:h-64 lg:h-72">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
            Loading chart...
          </div>
        ) : ytdTotal === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
            No sales data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 12, bottom: 4, left: -8 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#9CA3AF"
                fontSize={11}
                axisLine={false}
                tickLine={false}
                dy={4}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={11}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => compact(Number(v))}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1c20",
                  border: "1px solid #374151",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#fff",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "#9CA3AF", marginBottom: 4 }}
                cursor={{ stroke: "#4b5563", strokeWidth: 1, strokeDasharray: "3 3" }}
                formatter={(v: number | string, name: string) => [
                  `৳${Number(v).toLocaleString()}`,
                  name === "profit" ? "Profit" : "Sales",
                ]}
              />
              <Legend
                verticalAlign="top"
                height={28}
                iconType="circle"
                formatter={(value) => (
                  <span style={{ color: "#9CA3AF", fontSize: 12 }}>
                    {value === "profit" ? "Profit" : "Sales"}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#salesGradient)"
                dot={{ r: 3, fill: "#10b981", stroke: "#0f1f1a", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fill="url(#profitGradient)"
                dot={{ r: 3, fill: "#f59e0b", stroke: "#0f1f1a", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
