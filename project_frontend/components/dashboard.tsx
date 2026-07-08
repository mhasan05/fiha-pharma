"use client"

import { useState } from "react"
import { Search, Bell, ChevronRight, Trash2, Filter, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import SalesChart from "@/components/sales-chart"
import RevenueChart from "@/components/revenue-chart"
import MostSellingChart from "@/components/most-selling-chart"

const sidebarItems = [
  { name: "Dashboard", active: true },
  { name: "Products", active: false },
  { name: "Orders", active: false },
  { name: "Notice", active: false },
  { name: "User", active: false },
  { name: "Area", active: false },
  { name: "Settings", active: false },
]

const statsCards = [
  { title: "Total Users", value: "40,689", icon: "👥" },
  { title: "Total Product", value: "40,689", icon: "📦" },
  { title: "Total Sell", value: "40,689", icon: "💰" },
  { title: "Total Revenue", value: "40,689", icon: "💵" },
  { title: "Pending Order", value: "40", icon: "⏳" },
]

const notifications = [
  {
    id: 1,
    type: "user",
    message: "New Customer Registration",
    time: "5 mins ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  { id: 2, type: "alert", message: "Stock Alert", time: "5 mins ago", avatar: "/placeholder.svg?height=32&width=32" },
  { id: 3, type: "order", message: "Order Placed", time: "5 mins ago", avatar: "/placeholder.svg?height=32&width=32" },
  { id: 4, type: "order", message: "Order Placed", time: "5 mins ago", avatar: "/placeholder.svg?height=32&width=32" },
  {
    id: 5,
    type: "user",
    message: "New Customer Registration",
    time: "5 mins ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  { id: 6, type: "order", message: "Order Placed", time: "5 mins ago", avatar: "/placeholder.svg?height=32&width=32" },
  {
    id: 7,
    type: "user",
    message: "New Customer Registration",
    time: "5 mins ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  { id: 8, type: "alert", message: "Stock Alert", time: "5 mins ago", avatar: "/placeholder.svg?height=32&width=32" },
  { id: 9, type: "alert", message: "Stock Alert", time: "5 mins ago", avatar: "/placeholder.svg?height=32&width=32" },
]

const mostSoldItems = [
  { name: "Jeans", percentage: 70, color: "bg-green-500" },
  { name: "Shirts", percentage: 40, color: "bg-purple-500" },
  { name: "Belts", percentage: 60, color: "bg-green-500" },
  { name: "Caps", percentage: 80, color: "bg-green-500" },
  { name: "Others", percentage: 20, color: "bg-red-500" },
]

// Sidebar Component
function Sidebar({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-800 p-4 flex flex-col h-full ${className}`}>
      {/* Logo */}
      <div className="flex items-center mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-purple-500 to-green-500 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold text-lg">G</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        {sidebarItems.map((item) => (
          <div
            key={item.name}
            className={`flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
              item.active ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <span>{item.name}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        ))}
      </nav>

      {/* Log Out */}
      <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-900/20 justify-start p-3">
        Log Out
      </Button>
    </div>
  )
}

// Notifications Panel Component
function NotificationsPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-800 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Notification</h2>
        <Button variant="ghost" size="sm" className="text-gray-400">
          See All
        </Button>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        {notifications.map((notification) => (
          <div key={notification.id} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={notification.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {notification.type === "user" ? "👤" : notification.type === "alert" ? "⚠️" : "📦"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-300 truncate">{notification.message}</div>
              <div className="text-xs text-gray-500">{notification.time}</div>
            </div>

            <div className="flex space-x-1 flex-shrink-0">
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6 text-gray-400 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6 text-gray-400">
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("Jan - Jun '22")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 bg-gray-800 border-gray-700 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 bg-gray-800 border-gray-700 w-64">
                <Sidebar />
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search"
                className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-48 sm:w-60 lg:w-80"
              />
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>

            <Button variant="ghost" size="sm" className="sm:hidden p-2">
              <Search className="w-5 h-5" />
            </Button>

            <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-2">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center p-0">
                    1
                  </Badge>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 bg-gray-800 border-gray-700 w-80">
                <NotificationsPanel />
              </SheetContent>
            </Sheet>

            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Dashboard Content */}
          <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {statsCards.map((card, index) => (
                <Card key={card.title} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                          index === 4 ? "bg-red-500/20" : "bg-orange-500/20"
                        }`}
                      >
                        <span className="text-sm sm:text-lg">{card.icon}</span>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-1">{card.title}</div>
                    <div className={`text-lg sm:text-2xl font-bold ${index === 4 ? "text-red-400" : "text-white"}`}>
                      {card.value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* Sales Analytics */}
              <div className="xl:col-span-2">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-white text-lg">Sales Analytics</CardTitle>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <Button variant="ghost" size="sm" className="text-gray-400 text-xs sm:text-sm px-2 sm:px-3">
                          Daily
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 text-xs sm:text-sm px-2 sm:px-3">
                          Weekly
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 text-xs sm:text-sm px-2 sm:px-3">
                          Monthly
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 text-xs sm:text-sm px-2 sm:px-3">
                          Yearly
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SalesChart />
                  </CardContent>
                </Card>
              </div>

              {/* Most Selling */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2 sm:pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">Most Selling</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 bg-gray-700 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      {selectedPeriod}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <MostSellingChart />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Total Revenue */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-white text-lg">Total Revenue</CardTitle>
                  <div className="text-2xl sm:text-3xl font-bold text-white">$50.4K</div>
                  <div className="text-sm text-green-400">↗ 5% than last month</div>
                </CardHeader>
                <CardContent>
                  <RevenueChart />
                </CardContent>
              </Card>

              {/* Most Sold Items */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-white text-lg">Most Sold Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {mostSoldItems.map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{item.name}</span>
                        <span className="text-white">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Desktop Notifications Sidebar */}
          <div className="hidden xl:block w-80 border-l border-gray-700">
            <NotificationsPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
