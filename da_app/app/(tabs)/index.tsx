import { Ionicons } from "@/components/Icon";
import { FadeInScreen } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAssignedOrders, getDashboard, getReturnRequests } from "@/api/delivery";
import { getNotifications } from "@/api/notifications";
import { qk } from "@/api/queryKeys";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState, SectionHeader, Skeleton, StatTile } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { theme } from "@/theme";
import type { AppNotification, DeliveryOrder, ReturnRequest } from "@/types/api";

const LOGO = require("../../assets/logo.png");

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const dash = useQuery({ queryKey: qk.dashboard, queryFn: getDashboard });
  const orders = useQuery({ queryKey: qk.orders("all"), queryFn: () => getAssignedOrders("all") });
  const returns = useQuery({ queryKey: qk.returnRequests(), queryFn: () => getReturnRequests() });
  const notifs = useQuery({ queryKey: qk.notifications, queryFn: getNotifications });

  const unread = (notifs.data ?? []).filter((n: AppNotification) => !n.is_read).length;

  const refreshing = dash.isRefetching || orders.isRefetching;
  function refetchAll(): void {
    void dash.refetch();
    void orders.refetch();
    void returns.refetch();
    void notifs.refetch();
  }

  const d = dash.data;

  // "Ongoing" = assigned orders still in progress (not delivered or cancelled).
  const ongoing = (orders.data ?? []).filter(
    (o: DeliveryOrder) => o.delivery_status !== "delivered" && o.delivery_status !== "cancelled"
  );

  return (
    <FadeInScreen>
      {/* Branded header */}
      <View className="border-b border-border bg-surface px-5 pb-3.5" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center justify-between">
          {/* Brand */}
          <View className="flex-1 flex-row items-center">
            <Image source={LOGO} style={{ width: 38, height: 38 }} resizeMode="contain" />
            <View className="ml-2.5 flex-1">
              <Text className="text-xl font-extrabold tracking-tight text-ink">Fiha Pharma</Text>
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push("/notifications" as Href)}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary-50 active:opacity-70"
            >
              <Ionicons name="notifications-outline" size={20} color={theme.color.ink} />
              {unread > 0 ? (
                <View className="absolute right-1.5 top-1.5 h-4 min-w-4 items-center justify-center rounded-full border-2 border-surface bg-danger px-1">
                  <Text className="text-[9px] font-bold text-white">{unread > 9 ? "9+" : unread}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/orders" as Href)}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary-50 active:opacity-70"
            >
              <Ionicons name="search" size={20} color={theme.color.ink} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAll} tintColor={theme.color.primary} />}
      >
        {/* Stat grid */}
        {dash.isLoading || !d ? (
          <View style={{ gap: 12 }}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Skeleton height={128} radius={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Skeleton height={128} radius={20} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="gap-3">
            <View className="flex-row gap-3">
              <StatTile icon="file-tray" tone="info" value={d.total_assigned} label="Total Assigned" onPress={() => router.push("/(tabs)/orders" as Href)} />
              <StatTile icon="time" tone="violet" value={d.pending_deliveries} label="Pending Deliveries" onPress={() => router.push("/(tabs)/orders" as Href)} />
            </View>
            <View className="flex-row gap-3">
              <StatTile icon="checkmark-circle" tone="success" value={d.delivered_total} label="Delivered" />
              <StatTile icon="cash" tone="success" value={formatCurrency(d.today_collection)} label="Today's Collection" onPress={() => router.push("/(tabs)/deposit" as Href)} />
            </View>
            <View className="flex-row gap-3">
              <StatTile icon="wallet" tone="danger" value={formatCurrency(d.outstanding_dues)} label="Outstanding Dues" onPress={() => router.push("/(tabs)/due" as Href)} />
              <StatTile icon="arrow-undo" tone="warning" value={(returns.data ?? []).filter((r: ReturnRequest) => r.status === "pending").length} label="Returned Products" onPress={() => router.push("/returns" as Href)} />
            </View>
          </View>
        )}

        {/* Ongoing orders */}
        <View className="mt-7">
          <SectionHeader
            title="Ongoing Orders"
            actionLabel="View All"
            onAction={() => router.push("/(tabs)/orders" as Href)}
          />
          {orders.isLoading ? (
            <Skeleton height={130} radius={20} />
          ) : ongoing.length === 0 ? (
            <EmptyState
              icon="checkmark-circle-outline"
              title="No ongoing orders"
              message="You're all caught up — no deliveries in progress."
            />
          ) : (
            ongoing
              .slice(0, 5)
              .map((o: DeliveryOrder) => (
                <OrderCard key={o.order_id} order={o} onPress={() => router.push(`/(tabs)/orders/${o.order_id}` as Href)} />
              ))
          )}
        </View>
      </ScrollView>
    </FadeInScreen>
  );
}
