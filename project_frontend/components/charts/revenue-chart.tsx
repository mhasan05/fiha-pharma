"use client"

import { useAllDashboardQuery } from "@/redux/feature/dashboardSlice"
import { useMemo } from "react"
import {
  Bar,
  BarChart,
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

interface SalesPoint { month: string; total_sales: number }
interface ProfitPoint { month: string; revenue: number }

export default function RevenueChart() {
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

  const total = data.reduce((sum, d) => sum + d.sales + d.profit, 0)

  return (
    <div className="w-full h-56 sm:h-60 lg:h-64">
      {isLoading ? (
        <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
          Loading chart...
        </div>
      ) : total === 0 ? (
        <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
          No revenue data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: -8 }} barCategoryGap={6}>
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
              cursor={{ fill: "rgba(75, 85, 99, 0.15)" }}
              formatter={(v: number | string, name: string) => [
                `৳${Number(v).toLocaleString()}`,
                name === "sales" ? "Sales" : "Profit",
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 6, color: "#9CA3AF" }}
              formatter={(v) => (v === "sales" ? "Sales" : "Profit")}
            />
            <Bar dataKey="sales" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={22} />
            <Bar dataKey="profit" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
