import { useRouter, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@/components/Icon";
import { formatCurrency } from "@/lib/format";
import { useT, type TKey } from "@/lib/i18n";
import { shadow, useColors } from "@/theme";
import { useCartStore } from "@/store/cartStore";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];
type TabName = "index" | "cart" | "history" | "profile";

const TABS: Record<TabName, { labelKey: TKey; icon: IoniconName; activeIcon: IoniconName; href: Href }> = {
  index: { labelKey: "home", icon: "home-outline", activeIcon: "home", href: "/(tabs)" },
  cart: { labelKey: "cart", icon: "bag-outline", activeIcon: "bag", href: "/(tabs)/cart" },
  history: { labelKey: "history", icon: "receipt-outline", activeIcon: "receipt", href: "/(tabs)/history" },
  profile: { labelKey: "profile", icon: "person-outline", activeIcon: "person", href: "/(tabs)/profile" },
};

const ALL: TabName[] = ["index", "cart", "history", "profile"];
const WITH_CHECKOUT: TabName[] = ["index", "history", "profile"];

/**
 * The bottom navigation, for use on stack screens (search, filter, etc.) that
 * live outside the tab navigator. Mirrors the tab bar, including the Checkout
 * pill when the cart has items. `active` highlights the relevant tab.
 */
export function MenuBar({ active }: { active?: TabName }): React.ReactElement {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const c = useColors();
  const cartCount = useCartStore((s) => s.itemCount());
  const cartTotal = useCartStore((s) => s.subtotal());
  const hasCart = cartCount > 0;

  function renderTab(name: TabName, iconOnly: boolean): React.ReactElement {
    const meta = TABS[name];
    const focused = active === name;
    const color = focused ? c.primary : c.inkFaint;
    return (
      <Pressable key={name} onPress={() => router.navigate(meta.href)} className="flex-1 items-center justify-center">
        <View className={`h-10 w-10 items-center justify-center rounded-full ${focused ? "bg-primary/10" : ""}`}>
          <Ionicons name={focused ? meta.activeIcon : meta.icon} size={21} color={color} />
          {name === "cart" && cartCount > 0 ? (
            <View className="absolute -right-1 -top-1 h-4 min-w-4 items-center justify-center rounded-full border-2 border-surface bg-danger px-1">
              <Text className="text-[9px] font-bold text-white">{cartCount > 9 ? "9+" : cartCount}</Text>
            </View>
          ) : null}
        </View>
        {iconOnly ? null : (
          <Text numberOfLines={1} style={{ color }} className={`mt-1 text-[11px] ${focused ? "font-bold" : "font-medium"}`}>
            {t(meta.labelKey)}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <View
      style={[shadow.up, { paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 12 }]}
      className="flex-row items-center border-t border-border bg-surface px-2 pt-2.5"
    >
      {hasCart ? (
        <>
          <Pressable
            onPress={() => router.navigate("/(tabs)/cart")}
            style={shadow.primary}
            className="mr-1 h-12 flex-[2.3] flex-row items-center rounded-2xl bg-primary pl-4 pr-2 active:opacity-90"
          >
            <Text numberOfLines={1} className="flex-shrink text-[14px] font-bold text-white">{t("checkout")}</Text>
            <View className="ml-2 flex-shrink-0 rounded-xl bg-white/20 px-2.5 py-1">
              <Text numberOfLines={1} className="text-[13px] font-extrabold text-white">{formatCurrency(cartTotal)}</Text>
            </View>
          </Pressable>
          {WITH_CHECKOUT.map((n) => renderTab(n, true))}
        </>
      ) : (
        ALL.map((n) => renderTab(n, false))
      )}
    </View>
  );
}
