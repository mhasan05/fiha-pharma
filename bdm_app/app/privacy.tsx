import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getPrivacyPolicy } from "@/api/settings";
import { Ionicons } from "@/components/Icon";
import { LegalView } from "@/components/LegalView";
import { MenuBar } from "@/components/MenuBar";
import { LoadingSpinner } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { PRIVACY } from "@/lib/legal";
import { shadow, useColors } from "@/theme";

export default function PrivacyScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const t = useT();

  const { data, isLoading } = useQuery({ queryKey: ["privacy-policy"], queryFn: getPrivacyPolicy });

  // Content stores each point on its own line, prefixed with "#".
  const lines = (data?.content ?? "")
    .split(/\r?\n/)
    .map((l: string) => l.replace(/^\s*#\s?/, "").trim())
    .filter(Boolean);

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center border-b border-border bg-surface px-4 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2 h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{data?.title || t("privacy")}</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner label="Loading…" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 96 }} showsVerticalScrollIndicator={false}>
          {lines.length > 0 ? (
            // Admin-provided policy from the backend.
            <View style={shadow.sm} className="rounded-2xl border border-border bg-surface p-4">
              {lines.map((line: string, i: number) => (
                <View key={i} className={`flex-row ${i > 0 ? "mt-3.5" : ""}`}>
                  <View className="mr-3 mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                  <Text className="flex-1 text-[14px] leading-6 text-ink-soft">{line}</Text>
                </View>
              ))}
            </View>
          ) : (
            // Professional default policy bundled with the app.
            <LegalView sections={PRIVACY} />
          )}
        </ScrollView>
      )}
      <MenuBar active="profile" />
    </View>
  );
}
