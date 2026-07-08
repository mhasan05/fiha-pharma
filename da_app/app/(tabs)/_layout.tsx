import { Ionicons } from "@/components/Icon";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Redirect, Tabs } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LoadingSpinner } from "@/components/ui";
import { shadow, theme } from "@/theme";
import { useAuthStore } from "@/store/authStore";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const TABS: Record<string, { label: string; icon: IoniconName; activeIcon: IoniconName }> = {
  index: { label: "Home", icon: "home-outline", activeIcon: "home" },
  orders: { label: "Orders", icon: "file-tray-outline", activeIcon: "file-tray" },
  deposit: { label: "Deposit", icon: "cash-outline", activeIcon: "cash" },
  due: { label: "Due", icon: "card-outline", activeIcon: "card" },
  profile: { label: "Profile", icon: "person-outline", activeIcon: "person" },
};

const ORDER = ["index", "orders", "deposit", "due", "profile"];

/** Custom tab bar — minimal, with a pill behind the active icon. */
function TabBar({ state, navigation }: BottomTabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const routesByName = new Map(state.routes.map((r) => [r.name, r]));

  return (
    <View
      style={[shadow.up, { paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 12 }]}
      className="flex-row border-t border-border bg-surface px-2 pt-2.5"
    >
      {ORDER.map((name) => {
        const route = routesByName.get(name);
        const meta = TABS[name];
        if (!route || !meta) return null;
        const index = state.routes.findIndex((r) => r.key === route.key);
        const focused = state.index === index;
        const color = focused ? theme.color.primary : theme.color.inkFaint;

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            className="flex-1 items-center justify-center"
          >
            <View className={`h-10 w-10 items-center justify-center rounded-full ${focused ? "bg-primary/10" : ""}`}>
              <Ionicons name={focused ? meta.activeIcon : meta.icon} size={21} color={color} />
            </View>
            <Text
              numberOfLines={1}
              style={{ color }}
              className={`mt-1 text-[11px] ${focused ? "font-bold" : "font-medium"}`}
            >
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Authenticated tab navigator for the delivery agent. */
export default function AppLayout(): React.ReactElement {
  const hydrating = useAuthStore((s) => s.hydrating);
  const token = useAuthStore((s) => s.token);

  if (hydrating) return <LoadingSpinner label="Loading…" />;
  if (!token) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      {/* Reset the Orders stack to the shipment list whenever the tab is left,
          so returning never reopens the last-viewed order detail. */}
      <Tabs.Screen name="orders" options={{ popToTopOnBlur: true }} />
      <Tabs.Screen name="deposit" />
      <Tabs.Screen name="due" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
