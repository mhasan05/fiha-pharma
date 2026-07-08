"use client";

import Link from "next/link";
import { Wallet, Package, Users, TrendingUp, AlertTriangle, RotateCcw } from "lucide-react";
import { useDeliveryReportQuery, useAdminDepositsQuery } from "@/redux/feature/deliverySlice";
import PeriodFilter, { usePeriod } from "@/components/delivery/period-filter";

const money = (v: number) =>
  `৳${new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(v) || 0)}`;
const num = (v: number) => new Intl.NumberFormat("en-BD").format(Number(v) || 0);

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={`bg-[#3a3c44] p-4 rounded-lg border-l-4 ${accent}`}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

const links = [
  { name: "Assignment", href: "/delivery/assignment", desc: "Assign shipped orders to agents", icon: Package },
  { name: "Collections", href: "/delivery/collections", desc: "By delivery man & customer", icon: Wallet },
  { name: "Dues", href: "/delivery/dues", desc: "Customer & delivery-man dues", icon: AlertTriangle },
  { name: "Returns", href: "/delivery/returns", desc: "By product, reason & agent", icon: RotateCcw },
  { name: "Performance", href: "/delivery/performance", desc: "Success rate per agent", icon: TrendingUp },
  { name: "Deposit Approvals", href: "/delivery/deposits", desc: "Approve / reject cash deposits", icon: Users },
];

export default function DeliveryOverview() {
  const period = usePeriod();
  const { data: perf, isFetching } = useDeliveryReportQuery({ name: "delivery_performance", ...period.range });
  const { data: coll } = useDeliveryReportQuery({ name: "collection_summary", ...period.range });
  const { data: dues } = useDeliveryReportQuery({ name: "due_summary", ...period.range });
  const { data: deposits } = useAdminDepositsQuery({ status: "pending" });

  const p = perf?.summary || {};
  const c = coll?.summary || {};
  const d = dues?.summary || {};
  const pendingDeposits = deposits?.count ?? 0;

  return (
    <div className="px-4 py-8 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Delivery Overview</h1>
        <p className="text-gray-300">Live health of the delivery & cash-collection operation</p>
      </div>

      <PeriodFilter state={period} fetching={isFetching} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Pending Deliveries" value={num(p.pending_deliveries)} accent="border-amber-500" />
        <Kpi label="Delivery Success Rate" value={`${p.success_rate ?? 0}%`} accent="border-green-500" />
        <Kpi label="Today's Collection" value={money(c.today_collection)} accent="border-purple-500" />
        <Kpi label="Total Collection" value={money(c.total_collection)} accent="border-purple-400" />
        <Kpi label="Customer Dues" value={money(d.total_customer_due)} accent="border-red-500" />
        <Kpi label="Delivery-man Cash-in-hand" value={money(d.total_delivery_man_due)} accent="border-purple-500" />
        <Kpi label="Pending Deposits" value={num(pendingDeposits)} accent="border-yellow-500" />
        <Kpi label="Delivered (total)" value={num(p.delivered)} accent="border-teal-500" />
      </div>

      <h2 className="text-lg font-semibold mb-3">Manage</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:bg-gray-700/60 transition h-full">
              <div className="flex items-center gap-3 mb-2">
                <l.icon className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-semibold">{l.name}</h3>
              </div>
              <p className="text-sm text-gray-400">{l.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
