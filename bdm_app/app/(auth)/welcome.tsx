import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getSiteInfo } from "@/api/settings";
import { Ionicons } from "@/components/Icon";
import { Img } from "@/components/Img";
import { Button } from "@/components/ui";
import { mediaUrl } from "@/lib/env";
import { shadow, useColors } from "@/theme";

const LOGO = require("../../assets/logo.png");

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const FEATURES: { icon: IoniconName; title: string; subtitle: string }[] = [
  { icon: "cube-outline", title: "Browse & order", subtitle: "Thousands of products at your fingertips" },
  { icon: "flash-outline", title: "Faster checkout", subtitle: "Place orders in seconds, track in real time" },
  { icon: "shield-checkmark-outline", title: "Secure & reliable", subtitle: "Your account and orders stay protected" },
];

export default function WelcomeScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const site = useQuery({ queryKey: ["site-info"], queryFn: getSiteInfo });
  // Brand sourced from Settings → General (site_info); falls back while loading.
  const brandName = site.data?.name?.trim() || "Fiha Pharma";
  const brandTagline = site.data?.description?.trim() || "Manage your orders. Smarter & faster.";
  const brandLogoUri = mediaUrl(site.data?.logo, site.data?.version);

  return (
    <View className="flex-1 bg-canvas">
      {/* Brand hero — gradient panel with the logo and welcome copy. */}
      <LinearGradient
        colors={["#0F9D6E", "#0C8259", "#0A6B4A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 48,
          paddingBottom: 44,
          paddingHorizontal: 28,
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
        }}
      >
        <View
          style={shadow.hero}
          className="h-24 w-24 items-center justify-center self-start rounded-[26px] bg-white"
        >
          <Img source={brandLogoUri ? { uri: brandLogoUri } : LOGO} style={{ width: 60, height: 60 }} contentFit="contain" />
        </View>

        <Text className="mt-8 text-[13px] font-semibold uppercase tracking-[2px] text-white/70">
          Welcome to
        </Text>
        <Text className="mt-1 text-[34px] font-extrabold leading-[40px] tracking-tight text-white" numberOfLines={2}>
          {brandName}
        </Text>
        <Text className="mt-3 text-[15px] leading-[22px] text-white/85" numberOfLines={2}>
          {brandTagline}
        </Text>
      </LinearGradient>

      {/* Value highlights */}
      <View className="flex-1 justify-center px-7">
        <View className="gap-4">
          {FEATURES.map((f) => (
            <View key={f.title} className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
                <Ionicons name={f.icon} size={22} color={c.primary} />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>{f.title}</Text>
                <Text className="mt-0.5 text-[13px] text-ink-muted" numberOfLines={2}>{f.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View className="gap-3 px-7" style={{ paddingBottom: insets.bottom + 24 }}>
        <Button title="Log In" icon="log-in-outline" onPress={() => router.push("/(auth)/login")} />
        <Button title="Create an account" variant="primaryOutline" onPress={() => router.push("/(auth)/signup")} />
        <Text className="mt-1 text-center text-[12px] leading-[18px] text-ink-faint">
          By continuing you agree to our Terms & Privacy Policy.
        </Text>
      </View>
    </View>
  );
}
