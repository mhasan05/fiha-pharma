import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Redirect, Tabs } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@/components/Icon";
import { LoadingSpinner } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { useT, type TKey } from "@/lib/i18n";
import { shadow, useColors } from "@/theme";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const TABS: Record<string, { labelKey: TKey; icon: IoniconName; activeIcon: IoniconName }> = {
  index: { labelKey: "home", icon: "home-outline", activeIcon: "home" },
  cart: { labelKey: "cart", icon: "bag-outline", activeIcon: "bag" },
  history: { labelKey: "history", icon: "receipt-outline", activeIcon: "receipt" },
  profile: { labelKey: "profile", icon: "person-outline", activeIcon: "person" },
};

const ALL_TABS = ["index", "cart", "history", "profile"];
// When the cart has items, the Cart tab is replaced by the Checkout pill.
const CHECKOUT_TABS = ["index", "history", "profile"];
// Fixed height for the inner bar row so the empty-cart layout (icon + label)
// and the checkout layout (pill) are always exactly the same height.
const ROW_H = 50;

function TabBar({ state, navigation }: BottomTabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const t = useT();
  const c = useColors();
  const cartCount = useCartStore((s) => s.itemCount());
  const cartTotal = useCartStore((s) => s.subtotal());
  const routesByName = new Map(state.routes.map((r) => [r.name, r]));
  const activeName = state.routes[state.index]?.name;
  // Show the Checkout pill only when the cart has items AND we're not on the
  // Cart tab (there it's redundant — the general bar with the Cart icon shows).
  const hasCart = cartCount > 0 && activeName !== "cart";

  function renderTab(name: string, iconOnly: boolean): React.ReactElement | null {
    const route = routesByName.get(name);
    const meta = TABS[name];
    if (!route || !meta) return null;
    const idx = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === idx;
    const color = focused ? c.primary : c.inkFaint;

    return (
      <Pressable
        key={route.key}
        onPress={() => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
        style={{ flex: 1, height: ROW_H, alignItems: "center", justifyContent: "center" }}
      >
        <View style={{ height: 34, width: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: focused ? "rgba(15,157,110,0.12)" : "transparent" }}>
          <Ionicons name={focused ? meta.activeIcon : meta.icon} size={21} color={color} />
          {name === "cart" && cartCount > 0 ? (
            <View style={{ position: "absolute", right: -4, top: -4, height: 16, minWidth: 16, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 2, borderColor: c.surface, backgroundColor: c.danger, paddingHorizontal: 3 }}>
              <Text style={{ fontSize: 9, fontWeight: "700", color: c.white }}>{cartCount > 9 ? "9+" : cartCount}</Text>
            </View>
          ) : null}
        </View>
        {iconOnly ? null : (
          <Text numberOfLines={1} style={{ color, marginTop: 2, fontSize: 11, lineHeight: 13, fontWeight: focused ? "700" : "500" }}>
            {t(meta.labelKey)}
          </Text>
        )}
      </Pressable>
    );
  }

  // The inner row is keyed by the current mode ("checkout" vs "tabs"). When the
  // cart flips between empty/non-empty, the key changes so React fully unmounts
  // the previous layout and mounts the new one — the two can NEVER be on screen
  // together (the intermittent "dual menu" overlap). Inline flex keeps it on one
  // line regardless of NativeWind class timing.
  return (
    <View
      style={[
        shadow.up,
        {
          borderTopWidth: 1,
          borderColor: c.border,
          backgroundColor: c.surface,
          paddingHorizontal: 8,
          paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 12,
        },
      ]}
    >
      <View key={hasCart ? "checkout" : "tabs"} style={{ height: ROW_H, flexDirection: "row", alignItems: "center", overflow: "hidden" }}>
        {hasCart ? (
          <>
            {/* Checkout pill (left) — replaces the Cart tab */}
            <Pressable
              key="checkout-pill"
              onPress={() => navigation.navigate("cart")}
              style={[shadow.primary, { flex: 2.7, height: 48, flexDirection: "row", alignItems: "center", borderRadius: 16, backgroundColor: c.primary, paddingLeft: 16, paddingRight: 8, marginRight: 6 }]}
              className="active:opacity-90"
            >
              <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 14, fontWeight: "700", color: c.white }}>{t("checkout")}</Text>
              <View style={{ marginLeft: 8, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "800", color: c.white }}>{formatCurrency(cartTotal)}</Text>
              </View>
            </Pressable>
            {/* Remaining tabs (right), icon-only */}
            {CHECKOUT_TABS.map((name) => renderTab(name, true))}
          </>
        ) : (
          ALL_TABS.map((name) => renderTab(name, false))
        )}
      </View>
    </View>
  );
}

export default function AppLayout(): React.ReactElement {
  const hydrating = useAuthStore((s) => s.hydrating);
  const token = useAuthStore((s) => s.token);

  if (hydrating) return <LoadingSpinner label="Loading…" />;
  if (!token) return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
