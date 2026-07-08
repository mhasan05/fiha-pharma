import "../global.css";

import Ionicons from "@expo/vector-icons/Ionicons";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { getLatestAppUpdate } from "@/api/settings";
import { ForceUpdateScreen } from "@/components/ForceUpdateScreen";
import { useAuthStore } from "@/store/authStore";

export default function RootLayout(): React.ReactElement | null {
  const hydrate = useAuthStore((s) => s.hydrate);

  // Preload the icon font so glyphs render in standalone builds (browsers load
  // icon fonts automatically, but native release builds must register them first).
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);

  // Restore the persisted session once on app start.
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // One client per app session; created lazily so it survives fast-refresh.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Hold the UI until the icon font is ready (or has definitively failed),
  // so icons never render as empty boxes.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: "#F5F6F8" }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppGate />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

/** Blocks the app on a mandatory update (server `force_update` on + installed
 *  build older). Fail-open: any error means the update query resolves without a
 *  release, so a network hiccup never locks the user out. */
function AppGate(): React.ReactElement {
  const update = useQuery({ queryKey: ["app-update"], queryFn: getLatestAppUpdate, retry: 0, staleTime: 60_000 });

  if (update.isLoading) {
    return <View style={{ flex: 1, backgroundColor: "#F5F6F8" }} />;
  }

  const rel = update.data?.update_available ? update.data.data : null;
  if (rel && rel.force_update && rel.apk_url) {
    return <ForceUpdateScreen rel={rel} />;
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F6F8" } }} />;
}
