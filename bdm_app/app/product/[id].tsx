import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getProduct } from "@/api/products";
import { Ionicons } from "@/components/Icon";
import { Img } from "@/components/Img";
import { MenuBar } from "@/components/MenuBar";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState, LoadingSpinner } from "@/components/ui";
import { mediaUrl } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { STOCK_TINT, stockState } from "@/lib/stock";
import { shadow, useColors } from "@/theme";
import { useT } from "@/lib/i18n";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types/api";

export default function ProductDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const t = useT();

  const qty = useCartStore((s) => s.qtyOf(productId));
  const add = useCartStore((s) => s.add);
  const setQty = useCartStore((s) => s.setQty);

  const validId = Number.isFinite(productId);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
    enabled: validId,
  });

  const product = data?.data;
  const suggested = data?.suggested_products ?? [];
  const stock = product ? stockState(product) : "in";
  const soldOut = stock === "out";
  const tint = soldOut ? "#0F9D6E" : STOCK_TINT[stock];

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center border-b border-border bg-surface px-4 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2 h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-ink">{t("back")}</Text>
        <Pressable onPress={() => router.push("/search" as Href)} hitSlop={8} className="h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="search" size={20} color={c.ink} />
        </Pressable>
        <Pressable onPress={() => router.push("/filter" as Href)} hitSlop={8} className="h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="funnel-outline" size={19} color={c.ink} />
        </Pressable>
      </View>

      {!validId || isError || (!isLoading && !product) ? (
        <EmptyState icon="cube-outline" title={t("noResults")} message="This product could not be found." />
      ) : isLoading || !product ? (
        <LoadingSpinner label="Loading…" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {/* Main card */}
          <View style={shadow.sm} className="overflow-hidden rounded-2xl border border-border bg-surface">
            <View className="h-56 items-center justify-center bg-surface">
              {mediaUrl(product.product_image, product.updated_on) ? (
                <Img source={{ uri: mediaUrl(product.product_image, product.updated_on) as string }} style={{ width: "70%", height: 178 }} contentFit="contain" />
              ) : (
                <Ionicons name="cube-outline" size={56} color={c.inkFaint} />
              )}
              {product.mrp > product.selling_price ? (
                <View className="absolute left-0 top-0 rounded-br-2xl bg-danger px-3 py-1.5">
                  <Text className="text-[12px] font-bold text-white">{product.discount_percent.toFixed(1)}% Off</Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row items-start justify-between px-4 pb-4 pt-3">
              <View className="flex-1 pr-3">
                <Text className="text-[20px] font-extrabold text-ink">{product.product_name}</Text>
                {product.generic_name ? <Text className="mt-1 text-[14px] text-ink-muted">{product.generic_name}</Text> : null}
                <Text className="text-[14px] text-ink-muted">{product.company_name}</Text>
              </View>
              <View className="rounded-xl bg-primary-50 px-3 py-1.5">
                <Text className="text-[13px] font-semibold text-ink-muted">{product.quantity_per_box ?? 0} pcs</Text>
              </View>
            </View>
          </View>

          {/* Add to cart + price */}
          <View style={shadow.sm} className="mt-4 flex-row items-center justify-between rounded-2xl border border-border bg-surface p-3">
            {soldOut ? (
              <View className="flex-1 flex-row items-center justify-center rounded-full bg-danger py-3">
                <Ionicons name="close-circle-outline" size={18} color={c.white} />
                <Text className="ml-2 text-[15px] font-bold text-white">{t("outOfStock")}</Text>
              </View>
            ) : qty > 0 ? (
              <View style={{ backgroundColor: tint }} className="flex-1 flex-row items-center justify-between rounded-full px-2 py-1.5">
                <Pressable onPress={() => setQty(productId, qty - 1)} hitSlop={8} className="h-8 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
                  <Ionicons name="remove" size={18} color={c.white} />
                </Pressable>
                <Text className="text-[15px] font-bold text-white">{qty} {t("inCart")}</Text>
                <Pressable onPress={() => add(product)} hitSlop={8} className="h-8 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
                  <Ionicons name="add" size={18} color={c.white} />
                </Pressable>
              </View>
            ) : stock === "in" ? (
              <Pressable onPress={() => add(product)} className="flex-1 items-center justify-center rounded-full border border-primary py-3 active:opacity-80">
                <Text className="text-[15px] font-bold text-primary">{t("addToCart")}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => add(product)} style={{ backgroundColor: tint }} className="flex-1 items-center justify-center rounded-full py-3 active:opacity-90">
                <Text className="text-[15px] font-bold text-white">{t("addToCart")}</Text>
              </Pressable>
            )}
            <View className="ml-3 items-end">
              {product.mrp > product.selling_price ? (
                <Text className="text-[12px] text-ink-faint line-through">{formatPrice(product.mrp)}</Text>
              ) : null}
              <View className="rounded-xl bg-primary-50 px-3 py-1.5">
                <Text className="text-[16px] font-extrabold text-primary">{formatPrice(product.selling_price)}</Text>
              </View>
            </View>
          </View>

          {product.product_description ? (
            <View className="mt-4">
              <Text className="mb-1 text-[15px] font-bold text-ink">{t("description")}</Text>
              <Text className="text-[13px] leading-5 text-ink-muted">{product.product_description}</Text>
            </View>
          ) : null}

          {suggested.length > 0 ? (
            <View className="mt-6">
              <Text className="mb-3 text-[17px] font-extrabold text-ink">{t("suggestedProducts")}</Text>
              <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                {suggested.map((p: Product) => (
                  <View key={p.product_id} style={{ width: "47.6%" }}>
                    <ProductCard product={p} onPress={() => router.push(`/product/${p.product_id}` as Href)} />
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
      <MenuBar active="index" />
    </View>
  );
}
