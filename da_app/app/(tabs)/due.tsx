import { Ionicons } from "@/components/Icon";
import { FadeInScreen } from "@/components/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getDues } from "@/api/delivery";
import { qk } from "@/api/queryKeys";
import { CollectSheet, type CollectTarget } from "@/components/CollectSheet";
import { Avatar, EmptyState, SkeletonCard } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { shadow, theme } from "@/theme";
import type { DeliveryOrder } from "@/types/api";

export default function DueScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [target, setTarget] = useState<CollectTarget | null>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: qk.dues,
    queryFn: getDues,
  });

  // A due only exists once an order is DELIVERED but not fully paid. Shipped /
  // not-yet-delivered orders are excluded (their amount is collected on
  // delivery, so they aren't dues yet). Guards the UI even if the API still
  // returns undelivered orders.
  const items = (data?.items ?? []).filter(
    (o: DeliveryOrder) => o.delivery_status === "delivered" && (o.due_amount ?? 0) > 0
  );
  const totalDue = items.reduce((sum: number, o: DeliveryOrder) => sum + (o.due_amount ?? 0), 0);
  const customerCount = new Set(items.map((o: DeliveryOrder) => o.customer_name || o.shop_name || o.order_id)).size;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (o: DeliveryOrder) =>
        (o.shop_name ?? "").toLowerCase().includes(q) ||
        (o.customer_name ?? "").toLowerCase().includes(q) ||
        o.invoice_number.toLowerCase().includes(q)
    );
  }, [items, search]);

  function onCollected(): void {
    void qc.invalidateQueries({ queryKey: qk.dues });
    void qc.invalidateQueries({ queryKey: qk.dashboard });
    void qc.invalidateQueries({ queryKey: ["orders"] });
  }

  return (
    <FadeInScreen>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[28px] font-extrabold text-ink">Customer Due</Text>
        <Pressable onPress={() => void refetch()} hitSlop={10} className="active:opacity-60">
          <Ionicons name="refresh" size={22} color={theme.color.ink} />
        </Pressable>
      </View>

      {/* Search */}
      <View className="px-4 pb-2">
        <View className="h-12 flex-row items-center rounded-2xl bg-primary-50 px-4">
          <Ionicons name="search" size={18} color={theme.color.inkFaint} />
          <TextInput
            className="ml-2 h-full flex-1 py-0 text-[15px] text-ink"
            placeholder="Search by shop or customer"
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

      <FlatList
        data={filtered}
        keyExtractor={(o) => String(o.order_id)}
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 32, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={theme.color.primary} />}
        ListHeaderComponent={
          isLoading ? (
            <View className="mb-4">
              <SkeletonCard />
            </View>
          ) : items.length === 0 ? null : (
            <View
              style={shadow.sm}
              className="mb-4 flex-row items-center justify-between rounded-2xl border border-danger/15 bg-danger-soft px-4 py-3.5"
            >
              <View className="flex-1 flex-row items-center">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-danger/15">
                  <Ionicons name="wallet" size={18} color={theme.color.danger} />
                </View>
                <View className="ml-3">
                  <Text className="text-[12px] font-medium text-danger/80">Total Outstanding</Text>
                  <Text className="text-[22px] font-extrabold text-danger">{formatCurrency(totalDue)}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-lg font-extrabold text-danger">{customerCount}</Text>
                <Text className="text-[12px] font-medium text-danger/80">Customers</Text>
              </View>
            </View>
          )
        }
        renderItem={({ item }: { item: DeliveryOrder }) => (
          <DueCard
            order={item}
            onCollect={() =>
              setTarget({
                orderId: item.order_id,
                name: item.customer_name || item.shop_name || "Customer",
                invoice: item.invoice_number,
                dueAmount: item.due_amount,
              })
            }
          />
        )}
        ListEmptyComponent={
          isLoading ? null : isError ? (
            <EmptyState icon="warning-outline" tone="danger" title="Couldn't load dues" actionLabel="Try again" onAction={() => void refetch()} />
          ) : search ? (
            <EmptyState icon="search-outline" title="No matches" message={`No due matches "${search}".`} />
          ) : (
            <EmptyState icon="checkmark-circle-outline" title="No dues" message="All collections are settled." />
          )
        }
      />

      <CollectSheet target={target} onClose={() => setTarget(null)} onCollected={onCollected} />
    </FadeInScreen>
  );
}

function DueCard({ order, onCollect }: { order: DeliveryOrder; onCollect: () => void }): React.ReactElement {
  return (
    <View style={shadow.sm} className="mb-3 rounded-2xl border border-border bg-surface p-4">
      <View className="flex-row items-center">
        <Avatar name={order.customer_name || order.shop_name || "C"} size={44} />
        <View className="ml-3 flex-1">
          <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>
            {order.customer_name || order.shop_name}
          </Text>
          {order.shop_name ? <Text className="text-[13px] text-ink-muted" numberOfLines={1}>{order.shop_name}</Text> : null}
          <View className="mt-0.5 flex-row items-center">
            <Ionicons name="receipt-outline" size={12} color={theme.color.inkFaint} />
            <Text className="ml-1 text-[11px] text-ink-faint">{order.invoice_number}</Text>
          </View>
        </View>
        <View className="items-end">
          <View className="rounded-full bg-danger-soft px-2.5 py-1">
            <Text className="text-[13px] font-bold text-danger">{formatCurrency(order.due_amount)}</Text>
          </View>
          <Text className="mt-1 text-[11px] text-ink-faint">Due</Text>
        </View>
      </View>

      <View className="my-3 h-px bg-border" />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={13} color={theme.color.inkFaint} />
          <Text className="ml-1.5 text-[12px] text-ink-muted">{formatDate(order.order_date)}</Text>
        </View>
        <Pressable
          onPress={onCollect}
          className="flex-row items-center rounded-xl bg-primary px-4 py-2.5 active:opacity-90"
        >
          <Ionicons name="cash-outline" size={15} color={theme.color.white} style={{ marginRight: 6 }} />
          <Text className="text-[13px] font-bold text-white">Collect</Text>
        </Pressable>
      </View>
    </View>
  );
}
