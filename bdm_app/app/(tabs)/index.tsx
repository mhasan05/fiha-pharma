import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Img } from "@/components/Img";
import { getNotifications } from "@/api/notifications";
import { getOrders } from "@/api/orders";
import { getBanners, getCategoryWiseProducts } from "@/api/products";
import { getCustomerBalance } from "@/api/reports";
import { getSiteInfo } from "@/api/settings";
import { Ionicons } from "@/components/Icon";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader, Skeleton } from "@/components/ui";
import { mediaUrl } from "@/lib/env";
import { formatCurrency } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { shadow, useColors, type ColorPalette } from "@/theme";
import type { AppNotification, Banner, CategoryGroup, Order, Product } from "@/types/api";

const LOGO = require("../../assets/logo.png");
const PER_CATEGORY = 10;

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const t = useT();
  const c = useColors();

  const categories = useQuery({ queryKey: ["home-categories"], queryFn: getCategoryWiseProducts });
  const banners = useQuery({ queryKey: ["banners"], queryFn: getBanners });
  const orders = useQuery({ queryKey: ["orders"], queryFn: getOrders });
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: getNotifications });
  const unreadCount = (notifications.data ?? []).filter((n: AppNotification) => !n.is_read).length;
  const balance = useQuery({ queryKey: ["customer-balance"], queryFn: getCustomerBalance });
  const due = balance.data?.total_due ?? 0;

  const site = useQuery({ queryKey: ["site-info"], queryFn: getSiteInfo });
  // Brand shown in the header — sourced from Settings → General (site_info).
  // Falls back to the bundled logo/name while loading or if unset on the backend.
  const brandName = site.data?.name?.trim() || "Fiha Pharma";
  const brandLogoUri = mediaUrl(site.data?.logo, site.data?.version);
  // Admin-set WhatsApp number (digits only, with country code). Empty → hide button.
  const whatsapp = (site.data?.whatsapp_number ?? "").replace(/[^0-9]/g, "");
  function openWhatsApp(): void {
    if (!whatsapp) return;
    const text = encodeURIComponent("Hello, I would like to place an order.");
    Linking.openURL(`https://wa.me/${whatsapp}?text=${text}`).catch(() => undefined);
  }

  function refetchAll(): void {
    void categories.refetch();
    void banners.refetch();
    void orders.refetch();
    void notifications.refetch();
    void balance.refetch();
    void site.refetch();
  }

  const now = new Date();
  const monthLabel = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTotal = (orders.data ?? [])
    .filter((o: Order) => {
      // Only completed (delivered) orders count toward the total — ongoing
      // (pending / processing / shipped) orders are excluded.
      if (o.order_status !== "delivered") return false;
      const d = new Date(o.order_date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === monthKey;
    })
    .reduce((s: number, o: Order) => s + (Number(o.total_amount) || 0), 0);
  const sections = (categories.data ?? []).filter((c: CategoryGroup) => c.products.length > 0);

  return (
    <View className="flex-1 bg-canvas">
      {/* Header */}
      <View style={[shadow.sm, { paddingTop: insets.top + 12 }]} className="border-b border-border bg-surface px-4 pb-4">
        {/* Row 1 — brand + small alert icons (notification / notice) */}
        <View className="flex-row items-center">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-50">
            <Img source={brandLogoUri ? { uri: brandLogoUri } : LOGO} style={{ width: 32, height: 32 }} contentFit="contain" />
          </View>
          <View className="ml-3 flex-1 pr-3">
            <Text className="text-[20px] font-extrabold leading-[24px] tracking-tight text-ink" numberOfLines={1}>{brandName}</Text>
          </View>
          <View className="flex-row items-center" style={{ flexShrink: 0 }}>
            <HeaderAction icon="notifications-outline" size={18} onPress={() => router.push("/notifications" as Href)} c={c} badge={unreadCount} />
            <HeaderAction icon="megaphone-outline" size={18} onPress={() => router.push("/notice" as Href)} c={c} style={{ marginLeft: 10 }} />
          </View>
        </View>

        {/* Row 2 — prominent search bar + distinct filter button, kept well
            apart from the alert icons above so they're never mis-tapped. */}
        <View className="mt-4 flex-row items-center" style={{ gap: 10 }}>
          <Pressable
            onPress={() => router.push("/search" as Href)}
            className="h-12 flex-1 flex-row items-center rounded-2xl bg-primary-50 active:opacity-80"
            style={{ borderWidth: 1, borderColor: c.border, paddingLeft: 16, paddingRight: 14 }}
          >
            <Ionicons name="search" size={19} color={c.primary} />
            <Text className="ml-3 flex-1 text-[14px] text-ink-muted" numberOfLines={1}>{t("searchProducts")}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/filter" as Href)}
            className="h-12 flex-row items-center justify-center rounded-2xl active:opacity-90"
            style={[shadow.sm, { backgroundColor: c.primary, paddingHorizontal: 18 }]}
          >
            <Ionicons name="options-outline" size={19} color={c.white} />
            <Text className="ml-2 text-[14px] font-bold text-white">{t("filter")}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(c: CategoryGroup) => String(c.category_id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={categories.isRefetching} onRefresh={refetchAll} tintColor={c.primary} />}
        ListHeaderComponent={
          <View>
            <BannerCarousel banners={banners.data ?? []} width={width} loading={banners.isLoading} />

            {due > 0 ? (
              /* Has a due → Total Order + Total Due side by side in one row. */
              <View className="mx-4 mb-1 mt-4 flex-row" style={{ gap: 12 }}>
                <Pressable onPress={() => router.push("/monthly-orders" as Href)} className="flex-1 active:opacity-95">
                  <LinearGradient colors={["#0F9D6E", "#0C8259"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[shadow.md, { borderRadius: 16, paddingVertical: 11, paddingHorizontal: 13, justifyContent: "center", minHeight: 74 }]}>
                    <View className="flex-row items-center">
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-white/20">
                        <Ionicons name="trending-up" size={13} color={c.white} />
                      </View>
                      <Text style={{ color: "#FFFFFF" }} className="ml-1.5 flex-1 text-[11px] font-semibold" numberOfLines={1}>{t("totalOrder")} - {monthLabel}</Text>
                    </View>
                    <Text style={{ color: "#FFFFFF" }} className="mt-1 text-[18px] font-extrabold" numberOfLines={1}>{formatCurrency(monthTotal)}</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable onPress={() => router.push("/(tabs)/history")} className="flex-1 active:opacity-95">
                  <LinearGradient colors={["#E11D48", "#BE123C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[shadow.md, { borderRadius: 16, paddingVertical: 11, paddingHorizontal: 13, justifyContent: "center", minHeight: 74 }]}>
                    <View className="flex-row items-center">
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-white/20">
                        <Ionicons name="wallet-outline" size={13} color={c.white} />
                      </View>
                      <Text style={{ color: "#FFFFFF" }} className="ml-1.5 flex-1 text-[11.5px] font-semibold" numberOfLines={1}>{t("totalDue")}</Text>
                    </View>
                    <Text style={{ color: "#FFFFFF" }} className="mt-1 text-[18px] font-extrabold" numberOfLines={1}>{formatCurrency(due)}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : whatsapp ? (
              /* No due + WhatsApp set → Total Order + Order on WhatsApp side by side. */
              <View className="mx-4 mb-1 mt-4 flex-row" style={{ gap: 12 }}>
                <Pressable onPress={() => router.push("/monthly-orders" as Href)} className="flex-1 active:opacity-95">
                  <LinearGradient colors={["#0F9D6E", "#0C8259"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[shadow.md, { borderRadius: 16, paddingVertical: 11, paddingHorizontal: 13, justifyContent: "center", minHeight: 74 }]}>
                    <View className="flex-row items-center">
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-white/20">
                        <Ionicons name="trending-up" size={13} color={c.white} />
                      </View>
                      <Text style={{ color: "#FFFFFF" }} className="ml-1.5 flex-1 text-[11px] font-semibold" numberOfLines={1}>{t("totalOrder")} - {monthLabel}</Text>
                    </View>
                    <Text style={{ color: "#FFFFFF" }} className="mt-1 text-[18px] font-extrabold" numberOfLines={1}>{formatCurrency(monthTotal)}</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable onPress={openWhatsApp} className="flex-1 active:opacity-95">
                  <LinearGradient colors={["#10B981", "#047857"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[shadow.md, { borderRadius: 16, paddingVertical: 11, paddingHorizontal: 13, justifyContent: "center", minHeight: 74 }]}>
                    <View className="flex-row items-center">
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-white/20">
                        <Ionicons name="logo-whatsapp" size={15} color={c.white} />
                      </View>
                      <Text style={{ color: "#FFFFFF" }} className="ml-1.5 flex-1 text-[11.5px] font-semibold" numberOfLines={1}>Order on WhatsApp</Text>
                    </View>
                    <Text style={{ color: "rgba(255,255,255,0.9)" }} className="mt-1 text-[13px] font-bold" numberOfLines={1}>Tap to chat →</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : (
              /* No due + no WhatsApp → full-width Total Order hero. */
              <Pressable onPress={() => router.push("/monthly-orders" as Href)} className="mx-4 mb-1 mt-4 active:opacity-95">
                <LinearGradient
                  colors={["#0F9D6E", "#0C8259"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[shadow.md, { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 }]}
                >
                  <View className="flex-row items-center">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <Ionicons name="trending-up" size={18} color={c.white} />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text style={{ color: "#FFFFFF" }} className="text-[14px] font-bold" numberOfLines={1}>{t("totalOrder")}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.85)" }} className="mt-0.5 text-[11px] font-medium" numberOfLines={1}>{monthLabel}</Text>
                    </View>
                    <Text style={{ color: "#FFFFFF" }} className="text-[20px] font-extrabold">{formatCurrency(monthTotal)}</Text>
                    <View className="ml-2 h-7 w-7 items-center justify-center rounded-full bg-white/20">
                      <Ionicons name="chevron-forward" size={15} color={c.white} />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            )}

            {categories.isLoading ? (
              <View className="mt-4 flex-row gap-3 px-4">
                <View className="flex-1"><Skeleton height={220} radius={16} /></View>
                <View className="flex-1"><Skeleton height={220} radius={16} /></View>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }: { item: CategoryGroup }) => (
          <View className="mt-3">
            <View className="px-4">
              <SectionHeader title={item.category_name} actionLabel={t("viewAll")} onAction={() => router.push("/products" as Href)} />
            </View>
            {/* Horizontal scroll of products for this category */}
            <FlatList
              horizontal
              data={item.products.slice(0, PER_CATEGORY)}
              keyExtractor={(p: Product) => String(p.product_id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item: p }: { item: Product }) => (
                <View style={{ width: 168 }}>
                  <ProductCard product={p} onPress={() => router.push(`/product/${p.product_id}` as Href)} />
                </View>
              )}
            />
          </View>
        )}
        ListEmptyComponent={
          categories.isLoading ? null : (
            <Text className="px-4 py-10 text-center text-ink-muted">No products found.</Text>
          )
        }
      />
    </View>
  );
}

/** Round icon button for the home header. Uses inline styles for size/bg/border
 *  so it renders on native even if a NativeWind class fails to resolve. */
function HeaderAction({
  icon,
  size,
  onPress,
  c,
  style,
  badge,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  size: number;
  onPress: () => void;
  c: ColorPalette;
  style?: StyleProp<ViewStyle>;
  badge?: number;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      className="active:opacity-70"
      style={[
        {
          height: 36,
          width: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.primary50,
          borderWidth: 1,
          borderColor: c.border,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={c.ink} />
      {badge && badge > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 17,
            height: 17,
            borderRadius: 9,
            paddingHorizontal: 3,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.danger,
            borderWidth: 1.5,
            borderColor: c.surface,
          }}
        >
          <Text style={{ color: c.white, fontSize: 9, fontWeight: "800" }}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// Banner card aspect (width / height). Lower = taller. The image fills via
// cover, so a taller card crops the sides slightly but reads bigger/bolder.
const BANNER_ASPECT = 1.95;

function BannerCarousel({ banners, width, loading }: { banners: Banner[]; width: number; loading: boolean }): React.ReactElement {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Banner>>(null);
  const bannerHeight = (width - 32) / BANNER_ASPECT;

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>): void {
    // Each slide is one full viewport wide, so page by `width`.
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  // Real banners plus a clone of the first, enabling a seamless forward loop.
  const slides: Banner[] = banners.length > 1 && banners[0] ? [...banners, banners[0]] : banners;
  const activeDot = banners.length > 0 ? index % banners.length : 0;

  // Auto-advance ALWAYS right-to-left (next slide enters from the right). We
  // append a clone of the first banner; advancing onto it animates smoothly in
  // the same direction, then we snap back to the real first slide without
  // animation — so it never scrolls backward on loop.
  useEffect(() => {
    if (banners.length <= 1 || width <= 0) return;
    if (index >= banners.length) {
      // On the appended clone (visually == first): snap to the real first.
      const id = setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
        setIndex(0);
      }, 500);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      const next = index + 1;
      listRef.current?.scrollToOffset({ offset: next * width, animated: true });
      setIndex(next);
    }, 4000);
    return () => clearTimeout(id);
  }, [index, banners.length, width]);

  if (loading) {
    return (
      <View className="mt-4 px-4">
        <Skeleton height={bannerHeight} radius={16} />
      </View>
    );
  }
  if (banners.length === 0) return <View className="mt-1" />;

  return (
    <View className="mt-4">
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        keyExtractor={(b, i) => `${b.banner_id}-${i}`}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => {
          const uri = mediaUrl(item.image, item.created_on);
          return (
            // Full-width slide → clean paging, no peeking of the next banner.
            <View style={{ width }} className="px-4">
              <View className="overflow-hidden rounded-2xl bg-primary-50" style={{ height: bannerHeight }}>
                {uri ? (
                  <Img source={{ uri }} style={{ width: "100%", height: bannerHeight }} contentFit="cover" />
                ) : null}
              </View>
            </View>
          );
        }}
      />
      {banners.length > 1 ? (
        <View className="mt-2 flex-row justify-center gap-1.5">
          {banners.map((b, i) => (
            <View key={b.banner_id} className={`h-1.5 rounded-full ${i === activeDot ? "w-4 bg-primary" : "w-1.5 bg-border-strong"}`} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
