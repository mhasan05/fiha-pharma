import "../global.css";

import Ionicons from "@expo/vector-icons/Ionicons";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { getLatestAppUpdate, getSiteInfo } from "@/api/settings";
import { FeedbackModal } from "@/components/FeedbackModal";
import { ForceUpdateScreen } from "@/components/ForceUpdateScreen";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { SplashScreen } from "@/components/SplashScreen";
import { paletteFor, themeVars, ThemeContext } from "@/theme";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { usePrefsStore } from "@/store/prefsStore";

export default function RootLayout(): React.ReactElement | null {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateCart = useCartStore((s) => s.hydrate);
  const hydratePrefs = usePrefsStore((s) => s.hydrate);

  // Preload the icon font so glyphs render in standalone builds.
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);

  useEffect(() => {
    void hydrateAuth();
    void hydrateCart();
    void hydratePrefs();
  }, [hydrateAuth, hydrateCart, hydratePrefs]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
        },
      })
  );

  if (!fontsLoaded && !fontError) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeRoot>
          <AppContent />
          <FeedbackModal />
        </ThemeRoot>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

/** Drives the ENTIRE theme from a single source — the persisted preference
 *  (prefsStore.mode). It provides the JS palette via ThemeContext AND applies
 *  the matching CSS variables, so JS colors and className colors can never
 *  drift apart (the bug where header icons went dark on a light UI). */
function ThemeRoot({ children }: { children: React.ReactNode }): React.ReactElement {
  const mode = usePrefsStore((s) => s.mode);
  const dark = mode === "dark";
  return (
    <ThemeContext.Provider value={paletteFor(mode)}>
      <View style={[{ flex: 1 }, dark ? themeVars.dark : themeVars.light]}>
        <StatusBar style={dark ? "light" : "dark"} />
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

/** Gates the whole app on maintenance mode (checked before login). Fail-open:
 *  if the check errors (e.g. no network), the app proceeds normally. */
function AppContent(): React.ReactElement {
  const site = useQuery({ queryKey: ["site-info"], queryFn: getSiteInfo, retry: 0, staleTime: 60_000 });
  const update = useQuery({ queryKey: ["app-update"], queryFn: getLatestAppUpdate, retry: 0, staleTime: 60_000 });

  // Brief splash while the first maintenance + update checks resolve
  // (both fail-open on error, so a network hiccup never locks the user out).
  if (site.isLoading || update.isLoading) {
    return <SplashScreen />;
  }

  if (site.data?.maintenance_mode) {
    return <MaintenanceScreen info={site.data} onRetry={() => void site.refetch()} retrying={site.isFetching} />;
  }

  // Mandatory update: the server flagged this newer release as force_update, and
  // the installed build is older. Block the whole app until they update.
  const rel = update.data?.update_available ? update.data.data : null;
  if (rel && rel.force_update && rel.apk_url) {
    return <ForceUpdateScreen rel={rel} />;
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F4F5F7" } }} />;
}
