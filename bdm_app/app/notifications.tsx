import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/api/notifications";
import { Ionicons } from "@/components/Icon";
import { MenuBar } from "@/components/MenuBar";
import { EmptyState, Skeleton } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { shadow, useColors } from "@/theme";
import type { AppNotification } from "@/types/api";

export default function NotificationsScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const t = useT();
  const qc = useQueryClient();

  const notifications = useQuery({ queryKey: ["notifications"], queryFn: getNotifications });
  const data: AppNotification[] = notifications.data ?? [];
  const unread = data.filter((n) => !n.is_read).length;

  // Unread cards use an OPAQUE tint. A translucent background under an Android
  // elevation shadow renders a sharp-cornered rectangle (the "double box"),
  // because the shadow can't clip to the rounded corners unless the bg is solid.
  const isDark = c.surface !== "#FFFFFF";
  const unreadBg = isDark ? "#2A2340" : "#F4ECFD";
  const unreadBorder = isDark ? "#4B3E6E" : "#E4D3FA";

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center border-b border-border bg-surface px-4 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2 h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-ink">{t("notifications")}</Text>
        {unread > 0 ? (
          <Pressable onPress={() => markAll.mutate()} hitSlop={8} disabled={markAll.isPending} className="active:opacity-60">
            <Text className="text-[13px] font-bold text-primary">{t("markAllRead")}</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={data}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
        refreshing={notifications.isRefetching}
        onRefresh={() => void notifications.refetch()}
        renderItem={({ item }: { item: AppNotification }) => (
          <Pressable
            onPress={() => !item.is_read && markOne.mutate(item.id)}
            style={[shadow.sm, { backgroundColor: item.is_read ? c.surface : unreadBg, borderColor: item.is_read ? c.border : unreadBorder }]}
            className="mb-2.5 flex-row rounded-2xl border p-3.5 active:opacity-80"
          >
            <View
              style={{ backgroundColor: item.is_read ? c.primary50 : (isDark ? "#3A3356" : "#EADBFB") }}
              className="h-10 w-10 items-center justify-center rounded-full"
            >
              <Ionicons name="notifications" size={18} color={item.is_read ? c.inkMuted : c.primary} />
            </View>
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text className="flex-1 text-[14px] font-bold text-ink" numberOfLines={1}>{item.title}</Text>
                {!item.is_read ? <View className="ml-2 h-2 w-2 rounded-full bg-primary" /> : null}
              </View>
              {item.message ? <Text className="mt-0.5 text-[13px] leading-5 text-ink-muted">{item.message}</Text> : null}
              <Text className="mt-1 text-[11px] text-ink-faint">{formatDate(item.created_at)}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          notifications.isLoading ? (
            <View>
              <Skeleton height={72} radius={16} className="mb-2.5" />
              <Skeleton height={72} radius={16} className="mb-2.5" />
              <Skeleton height={72} radius={16} />
            </View>
          ) : notifications.isError ? (
            <EmptyState icon="cloud-offline-outline" title={t("loadFailed")} message={t("loadFailedHint")} actionLabel={t("retry")} onAction={() => void notifications.refetch()} />
          ) : (
            <EmptyState icon="notifications-off-outline" title={t("noNotificationsYet")} message={t("noNotificationsHint")} />
          )
        }
      />
      <MenuBar active="index" />
    </View>
  );
}
