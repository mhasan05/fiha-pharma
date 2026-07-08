// "use client";

// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { 
//   ChevronRight, 
//   ChevronDown, 
//   LogOut, 
//   ShoppingCart, 
//   Settings, 
//   RotateCcw,
//   Package,
//   AlertTriangle,
//   TrendingDown,
//   BarChart3,
//   LayoutDashboard,
//   Users,
//   MapPin,
//   Tag,
//   Building2,
//   FlaskConical,
//   Boxes,
//   Layers,
//   FileText
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import Image from "next/image";
// import { logout } from "@/service/authService";
// import { toast } from "sonner";
// import { useState, useEffect } from "react";
// import {
//   useSettingDataQuery,
//   useUserProfileQuery,
// } from "@/redux/feature/userSlice";

// // Menu items with their submenus
// const menuItems = [
//   { 
//     name: "Dashboard", 
//     href: "/", 
//     icon: LayoutDashboard,
//     hasSubmenu: false 
//   },
//   { 
//     name: "Products", 
//     href: "/products", 
//     icon: Package,
//     hasSubmenu: true,
//     submenu: [
//       { name: "All Products", href: "/products", icon: Package },
//       { name: "Low Stock", href: "/products/low-stock", icon: AlertTriangle },
//     ]
//   },
//   { 
//     name: "Orders", 
//     href: "/orders", 
//     icon: ShoppingCart,
//     hasSubmenu: true,
//     submenu: [
//       { name: "All Orders", href: "/orders", icon: ShoppingCart },
//       { name: "Area Wise Orders", href: "/orders/area-wise", icon: RotateCcw },
//     ]
//   },
//   { 
//     name: "Notice", 
//     href: "/notice", 
//     icon: FileText,
//     hasSubmenu: false 
//   },
//   { 
//     name: "User", 
//     href: "/user", 
//     icon: Users,
//     hasSubmenu: false 
//   },
//   { 
//     name: "Area", 
//     href: "/area", 
//     icon: MapPin,
//     hasSubmenu: false 
//   },
//   { 
//     name: "Category", 
//     href: "/category", 
//     icon: Tag,
//     hasSubmenu: false 
//   },
//   { 
//     name: "Company", 
//     href: "/company", 
//     icon: Building2,
//     hasSubmenu: false 
//   },
//   { 
//     name: "Generic", 
//     href: "/generic", 
//     icon: FlaskConical,
//     hasSubmenu: false 
//   },
//   { 
//     name: "Banner", 
//     href: "/banner", 
//     icon: Image,
//     hasSubmenu: false 
//   },
//   { 
//     name: "Stock", 
//     href: "/stock", 
//     icon: Boxes,
//     hasSubmenu: false 
//   },
//   { 
//     name: "Batch", 
//     href: "/batch", 
//     icon: Layers,
//     hasSubmenu: false 
//   },
//   { 
//     name: "Privacy Policy", 
//     href: "/privacy-policy", 
//     icon: FileText,
//     hasSubmenu: false 
//   },
//   { 
//     name: "Settings", 
//     href: "/settings", 
//     icon: Settings,
//     hasSubmenu: true,
//     submenu: [
//       { name: "General", href: "/settings" },
//       { name: "Discount", href: "/settings/discounts" },
//     ]
//   },
// ];

// export default function Sidebar({ className = "" }: { className?: string }) {
//   const pathname = usePathname();
//   const router = useRouter();

//   const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

//   const { data } = useSettingDataQuery(undefined);
//   const { data: profileData } = useUserProfileQuery(undefined);

//   const canViewUserRoute = Boolean(
//     profileData?.is_superuser &&
//     profileData?.is_staff &&
//     profileData?.role === "admin"
//   );

//   // Initialize expanded states based on current path
//   useEffect(() => {
//     const newExpandedState: Record<string, boolean> = {};
    
//     menuItems.forEach(item => {
//       if (item.hasSubmenu && item.submenu) {
//         // Check if current path matches any submenu item or is a subpath of the main route
//         const isAnySubActive = item.submenu.some(sub => {
//           // For parent route exactly (like /products)
//           if (pathname === sub.href) return true;
//           // For sub-routes (like /products/low-stock)
//           if (pathname.startsWith(`${sub.href}/`)) return true;
//           // For routes that start with the parent path but are not exactly the parent
//           if (sub.href === item.href && pathname.startsWith(`${item.href}/`)) return true;
//           return false;
//         });
        
//         if (isAnySubActive) {
//           newExpandedState[item.name] = true;
//         }
//       }
//     });
    
//     setExpandedMenus(prev => ({ ...prev, ...newExpandedState }));
//   }, [pathname]);

//   // Check if menu item is active
//   const isItemActive = (item: any) => {
//     if (item.href === "/") return pathname === "/";
    
//     if (item.hasSubmenu && item.submenu) {
//       // Check if any submenu item is active
//       const anySubActive = item.submenu.some(sub => {
//         // Exact match
//         if (pathname === sub.href) return true;
//         // Sub-route match (like /products/low-stock)
//         if (pathname.startsWith(`${sub.href}/`)) return true;
//         // For parent route when on sub-routes
//         if (sub.href === item.href && pathname.startsWith(`${item.href}/`)) return true;
//         return false;
//       });
      
//       return anySubActive;
//     }
    
//     return pathname === item.href || pathname.startsWith(`${item.href}/`);
//   };

//   // Check if submenu item is active
//   const isSubItemActive = (href: string, parentHref: string) => {
//     // Exact match
//     if (pathname === href) return true;
//     // Sub-route match
//     if (pathname.startsWith(`${href}/`)) return true;
//     // For parent route when on sub-routes (e.g., /products/low-stock should highlight All Products)
//     if (href === parentHref && pathname.startsWith(`${parentHref}/`) && pathname !== parentHref) {
//       return false; // Don't highlight All Products when on sub-routes
//     }
//     return false;
//   };

//   // Toggle menu expansion
//   const toggleMenu = (menuName: string) => {
//     setExpandedMenus(prev => ({
//       ...prev,
//       [menuName]: !prev[menuName]
//     }));
//   };

//   // Hide sidebar on auth pages
//   if (pathname === "/auth/login" || pathname === "/register") {
//     return null;
//   }

//   const handleLogOut = async () => {
//     toast.info("Logging out...");
//     localStorage.removeItem("accessToken");
//     localStorage.removeItem("refreshToken");
//     await logout();
//     setTimeout(() => router.push("/auth/login"), 1000);
//   };

//   const IMAGE = process.env.NEXT_PUBLIC_IMAGE_URL;

//   // Filter menu items based on user permissions
//   const filteredMenuItems = canViewUserRoute
//     ? menuItems
//     : menuItems.filter((item) => item.name !== "User");

//   // Reusable Submenu Renderer - Unified design for all submenus
//   const renderSubmenu = (submenu: any[], parentHref: string) => {
//     return (
//       <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-600 pl-3">
//         {submenu.map((subItem) => {
//           const isSubActive = isSubItemActive(subItem.href, parentHref);
          
//           return (
//             <Link key={subItem.name} href={subItem.href}>
//               <div
//                 className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
//                   isSubActive
//                     ? "bg-gray-700 text-white"
//                     : "text-gray-400 hover:bg-gray-700 hover:text-white"
//                 }`}
//               >
//                 {subItem.icon && <subItem.icon className="w-4 h-4" />}
//                 <span className="text-sm font-medium">{subItem.name}</span>
//               </div>
//             </Link>
//           );
//         })}
//       </div>
//     );
//   };

//   return (
//     <div className={`bg-[#2c2e34] p-4 flex flex-col h-full overflow-hidden ${className}`}>
//       {/* Logo */}
//       <div className="flex items-center justify-center mt-2 mb-7">
//         <Image
//           src={data?.data?.[0]?.logo ? `${IMAGE}${data.data[0].logo}` : "/placeholder.png"}
//           alt="Logo"
//           width={400}
//           height={400}
//           className="size-[80px] object-contain"
//         />
//       </div>

//       {/* Navigation */}
//       <nav className="flex-1 overflow-y-auto pr-1">
//         {filteredMenuItems.map((item) => {
//           const isActive = isItemActive(item);
//           const isExpanded = expandedMenus[item.name];

//           // Menu item with submenu
//           if (item.hasSubmenu) {
//             return (
//               <div key={item.name} className="mb-1">
//                 <div
//                   onClick={() => toggleMenu(item.name)}
//                   className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
//                     isActive || isExpanded
//                       ? "bg-gray-700 text-white"
//                       : "text-gray-400 hover:bg-gray-700 hover:text-white"
//                   }`}
//                 >
//                   <div className="flex items-center space-x-3">
//                     {/* <item.icon className="w-5 h-5" /> */}
//                     <span className="font-medium">{item.name}</span>
//                   </div>
//                   <ChevronDown 
//                     className={`w-4 h-4 transition-transform duration-200 ${
//                       isExpanded ? "rotate-180" : ""
//                     }`} 
//                   />
//                 </div>

//                 {isExpanded && renderSubmenu(item.submenu!, item.href)}
//               </div>
//             );
//           }

//           // Regular menu item without submenu
//           return (
//             <Link key={item.name} href={item.href}>
//               <div
//                 className={`flex items-center justify-between p-3 mb-1 rounded-lg cursor-pointer transition-all ${
//                   isActive
//                     ? "bg-gray-700 text-white"
//                     : "text-gray-400 hover:bg-gray-700 hover:text-white"
//                 }`}
//               >
//                 <div className="flex items-center space-x-3">
//                   {/* <item.icon className="w-5 h-5" /> */}
//                   <span className="font-medium">{item.name}</span>
//                 </div>
//                 <ChevronRight className="w-4 h-4" />
//               </div>
//             </Link>
//           );
//         })}
//       </nav>

//       {/* Logout */}
//       <Button
//         onClick={handleLogOut}
//         variant="ghost"
//         className="mt-3 shrink-0 text-red-400 hover:text-red-300 hover:bg-red-900/20 justify-start p-3"
//       >
//         <LogOut className="w-5 h-5 mr-2" />
//         Log Out
//       </Button>
//     </div>
//   );
// }
// "use client";

// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { ChevronRight, ChevronDown, LogOut, ShoppingCart, Clock, RotateCcw } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import Image from "next/image";
// import { logout } from "@/service/authService";
// import { toast } from "sonner";
// import { useState } from "react";
// import {
//   useSettingDataQuery,
//   useUserProfileQuery,
// } from "@/redux/feature/userSlice";

// const sidebarItems = [
//   { name: "Dashboard", href: "/" },
//   { name: "Products", href: "/products" },
//   { name: "Orders", href: "/orders" },
//   { name: "Notice", href: "/notice" },
//   { name: "User", href: "/user" },
//   { name: "Area", href: "/area" },
//   { name: "Category", href: "/category" },
//   { name: "Company", href: "/company" },
//   { name: "Generic", href: "/generic" },
//   { name: "Banner", href: "/banner" },
//   { name: "Stock", href: "/stock" },
//   { name: "Batch", href: "/batch" },
//   { name: "Privacy Policy", href: "/privacy-policy" },
//   { name: "Settings", href: "/settings" },
// ];

// const ordersSubmenu = [
//   { name: "All Orders", href: "/orders", icon: ShoppingCart, color: "green" },
//   { name: "Area Wise Orders", href: "/orders/area-wise", icon: RotateCcw, color: "blue" },
// ];

// export default function Sidebar({ className = "" }: { className?: string }) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const [expandedOrders, setExpandedOrders] = useState(false);

//   const { data } = useSettingDataQuery(undefined);
//   const { data: profileData } = useUserProfileQuery(undefined);

//   const canViewUserRoute = Boolean(
//     profileData?.is_superuser &&
//     profileData?.is_staff &&
//     profileData?.role === "admin"
//   );

//   const isItemActive = (href: string) => {
//     if (href === "/") return pathname === "/";
//     return pathname === href || pathname.startsWith(`${href}/`);
//   };

//   if (pathname === "/auth/login" || pathname === "/register") {
//     return null;
//   }

//   const handleLogOut = async () => {
//     toast.info("Logging out...");
//     localStorage.removeItem("accessToken");
//     localStorage.removeItem("refreshToken");
//     await logout();
//     setTimeout(() => {
//       router.push("/auth/login");
//     }, 1000);
//   };

//   const IMAGE = process.env.NEXT_PUBLIC_IMAGE_URL;

//   // superuser না হলে User menu hide হবে
//   const filteredSidebarItems = canViewUserRoute
//     ? sidebarItems
//     : sidebarItems.filter((item) => item.href !== "/user");

//   return (
//     <div
//       className={`bg-[#2c2e34] p-4 flex flex-col h-full overflow-hidden ${className}`}
//     >
//       {/* Logo */}
//       <div className="flex items-center justify-center mt-2 mb-7">
//         <Image
//           src={
//             data?.data?.[0]?.logo
//               ? `${IMAGE}${data.data[0].logo}`
//               : "/placeholder.png"
//           }
//           alt="Logo"
//           width={400}
//           height={400}
//           className="size-[80px] object-contain"
//         />
//       </div>

//       {/* Navigation */}
//       <nav className="flex-1 overflow-y-auto pr-1">
//         {filteredSidebarItems.map((item) => {
//           const isActive = isItemActive(item.href);
//           const isOrdersItem = item.name === "Orders";

//           if (isOrdersItem) {
//             return (
//               <div key={item.name}>
//                 {/* Orders Main Item */}
//                 <div
//                   onClick={() => setExpandedOrders(!expandedOrders)}
//                   className={`flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer transition-all ${expandedOrders || isActive
//                       ? "bg-green-600/20 text-green-400 border border-green-600/30"
//                       : "text-gray-400 hover:bg-gray-700 hover:text-white"
//                     }`}
//                 >
//                   <div className="flex items-center space-x-3">
//                     <ShoppingCart className="w-4 h-4" />
//                     <span className="font-medium">{item.name}</span>
//                   </div>
//                   <ChevronDown
//                     className={`w-4 h-4 transition-transform ${expandedOrders ? "rotate-180" : ""
//                       }`}
//                   />
//                 </div>

//                 {/* Submenu Items */}
//                 {expandedOrders && (
//                   <div className="ml-2 mb-2 space-y-1 border-l border-gray-600 pl-3">
//                     {ordersSubmenu.map((subItem) => {
//                       const SubIcon = subItem.icon;
//                       const colorClasses = {
//                         green: "bg-green-500/20 text-green-400",
//                         yellow: "bg-yellow-500/20 text-yellow-400",
//                         blue: "bg-purple-500/20 text-purple-400",
//                       };
//                       const isSubActive =
//                         pathname === subItem.href ||
//                         (subItem.href.includes("?") && pathname.includes("orders"));

//                       return (
//                         <Link key={subItem.name} href={subItem.href}>
//                           <div
//                             className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${isSubActive
//                                 ? colorClasses[subItem.color as keyof typeof colorClasses]
//                                 : "text-gray-400 hover:bg-gray-700 hover:text-white"
//                               }`}
//                           >
//                             <SubIcon className="w-4 h-4" />
//                             <span className="text-sm">{subItem.name}</span>
//                           </div>
//                         </Link>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             );
//           }

//           return (
//             <Link key={item.name} href={item.href}>
//               <div
//                 className={`flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer transition-colors ${isActive
//                   ? "bg-gray-700 text-white"
//                   : "text-gray-400 hover:bg-gray-700 hover:text-white"
//                   }`}
//               >
//                 <div className="flex items-center space-x-3">
//                   <span>{item.name}</span>
//                 </div>
//                 <ChevronRight className="w-4 h-4" />
//               </div>
//             </Link>
//           );
//         })}
//       </nav>

//       {/* Log Out */}
//       <Button
//         onClick={handleLogOut}
//         variant="ghost"
//         className="mt-3 shrink-0 text-red-400 hover:text-red-300 hover:bg-red-900/20 justify-start p-3"
//       >
//         <LogOut className="w-4 h-4 mr-2" />
//         Log Out
//       </Button>
//     </div>
//   );
// }

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  ShoppingCart,
  Settings,
  RotateCcw,
  Package,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  LayoutDashboard,
  Users,
  MapPin,
  Tag,
  Building2,
  FlaskConical,
  Boxes,
  Layers,
  FileText,
  ImageDown,
  Smartphone,
  Truck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { logout } from "@/service/authService";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  useSettingDataQuery,
  useUserProfileQuery,
} from "@/redux/feature/userSlice";

// Navigation grouped into labeled sections for a tidy, scannable sidebar.
const menuSections = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, hasSubmenu: false },
    ],
  },
  {
    label: "Sales",
    items: [
      { name: "Orders", href: "/orders", icon: ShoppingCart, hasSubmenu: false },
      {
        name: "Delivery", href: "/delivery", icon: Truck, hasSubmenu: true,
        submenu: [
          { name: "Overview", href: "/delivery", icon: BarChart3 },
          { name: "Assignment", href: "/delivery/assignment", icon: Package },
          { name: "Collections", href: "/delivery/collections", icon: Wallet },
          { name: "Dues", href: "/delivery/dues", icon: AlertTriangle },
          { name: "Return Requests", href: "/delivery/return-requests", icon: RotateCcw },
          { name: "Returns Report", href: "/delivery/returns", icon: RotateCcw },
          { name: "Performance", href: "/delivery/performance", icon: TrendingDown },
          { name: "Deposit Approvals", href: "/delivery/deposits", icon: Wallet },
        ],
      },
      {
        name: "Report", href: "/reports", icon: BarChart3, hasSubmenu: true,
        submenu: [
          { name: "Product Wise", href: "/reports/product-wise", icon: Package },
          { name: "Order Report", href: "/reports/order", icon: ShoppingCart },
          { name: "Customer Wise", href: "/reports/customer-balance", icon: Users },
        ],
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      { name: "Products", href: "/products", icon: Package, hasSubmenu: false },
      { name: "Low Stock", href: "/products/low-stock", icon: AlertTriangle, hasSubmenu: false },
      { name: "Negative Stock", href: "/products/negative-stock", icon: TrendingDown, hasSubmenu: false },
      { name: "Stock", href: "/stock", icon: Boxes, hasSubmenu: false },
      { name: "Batch", href: "/batch", icon: Layers, hasSubmenu: false },
    ],
  },
  {
    label: "Catalog",
    items: [
      { name: "Category", href: "/category", icon: Tag, hasSubmenu: false },
      { name: "Company", href: "/company", icon: Building2, hasSubmenu: false },
      { name: "Generic", href: "/generic", icon: FlaskConical, hasSubmenu: false },
      { name: "Banner", href: "/banner", icon: ImageDown, hasSubmenu: false },
    ],
  },
  {
    label: "People",
    items: [
      { name: "User", href: "/user", icon: Users, hasSubmenu: false },
      { name: "Area", href: "/area", icon: MapPin, hasSubmenu: false },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Notice", href: "/notice", icon: FileText, hasSubmenu: false },
      { name: "Privacy Policy", href: "/privacy-policy", icon: FileText, hasSubmenu: false },
      { name: "Terms & Conditions", href: "/terms-conditions", icon: FileText, hasSubmenu: false },
      { name: "App Update", href: "/app-update", icon: Smartphone, hasSubmenu: false },
      {
        name: "Settings", href: "/settings", icon: Settings, hasSubmenu: true,
        submenu: [
          { name: "General", href: "/settings", icon: Settings },
          { name: "Discount", href: "/settings/discounts", icon: Tag },
        ],
      },
    ],
  },
];

// Flat list of all items, used for active-state computation.
const allItems = menuSections.flatMap((s) => s.items);

export default function Sidebar({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const { data } = useSettingDataQuery(undefined);
  const { data: profileData } = useUserProfileQuery(undefined);

  const canViewUserRoute = Boolean(
    profileData?.is_superuser &&
    profileData?.is_staff &&
    profileData?.role === "admin"
  );

  // Auto-expand the parent of the current route, and collapse the rest on navigation.
  // Replacing (not merging) keeps the sidebar tidy: one expanded group at a time after navigating.
  useEffect(() => {
    const newExpandedState: Record<string, boolean> = {};

    allItems.forEach((item: any) => {
      if (item.hasSubmenu && item.submenu) {
        const isAnySubActive = item.submenu.some((sub: any) =>
          pathname === sub.href || pathname.startsWith(`${sub.href}/`)
        );
        if (isAnySubActive) newExpandedState[item.name] = true;
      }
    });

    setExpandedMenus(newExpandedState);
  }, [pathname]);

  // Compute the single active item using longest-prefix match across ALL menu items.
  // This prevents siblings like "Products" (/products) and "Low Stock" (/products/low-stock)
  // from both lighting up on /products/low-stock — only the most specific match wins.
  const activeItemName = (() => {
    let bestName: string | null = null;
    let bestLen = -1;
    for (const item of allItems as any[]) {
      const candidates: { href: string; owner: string }[] =
        item.hasSubmenu && item.submenu
          ? item.submenu.map((sub: any) => ({ href: sub.href, owner: item.name }))
          : [{ href: item.href, owner: item.name }];
      for (const c of candidates) {
        const matches =
          c.href === "/"
            ? pathname === "/"
            : pathname === c.href || pathname.startsWith(`${c.href}/`);
        if (matches && c.href.length > bestLen) {
          bestName = c.owner;
          bestLen = c.href.length;
        }
      }
    }
    return bestName;
  })();

  const isItemActive = (item: any) => item.name === activeItemName;

  // Pick at most one active submenu item per parent using longest-prefix match.
  // Prevents both "All Products" (/products) and "Low Stock" (/products/low-stock) from
  // lighting up simultaneously when on /products/low-stock.
  const getActiveSubHref = (submenu: any[]): string | null => {
    let bestHref: string | null = null;
    let bestLen = -1;
    submenu.forEach(sub => {
      const matches = pathname === sub.href || pathname.startsWith(`${sub.href}/`);
      if (matches && sub.href.length > bestLen) {
        bestHref = sub.href;
        bestLen = sub.href.length;
      }
    });
    return bestHref;
  };

  // Toggle menu expansion
  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  // Hide sidebar on auth pages
  if (pathname === "/auth/login" || pathname === "/register") {
    return null;
  }

  const handleLogOut = async () => {
    toast.info("Logging out...");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    await logout();
    setTimeout(() => router.push("/auth/login"), 1000);
  };

  const IMAGE = process.env.NEXT_PUBLIC_IMAGE_URL;

  // Apply permissions per section and drop any section left empty.
  const visibleSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((i: any) => canViewUserRoute || i.name !== "User"),
    }))
    .filter((section) => section.items.length > 0);

  // Submenu renderer
  const renderSubmenu = (submenu: any[]) => {
    const activeHref = getActiveSubHref(submenu);
    return (
      <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-700 pl-3">
        {submenu.map((subItem) => {
          const isSubActive = subItem.href === activeHref;
          return (
            <Link key={subItem.name} href={subItem.href}>
              <div
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                  isSubActive
                    ? "bg-purple-500/15 text-purple-300 font-medium"
                    : "text-gray-400 hover:bg-gray-700/60 hover:text-white"
                }`}
              >
                {subItem.icon && <subItem.icon className="w-4 h-4 shrink-0" />}
                <span className="truncate">{subItem.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  // Single nav item (link or expandable group)
  const renderItem = (item: any) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedMenus[item.name];

    if (item.hasSubmenu) {
      return (
        <div key={item.name}>
          <button
            type="button"
            onClick={() => toggleMenu(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-150 ${
              isActive
                ? "bg-purple-600 text-white shadow-sm shadow-purple-500/30"
                : isExpanded
                ? "bg-gray-700/50 text-white"
                : "text-gray-300 hover:bg-gray-700/60 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-3">
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span className="text-sm font-medium">{item.name}</span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
          </button>
          {isExpanded && renderSubmenu(item.submenu)}
        </div>
      );
    }

    return (
      <Link key={item.name} href={item.href}>
        <div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
            isActive
              ? "bg-purple-600 text-white shadow-sm shadow-purple-500/30"
              : "text-gray-300 hover:bg-gray-700/60 hover:text-white"
          }`}
        >
          <item.icon className="w-[18px] h-[18px] shrink-0" />
          <span className="text-sm font-medium truncate">{item.name}</span>
        </div>
      </Link>
    );
  };

  return (
    <div className={`bg-[#2c2e34] flex flex-col h-full overflow-hidden ${className}`}>
      {/* Logo Header */}
      <div className="shrink-0 px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl blur-md opacity-40" />
            <Image
              src={data?.data?.[0]?.logo ? `${IMAGE}${data.data[0].logo}` : "/placeholder.png"}
              alt="Logo"
              width={400}
              height={400}
              className="relative size-11 object-contain bg-gray-800 rounded-xl p-1.5"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white tracking-tight truncate">Admin Panel</h1>
            <p className="text-[11px] text-gray-400">Management console</p>
          </div>
        </div>
      </div>
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent shrink-0" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {visibleSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-gray-500">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item: any) => renderItem(item))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-gray-700/60 p-3">
        <Button
          onClick={handleLogOut}
          variant="ghost"
          className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 justify-start px-3 py-2.5"
        >
          <LogOut className="w-[18px] h-[18px] mr-3" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
