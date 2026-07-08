import { LinearGradient } from "expo-linear-gradient";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@/components/Icon";
import { shadow, useColors } from "@/theme";
import type { AppRelease } from "@/types/api";

/**
 * Full-screen, non-dismissible blocker shown when the latest release has
 * `force_update` on and the installed build is older. There is no back / close —
 * the only action is to download the new APK. Rendered in place of the app Stack.
 */
export function ForceUpdateScreen({ rel }: { rel: AppRelease }): React.ReactElement {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const sizeMb = rel.file_size ? `${(rel.file_size / 1048576).toFixed(1)} MB` : "";

  function openUpdate(): void {
    if (rel.apk_url) void Linking.openURL(rel.apk_url).catch(() => undefined);
  }

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          {/* Gradient icon badge */}
          <LinearGradient
            colors={["#0F9D6E", "#0C8259"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[shadow.md, { height: 112, width: 112, borderRadius: 56, alignItems: "center", justifyContent: "center" }]}
          >
            <Ionicons name="cloud-download-outline" size={50} color="#FFFFFF" />
          </LinearGradient>

          <Text className="mt-7 text-center text-[24px] font-extrabold text-ink">Update Required</Text>
          <Text className="mt-2 text-center text-[14px] leading-6 text-ink-muted">
            A new version of Fiha Pharma is available. Please update to the latest version to keep using the app.
          </Text>

          {/* Version + size chips */}
          <View className="mt-4 flex-row" style={{ gap: 8 }}>
            <View className="flex-row items-center rounded-full bg-primary-50 px-3 py-1.5">
              <Ionicons name="rocket-outline" size={13} color={c.primary} />
              <Text className="ml-1.5 text-[12px] font-bold text-ink">v{rel.updated_version}</Text>
            </View>
            {sizeMb ? (
              <View className="flex-row items-center rounded-full bg-primary-50 px-3 py-1.5">
                <Ionicons name="cloud-outline" size={13} color={c.inkMuted} />
                <Text className="ml-1.5 text-[12px] font-semibold text-ink-muted">{sizeMb}</Text>
              </View>
            ) : null}
          </View>

          {/* Release notes */}
          {rel.release_notes ? (
            <View style={shadow.sm} className="mt-6 w-full rounded-2xl border border-border bg-surface p-4">
              <Text className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">What&apos;s new</Text>
              <Text className="mt-1.5 text-[13px] leading-6 text-ink-soft">{rel.release_notes}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky action — the only way forward */}
      <View className="px-6" style={{ paddingBottom: insets.bottom + 16 }}>
        <Pressable onPress={openUpdate} style={shadow.primary} className="items-center rounded-2xl bg-primary py-4 active:opacity-90">
          <View className="flex-row items-center">
            <Ionicons name="download-outline" size={18} color="#FFFFFF" />
            <Text className="ml-2 text-[15px] font-bold text-white">Update Now</Text>
          </View>
        </Pressable>
        <Text className="mt-3 text-center text-[11px] text-ink-faint">You must update to continue using the app.</Text>
      </View>
    </View>
  );
}
