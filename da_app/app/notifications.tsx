import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";

import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/api/notifications";
import { qk } from "@/api/queryKeys";
import { BackHeader } from "@/components/Screen";
import { EmptyState, IconChip, LoadingSpinner } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { theme } from "@/theme";
import type { AppNotification } from "@/types/api";

export default function NotificationsScreen(): React.ReactElement {
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: qk.notifications,
    queryFn: getNotifications,
  });

  const markOne = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.notifications }),
  });
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.notifications }),
  });

  const hasUnread = (data ?? []).some((n: AppNotification) => !n.is_read);

  return (
    <View className="flex-1 bg-canvas">
      <BackHeader
        title="Notifications"
        right={
          hasUnread ? (
            <Pressable onPress={() => markAll.mutate()} hitSlop={8} className="rounded-full bg-primary-50 px-3 py-1.5">
              <Text className="text-[13px] font-semibold text-primary-700">Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingSpinner label="Loading…" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={theme.color.primary} />}
          renderItem={({ item }: { item: AppNotification }) => (
            <Pressable
              onPress={() => !item.is_read && markOne.mutate(item.id)}
              className={`mb-2.5 flex-row rounded-2xl border p-3.5 active:opacity-90 ${
                item.is_read ? "border-border bg-surface" : "border-primary-100 bg-primary-50/50"
              }`}
            >
              <IconChip icon={item.is_read ? "notifications-outline" : "notifications"} tone={item.is_read ? "neutral" : "primary"} />
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text className="flex-1 text-[14px] font-bold text-ink">{item.title}</Text>
                  {!item.is_read ? <View className="ml-2 h-2 w-2 rounded-full bg-primary" /> : null}
                </View>
                <Text className="mt-0.5 text-[13px] text-ink-soft">{item.message}</Text>
                <Text className="mt-1.5 text-[11px] text-ink-faint">{formatDateTime(item.created_at)}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState icon="notifications-off-outline" title="No notifications" message="You're all caught up." />
          }
        />
      )}
    </View>
  );
}
