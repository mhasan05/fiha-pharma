import { Ionicons } from "@/components/Icon";
import { FadeInScreen } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAssignedOrders, type OrderFilter } from "@/api/delivery";
import { qk } from "@/api/queryKeys";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState, SkeletonCard } from "@/components/ui";
import { theme } from "@/theme";
import type { DeliveryOrder } from "@/types/api";

const FILTERS: { key: OrderFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "delivered", label: "Delivered" },
];

export default function OrdersScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: qk.orders(filter),
    queryFn: () => getAssignedOrders(filter),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (o: DeliveryOrder) =>
        (o.shop_name ?? "").toLowerCase().includes(q) ||
        (o.customer_name ?? "").toLowerCase().includes(q) ||
        o.invoice_number.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <FadeInScreen>
      <View className="px-5 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[28px] font-extrabold text-ink">My Shipments</Text>
      </View>

      {/* Search */}
      <View className="px-4 pb-3">
        <View className="h-12 flex-row items-center rounded-2xl bg-primary-50 px-4">
          <Ionicons name="search" size={18} color={theme.color.inkFaint} />
          <TextInput
            className="ml-2 h-full flex-1 py-0 text-[15px] text-ink"
            placeholder="Search by invoice, shop or customer"
            placeholderTextColor={theme.color.inkFaint}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={theme.color.inkFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter chips */}
      <View className="flex-row gap-2 px-4 pb-2">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`rounded-full px-5 py-2 ${active ? "bg-primary" : "bg-primary-50"}`}
            >
              <Text className={`text-[13px] font-semibold ${active ? "text-white" : "text-ink-muted"}`}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View className="px-4 pt-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => String(o.order_id)}
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 32, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={theme.color.primary} />}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => router.push(`/(tabs)/orders/${item.order_id}` as Href)} />
          )}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="warning-outline"
                tone="danger"
                title="Couldn't load shipments"
                message={error instanceof Error ? error.message : undefined}
                actionLabel="Try again"
                onAction={() => void refetch()}
              />
            ) : search ? (
              <EmptyState icon="search-outline" title="No matches" message={`Nothing matches "${search}".`} />
            ) : (
              <EmptyState icon="file-tray-outline" title="No shipments" message="Nothing matches this filter yet." />
            )
          }
        />
      )}
    </FadeInScreen>
  );
}
