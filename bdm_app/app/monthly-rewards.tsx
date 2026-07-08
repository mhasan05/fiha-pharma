import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getOrders } from "@/api/orders";
import { getConditionalDiscounts } from "@/api/settings";
import { Ionicons } from "@/components/Icon";
import { MenuBar } from "@/components/MenuBar";
import { EmptyState, Skeleton } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { groupRewardsByMonth, monthKey, type RewardMonth } from "@/lib/rewards";
import { shadow, theme, useColors } from "@/theme";
import type { Order } from "@/types/api";

export default function MonthlyRewardsScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const t = useT();

  const orders = useQuery({ queryKey: ["orders"], queryFn: getOrders });
  const discounts = useQuery({ queryKey: ["conditional-discounts"], queryFn: getConditionalDiscounts });

  const months: RewardMonth[] = useMemo(
    () => groupRewardsByMonth((orders.data ?? []) as Order[], discounts.data ?? []),
    [orders.data, discounts.data],
  );
  const totalReward = months.reduce((s, m) => s + m.reward, 0);
  const currentKey = monthKey(new Date());

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center border-b border-border bg-surface px-4 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2 h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t("discount")}</Text>
      </View>

      <FlatList
        data={months}
        keyExtractor={(m) => m.key}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
        refreshing={orders.isRefetching}
        onRefresh={() => void orders.refetch()}
        ListHeaderComponent={
          months.length > 0 ? (
            <LinearGradient
              colors={["#0F9D6E", "#0C8259"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[shadow.sm, { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14 }]}
            >
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <Ionicons name="pricetag" size={17} color={theme.color.white} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[12px] font-medium text-white/80">{t("totalDiscount")}</Text>
                  <Text className="text-[20px] font-extrabold leading-[24px] text-white">{formatCurrency(totalReward)}</Text>
                </View>
              </View>
            </LinearGradient>
          ) : null
        }
        renderItem={({ item }: { item: RewardMonth }) => {
          const isCurrent = item.key === currentKey;
          return (
            <View style={shadow.sm} className={`mb-3 rounded-2xl border bg-surface p-4 ${isCurrent ? "border-primary/40" : "border-border"}`}>
              <View className="flex-row items-center">
                <View className={`h-11 w-11 items-center justify-center rounded-xl ${isCurrent ? "bg-primary/10" : "bg-primary-50"}`}>
                  <Ionicons name="calendar-outline" size={20} color={isCurrent ? c.primary : c.inkMuted} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[15px] font-bold text-ink">{item.label}</Text>
                  <Text className="text-[12px] text-ink-muted">
                    {item.count} {item.count === 1 ? t("order") : `${t("order")}s`} · {formatCurrency(item.spent)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[16px] font-extrabold text-primary">{formatCurrency(item.reward)}</Text>
                  <Text className="text-[11px] text-ink-faint">{t("discount")}</Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          orders.isLoading ? (
            <Skeleton height={80} radius={16} />
          ) : (
            <EmptyState icon="gift-outline" title={t("noRewards")} message={t("noRewardsHint")} />
          )
        }
      />
      <MenuBar active="history" />
    </View>
  );
}
