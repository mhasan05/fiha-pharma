import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getOrders } from "@/api/orders";
import { Ionicons } from "@/components/Icon";
import { MenuBar } from "@/components/MenuBar";
import { EmptyState, Skeleton } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { shadow, useColors } from "@/theme";
import type { Order } from "@/types/api";

interface MonthGroup {
  key: string;
  label: string;
  count: number;
  total: number;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MonthlyOrdersScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const t = useT();

  const { data = [], isLoading } = useQuery({ queryKey: ["orders"], queryFn: getOrders });

  const groups: MonthGroup[] = useMemo(() => {
    const map = new Map<string, MonthGroup>();
    for (const o of data as Order[]) {
      // Only completed (delivered) orders count — ongoing orders are excluded.
      if (o.order_status !== "delivered") continue;
      const d = new Date(o.order_date);
      if (Number.isNaN(d.getTime())) continue;
      const key = monthKey(d);
      const g = map.get(key) ?? {
        key,
        label: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
        count: 0,
        total: 0,
      };
      g.count += 1;
      g.total += Number(o.total_amount) || 0;
      map.set(key, g);
    }
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [data]);

  const currentKey = monthKey(new Date());

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center border-b border-border bg-surface px-4 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2 h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t("monthlyOrders")}</Text>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(g) => g.key}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: MonthGroup }) => {
          const isCurrent = item.key === currentKey;
          return (
            <View style={shadow.sm} className={`mb-3 flex-row items-center rounded-2xl border bg-surface p-4 ${isCurrent ? "border-primary/40" : "border-border"}`}>
              <View className={`h-11 w-11 items-center justify-center rounded-xl ${isCurrent ? "bg-primary/10" : "bg-primary-50"}`}>
                <Ionicons name="calendar-outline" size={20} color={isCurrent ? c.primary : c.inkMuted} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-bold text-ink">{item.label}</Text>
                <Text className="text-[12px] text-ink-muted">{item.count} {item.count === 1 ? t("item") : t("items")}</Text>
              </View>
              <Text className="text-[16px] font-extrabold text-primary">{formatCurrency(item.total)}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <Skeleton height={80} radius={16} />
          ) : (
            <EmptyState icon="stats-chart-outline" title={t("noOrders")} message={t("noOrdersHint")} />
          )
        }
      />
      <MenuBar active="history" />
    </View>
  );
}
