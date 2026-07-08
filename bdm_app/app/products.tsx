import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getProducts, searchByCompanies, searchByGenerics } from "@/api/products";
import { Ionicons } from "@/components/Icon";
import { MenuBar } from "@/components/MenuBar";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState, Skeleton } from "@/components/ui";
import { useColors } from "@/theme";
import { useT } from "@/lib/i18n";
import type { Product } from "@/types/api";

const PAGE_SIZE = 20;

export default function ProductsScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const t = useT();
  const params = useLocalSearchParams<{ company_names?: string; generic_names?: string }>();

  const companyNames = (params.company_names ?? "").split(",").filter(Boolean);
  const genericNames = (params.generic_names ?? "").split(",").filter(Boolean);
  const isFiltered = companyNames.length > 0 || genericNames.length > 0;
  const title = companyNames.length > 0 ? companyNames.join(", ") : genericNames.length > 0 ? genericNames.join(", ") : t("products");

  // Filtered mode: a single fetch by company/generic.
  const filtered = useQuery({
    queryKey: ["products", "filter", params.company_names, params.generic_names],
    queryFn: () => (companyNames.length > 0 ? searchByCompanies(companyNames) : searchByGenerics(genericNames)),
    enabled: isFiltered,
  });

  // Default mode: infinite catalog.
  const all = useInfiniteQuery({
    queryKey: ["products", "all"],
    queryFn: ({ pageParam }) => getProducts({ page: pageParam, page_size: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined),
    enabled: !isFiltered,
  });

  const products: Product[] = isFiltered ? filtered.data ?? [] : (all.data?.pages ?? []).flat();
  const loading = isFiltered ? filtered.isLoading : all.isLoading;

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center border-b border-border bg-surface px-4 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2 h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-ink" numberOfLines={1}>{title}</Text>
        <Pressable onPress={() => router.push("/search" as Href)} hitSlop={8} className="h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="search" size={20} color={c.ink} />
        </Pressable>
        <Pressable onPress={() => router.push("/filter" as Href)} hitSlop={8} className="h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="funnel-outline" size={19} color={c.ink} />
        </Pressable>
      </View>

      <FlatList
        data={products}
        keyExtractor={(p, i) => `${p.product_id}-${i}`}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!isFiltered && all.hasNextPage && !all.isFetchingNextPage) void all.fetchNextPage();
        }}
        renderItem={({ item }: { item: Product }) => (
          <View className="flex-1">
            <ProductCard product={item} onPress={() => router.push(`/product/${item.product_id}` as Href)} />
          </View>
        )}
        ListFooterComponent={
          !isFiltered && all.isFetchingNextPage ? <ActivityIndicator color={c.primary} style={{ marginVertical: 16 }} /> : null
        }
        ListEmptyComponent={
          loading ? (
            <View className="flex-row gap-3 px-4">
              <View className="flex-1"><Skeleton height={220} radius={16} /></View>
              <View className="flex-1"><Skeleton height={220} radius={16} /></View>
            </View>
          ) : (
            <EmptyState icon="cube-outline" title={t("noProducts")} message="No products match this view." />
          )
        }
      />
      <MenuBar active="index" />
    </View>
  );
}
