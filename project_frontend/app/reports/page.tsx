import Link from "next/link";
import { BarChart3, Package, ShoppingCart, Users } from "lucide-react";

const reports = [
  {
    name: "Product Wise",
    href: "/reports/product-wise",
    description: "Lifetime stocked, sold, returned and current stock per product.",
    icon: Package,
  },
  {
    name: "Order Report",
    href: "/reports/order",
    description: "Invoice, return, collection and due per order — filter by date, customer or area.",
    icon: ShoppingCart,
  },
  {
    name: "Customer Wise",
    href: "/reports/customer-balance",
    description: "Each customer's total order amount, collected and outstanding due.",
    icon: Users,
  },
];

export default function ReportsPage() {
  return (
    <div className="px-4 py-8 text-white">
      <div className="mb-6 flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-purple-400" />
        <h1 className="text-3xl font-bold">Reports</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <Link key={r.href} href={r.href}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:bg-gray-700/60 transition cursor-pointer h-full">
              <div className="flex items-center gap-3 mb-2">
                <r.icon className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold">{r.name}</h2>
              </div>
              <p className="text-sm text-gray-400">{r.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
