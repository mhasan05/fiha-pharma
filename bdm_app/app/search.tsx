import { useQuery } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { searchProducts } from "@/api/products";
import { Ionicons } from "@/components/Icon";
import { MenuBar } from "@/components/MenuBar";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState, Skeleton } from "@/components/ui";
import { useColors } from "@/theme";
import { useT } from "@/lib/i18n";
import type { Product } from "@/types/api";

export default function SearchScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const t = useT();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 350);
    return () => clearTimeout(t);
  }, [term]);

  const { data = [], isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => searchProducts(debounced),
    enabled: debounced.length >= 2,
  });

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center border-b border-border bg-surface px-3 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} className="h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </Pressable>
        <View className="ml-1 h-11 flex-1 flex-row items-center rounded-full bg-primary-50 px-4">
          <Ionicons name="search" size={18} color={c.inkFaint} />
          <TextInput
            className="ml-2 h-full flex-1 py-0 text-[15px] text-ink"
            placeholder={t("searchProducts")}
            placeholderTextColor={c.inkFaint}
            autoFocus
            value={term}
            onChangeText={setTerm}
          />
          {term ? (
            <Pressable onPress={() => setTerm("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={c.inkFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(p) => String(p.product_id)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: Product }) => (
          <View className="flex-1">
            <ProductCard product={item} onPress={() => router.push(`/product/${item.product_id}` as Href)} />
          </View>
        )}
        ListEmptyComponent={
          debounced.length < 2 ? (
            <EmptyState icon="search-outline" title={t("searchProducts")} message={t("searchHint")} />
          ) : isLoading || isFetching ? (
            <View className="flex-row gap-3 px-4">
              <View className="flex-1"><Skeleton height={220} radius={16} /></View>
              <View className="flex-1"><Skeleton height={220} radius={16} /></View>
            </View>
          ) : isError ? (
            <EmptyState icon="cloud-offline-outline" title={t("loadFailed")} message={t("loadFailedHint")} actionLabel={t("retry")} onAction={() => void refetch()} />
          ) : (
            <EmptyState icon="sad-outline" title={t("noResults")} message={`${debounced}`} />
          )
        }
      />
      <MenuBar active="index" />
    </View>
  );
}
