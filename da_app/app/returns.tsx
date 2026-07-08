import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";

import { getDashboard, getReturnedProducts, getReturnRequests } from "@/api/delivery";
import { qk } from "@/api/queryKeys";
import { BackHeader } from "@/components/Screen";
import { Badge, Card, EmptyState, IconChip, Skeleton, statusTone } from "@/components/ui";
import { formatCurrency, formatDateTime, titleCase } from "@/lib/format";
import { theme } from "@/theme";
import type {
  ReturnedProduct,
  ReturnRequest,
  ReturnRequestItem,
  ReturnRequestStatus,
} from "@/types/api";

type Mode = "requests" | "products";
type Filter = ReturnRequestStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "rejected", label: "Rejected" },
];

export default function ReturnsScreen(): React.ReactElement {
  const [mode, setMode] = useState<Mode>("requests");
  const [filter, setFilter] = useState<Filter>("pending");

  const requests = useQuery({
    queryKey: qk.returnRequests(filter),
    queryFn: () => getReturnRequests(filter),
    enabled: mode === "requests",
  });
  const products = useQuery({
    queryKey: qk.returnedProducts(),
    queryFn: () => getReturnedProducts(),
    enabled: mode === "products",
  });
  const dash = useQuery({ queryKey: qk.dashboard, queryFn: getDashboard });

  const requestCount = requests.data?.length ?? 0;
  const productList = products.data?.items ?? [];

  return (
    <View className="flex-1 bg-canvas">
      <BackHeader title="Returns" subtitle="Requests & returned products" />

      <FlatList
        // Use the active dataset; the two modes render different card types.
        data={(mode === "requests" ? requests.data ?? [] : productList) as unknown[]}
        keyExtractor={(item, i) => `${mode}-${(item as { id?: number }).id ?? i}`}
        contentContainerStyle={{ padding: 16, paddingTop: 4, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={mode === "requests" ? requests.isRefetching : products.isRefetching}
            onRefresh={() => (mode === "requests" ? void requests.refetch() : void products.refetch())}
            tintColor={theme.color.primary}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Summary */}
            <Card className="mb-4 flex-row">
              <View className="flex-1 items-center">
                <Text className="text-2xl font-extrabold text-ink">{requestCount}</Text>
                <Text className="mt-0.5 text-xs text-ink-muted">My requests</Text>
              </View>
              <View className="w-px bg-border" />
              <View className="flex-1 items-center">
                <Text className="text-2xl font-extrabold text-ink">{dash.data?.returned_products ?? 0}</Text>
                <Text className="mt-0.5 text-center text-xs text-ink-muted">Returned units (all)</Text>
              </View>
            </Card>

            {/* Mode toggle */}
            <View className="mb-3 flex-row rounded-2xl bg-border/60 p-1">
              {(["requests", "products"] as Mode[]).map((m) => {
                const active = m === mode;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-surface" : ""}`}
                  >
                    <Text className={`text-[13px] font-semibold ${active ? "text-primary" : "text-ink-muted"}`}>
                      {m === "requests" ? "My requests" : "Returned products"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Status filter (requests mode only) */}
            {mode === "requests" ? (
              <View className="mb-3 flex-row rounded-2xl bg-border/60 p-1">
                {FILTERS.map((f) => {
                  const active = f.key === filter;
                  return (
                    <Pressable
                      key={f.key}
                      onPress={() => setFilter(f.key)}
                      className={`flex-1 items-center rounded-xl py-2 ${active ? "bg-surface" : ""}`}
                    >
                      <Text className={`text-[12px] font-semibold ${active ? "text-primary" : "text-ink-muted"}`}>
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text className="mb-3 px-1 text-xs text-ink-muted">
                Every returned product on your orders — including returns recorded by admin during order edits.
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) =>
          mode === "requests" ? (
            <ReturnRequestCard req={item as ReturnRequest} />
          ) : (
            <ReturnedProductCard item={item as ReturnedProduct} />
          )
        }
        ListEmptyComponent={
          (mode === "requests" ? requests.isLoading : products.isLoading) ? (
            <View>
              <Skeleton height={110} radius={20} className="mb-3" />
              <Skeleton height={110} radius={20} />
            </View>
          ) : mode === "requests" ? (
            <EmptyState
              icon="arrow-undo-outline"
              title="No return requests"
              message="Returns you submit from an order appear here with their status."
            />
          ) : (
            <EmptyState
              icon="cube-outline"
              title="No returned products"
              message="Nothing has been returned on your orders yet."
            />
          )
        }
      />
    </View>
  );
}

function ReturnRequestCard({ req }: { req: ReturnRequest }): React.ReactElement {
  return (
    <Card className="mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-[15px] font-bold text-ink">{req.shop_name || `Order #${req.order}`}</Text>
          <Text className="mt-0.5 text-xs text-ink-faint">{req.invoice_number}</Text>
        </View>
        <Badge label={titleCase(req.status)} tone={statusTone(req.status)} dot />
      </View>

      <View className="mt-3 rounded-xl bg-canvas p-3">
        {req.items.map((it: ReturnRequestItem, idx: number) => (
          <View
            key={it.id}
            className={`flex-row items-center justify-between py-1.5 ${idx < req.items.length - 1 ? "border-b border-border" : ""}`}
          >
            <View className="flex-1 pr-2">
              <Text className="text-[13px] font-medium text-ink" numberOfLines={1}>
                {it.product_name}
              </Text>
              {it.reason ? <Text className="text-[11px] text-ink-faint">{it.reason}</Text> : null}
            </View>
            <Text className="text-[13px] font-semibold text-ink">×{it.quantity}</Text>
          </View>
        ))}
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-xs text-ink-muted">{formatDateTime(req.created_at)}</Text>
        <Text className="text-[13px] font-bold text-ink">
          {req.total_quantity} unit(s) · {formatCurrency(req.total_value)}
        </Text>
      </View>

      {req.status === "rejected" && req.review_note ? (
        <View className="mt-2 rounded-xl bg-danger-soft px-3 py-2">
          <Text className="text-[12px] font-medium text-danger">Rejected: {req.review_note}</Text>
        </View>
      ) : null}
    </Card>
  );
}

function ReturnedProductCard({ item }: { item: ReturnedProduct }): React.ReactElement {
  const byAdmin = item.source === "admin";
  return (
    <Card className="mb-3 flex-row items-center">
      <IconChip icon="cube-outline" tone={byAdmin ? "warning" : "info"} />
      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <Text className="flex-1 text-[14px] font-bold text-ink" numberOfLines={1}>
            {item.product_name}
          </Text>
          <Badge label={byAdmin ? "Admin" : "You"} tone={byAdmin ? "warning" : "info"} />
        </View>
        <Text className="mt-0.5 text-xs text-ink-faint">
          {item.invoice_number}
          {item.shop_name ? ` · ${item.shop_name}` : ""}
        </Text>
        {item.reason ? <Text className="mt-0.5 text-[12px] text-ink-muted">{item.reason}</Text> : null}
        <Text className="mt-1 text-[11px] text-ink-faint">{formatDateTime(item.created_on)}</Text>
      </View>
      <View className="ml-2 items-end">
        <Text className="text-[15px] font-extrabold text-ink">×{item.quantity}</Text>
        <Text className="text-[11px] text-ink-faint">{formatCurrency(item.line_total)}</Text>
      </View>
    </Card>
  );
}
