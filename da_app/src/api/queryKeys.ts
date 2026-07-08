/** Central React Query key registry to keep cache invalidation consistent. */
export const qk = {
  dashboard: ["dashboard"] as const,
  summary: ["summary"] as const,
  orders: (status: string) => ["orders", status] as const,
  order: (id: number) => ["order", id] as const,
  dues: ["dues"] as const,
  deposits: (status?: string) => ["deposits", status ?? "all"] as const,
  returnRequests: (status?: string) => ["return-requests", status ?? "all"] as const,
  returnedProducts: (source?: string) => ["returned-products", source ?? "all"] as const,
  notifications: ["notifications"] as const,
  notices: ["notices"] as const,
};
