import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getNotices } from "@/api/notices";
import { Ionicons } from "@/components/Icon";
import { MenuBar } from "@/components/MenuBar";
import { EmptyState, Skeleton } from "@/components/ui";
import { shadow, useColors } from "@/theme";
import { useT } from "@/lib/i18n";
import type { Notice } from "@/types/api";

export default function NoticeScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const t = useT();
  const { data = [], isLoading } = useQuery({ queryKey: ["notices"], queryFn: getNotices });

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center border-b border-border bg-surface px-4 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2 h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t("notice")}</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(n: Notice) => String(n.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: Notice }) => (
          <View style={shadow.sm} className="mb-3 rounded-2xl border border-border bg-surface p-4">
            {item.title ? <Text className="mb-1.5 text-[15px] font-bold text-ink">{item.title}</Text> : null}
            <Text className="text-[14px] leading-6 text-ink-soft">{item.message}</Text>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? <Skeleton height={120} radius={16} /> : <EmptyState icon="megaphone-outline" title={t("noNotices")} message="There are no notices right now." />
        }
      />
      <MenuBar active="index" />
    </View>
  );
}
