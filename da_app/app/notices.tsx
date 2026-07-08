import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl, Text, View } from "react-native";

import { getNotices } from "@/api/notifications";
import { qk } from "@/api/queryKeys";
import { BackHeader } from "@/components/Screen";
import { Card, EmptyState, IconChip, LoadingSpinner } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { theme } from "@/theme";
import type { Notice } from "@/types/api";

export default function NoticesScreen(): React.ReactElement {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: qk.notices,
    queryFn: getNotices,
  });

  return (
    <View className="flex-1 bg-canvas">
      <BackHeader title="Announcements" />

      {isLoading ? (
        <LoadingSpinner label="Loading…" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={theme.color.primary} />}
          renderItem={({ item }: { item: Notice }) => (
            <Card className="mb-3">
              <View className="flex-row items-center">
                <IconChip icon="megaphone" tone="warning" />
                <Text className="ml-3 flex-1 text-[15px] font-bold text-ink">{item.title}</Text>
              </View>
              <Text className="mt-2.5 text-[14px] leading-5 text-ink-soft">{item.message}</Text>
              <Text className="mt-2.5 text-[11px] text-ink-faint">{formatDate(item.created_at)}</Text>
            </Card>
          )}
          ListEmptyComponent={<EmptyState icon="megaphone-outline" title="No announcements" />}
        />
      )}
    </View>
  );
}
