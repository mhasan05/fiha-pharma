import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getOrders } from "@/api/orders";
import { getConditionalDiscounts } from "@/api/settings";
import { Ionicons } from "@/components/Icon";
import { Badge, EmptyState, Skeleton, type BadgeTone } from "@/components/ui";
import { monthKey, rewardForOrder } from "@/lib/rewards";
import { formatCurrency, formatDate, titleCase } from "@/lib/format";
import { shadow, theme } from "@/theme";
import { useT } from "@/lib/i18n";
import type { Order } from "@/types/api";

function orderTone(status: string): BadgeTone {
  if (status === "delivered") return "success";
  if (status === "cancelled") return "danger";
  if (status === "pending" || status === "processing" || status === "shipped") return "warning";
  return "neutral";
}

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

/** A distinct icon + color per order status. */
function orderVisual(status: string): { icon: IoniconName; color: string; bg: string } {
  switch (status) {
    case "delivered":
      return { icon: "checkmark-done-outline", color: theme.color.success, bg: theme.color.successSoft };
    case "cancelled":
      return { icon: "close-circle-outline", color: theme.color.danger, bg: theme.color.dangerSoft };
    case "pending":
      return { icon: "time-outline", color: theme.color.warning, bg: theme.color.warningSoft };
    case "processing":
      return { icon: "sync-outline", color: theme.color.info, bg: theme.color.infoSoft };
    case "shipped":
      return { icon: "car-outline", color: theme.color.violet, bg: theme.color.violetSoft };
    default:
      return { icon: "receipt-outline", color: theme.color.primary, bg: theme.color.primary50 };
  }
}

export default function HistoryScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const orders = useQuery({ queryKey: ["orders"], queryFn: getOrders });
  const discounts = useQuery({ queryKey: ["conditional-discounts"], queryFn: getConditionalDiscounts });

  const now = new Date();
  const currentKey = monthKey(now);
  const monthName = now.toLocaleDateString(undefined, { month: "long" });
  const monthReward = (orders.data ?? [])
    .filter((o: Order) => monthKey(new Date(o.order_date)) === currentKey)
    .reduce((s: number, o: Order) => s + rewardForOrder(o, discounts.data ?? []), 0);

  return (
    <View className="flex-1 bg-canvas">
      <View className="border-b border-border bg-surface px-5 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[24px] font-extrabold text-ink">{t("history")}</Text>
      </View>

      <FlatList
        data={orders.data ?? []}
        keyExtractor={(o) => String(o.order_id)}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshing={orders.isRefetching}
        onRefresh={() => void orders.refetch()}
        ListHeaderComponent={
          (orders.data ?? []).length === 0 ? null : (
          <Pressable onPress={() => router.push("/monthly-rewards" as Href)} className="mb-4 active:opacity-90">
            <LinearGradient
              colors={["#0F9D6E", "#0C8259"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[shadow.sm, { borderRadius: 16, paddingVertical: 11, paddingHorizontal: 14 }]}
            >
              <View className="flex-row items-center">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <Ionicons name="pricetag" size={16} color={theme.color.white} />
                </View>
                <View className="ml-2.5 flex-1">
                  <Text className="text-[11.5px] font-medium text-white/80" numberOfLines={1}>{t("discount")} ({monthName})</Text>
                  <Text className="text-[18px] font-extrabold leading-[22px] text-white">{formatCurrency(monthReward)}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-[12.5px] font-semibold text-white/90">{t("viewDetails")}</Text>
                  <Ionicons name="chevron-forward" size={15} color={theme.color.white} style={{ marginLeft: 2 }} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
          )
        }
        renderItem={({ item }: { item: Order }) => (
          <Pressable
            onPress={() => router.push(`/order/${item.order_id}` as Href)}
            style={shadow.sm}
            className="mb-3 rounded-2xl border border-border bg-surface p-3.5 active:opacity-80"
          >
            <View className="flex-row items-center">
              <View style={{ backgroundColor: orderVisual(item.order_status).bg }} className="h-11 w-11 items-center justify-center rounded-2xl">
                <Ionicons name={orderVisual(item.order_status).icon} size={20} color={orderVisual(item.order_status).color} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[14px] font-bold text-ink" numberOfLines={1}>{item.invoice_number}</Text>
                <Text className="mt-0.5 text-[12px] text-ink-muted">{formatDate(item.order_date)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-[15px] font-extrabold text-ink">{formatCurrency(item.total_amount)}</Text>
                <View className="mt-1.5">
                  <Badge label={titleCase(item.order_status)} tone={orderTone(item.order_status)} />
                </View>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          orders.isLoading ? (
            <Skeleton height={80} radius={16} />
          ) : orders.isError ? (
            <EmptyState icon="cloud-offline-outline" title={t("loadFailed")} message={t("loadFailedHint")} actionLabel={t("retry")} onAction={() => void orders.refetch()} />
          ) : (
            <EmptyState icon="receipt-outline" title={t("noOrders")} message={t("noOrdersHint")} />
          )
        }
      />
    </View>
  );
}
