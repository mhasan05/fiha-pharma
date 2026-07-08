import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getLatestAppUpdate } from "@/api/settings";
import { Ionicons } from "@/components/Icon";
import { Img } from "@/components/Img";
import { Avatar, Card, IconChip } from "@/components/ui";
import { mediaUrl } from "@/lib/env";
import { useT } from "@/lib/i18n";
import { shadow, theme, useColors, type ColorPalette } from "@/theme";
import { feedback } from "@/store/feedbackStore";
import { useAuthStore } from "@/store/authStore";
import { usePrefsStore } from "@/store/prefsStore";

import { SUPPORT_MAIL, SUPPORT_PHONE } from "@/lib/constants";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export default function ProfileScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const avatarUri = mediaUrl(user?.image);

  const t = useT();
  const c = useColors();
  const lang = usePrefsStore((s) => s.lang);
  const mode = usePrefsStore((s) => s.mode);
  const setLang = usePrefsStore((s) => s.setLang);
  const setMode = usePrefsStore((s) => s.setMode);

  const update = useQuery({ queryKey: ["app-update"], queryFn: getLatestAppUpdate });
  const rel = update.data?.update_available ? update.data.data : null;
  const sizeMb = rel ? `${(rel.file_size / 1048576).toFixed(1)} MB` : "";

  async function doLogout(): Promise<void> {
    await logout();
    router.replace("/(auth)/welcome");
  }
  function confirmLogout(): void {
    feedback.confirm({
      title: t("logOut"),
      message: t("logoutConfirm"),
      confirmLabel: t("logOut"),
      cancelLabel: t("cancel"),
      destructive: true,
      onConfirm: () => void doLogout(),
    });
  }
  const openUrl = (url: string): void => void Linking.openURL(url).catch(() => undefined);

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center border-b border-border bg-surface px-5 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <Text className="flex-1 text-[24px] font-extrabold text-ink">{t("profile")}</Text>
        <Pressable onPress={() => router.push("/search" as Href)} hitSlop={8} className="h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="search" size={20} color={c.ink} />
        </Pressable>
        <Pressable onPress={() => router.push("/filter" as Href)} hitSlop={8} className="h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="funnel-outline" size={19} color={c.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <Card padded={false} className="overflow-hidden">
          {/* Gradient header: avatar + name + shop + edit */}
          <LinearGradient colors={["#0F9D6E", "#0C8259"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <View className="flex-row items-center">
              {avatarUri ? (
                <View style={{ height: 56, width: 56, borderRadius: 28, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.6)" }}>
                  <Img source={{ uri: avatarUri }} style={{ height: 44, width: 44, borderRadius: 22 }} contentFit="contain" />
                </View>
              ) : (
                <View style={{ borderRadius: 999, borderWidth: 2, borderColor: "rgba(255,255,255,0.6)" }}>
                  <Avatar name={user?.full_name ?? "Shop"} size={56} />
                </View>
              )}
              <View className="ml-3 flex-1">
                <Text style={{ color: "#FFFFFF" }} className="text-[18px] font-extrabold" numberOfLines={1}>{user?.full_name}</Text>
                {user?.shop_name ? <Text style={{ color: "rgba(255,255,255,0.85)" }} className="text-[13px]" numberOfLines={1}>{user.shop_name}</Text> : null}
              </View>
              <Pressable
                onPress={() => router.push("/edit-profile" as Href)}
                hitSlop={8}
                style={{ backgroundColor: "#FFFFFF" }}
                className="flex-row items-center rounded-full px-3 py-1.5 active:opacity-80"
              >
                <Ionicons name="create-outline" size={14} color={c.primary} />
                <Text style={{ color: c.primary }} className="ml-1 text-[13px] font-bold">{t("edit")}</Text>
              </Pressable>
            </View>
          </LinearGradient>

          {/* Details — premium labelled rows with icon chips */}
          <View className="px-4 pb-3 pt-1.5">
            {[
              user?.email ? { icon: "mail-outline" as IoniconName, label: t("email"), value: user.email } : null,
              user?.phone ? { icon: "call-outline" as IoniconName, label: t("phone"), value: user.phone } : null,
              user?.shop_address ? { icon: "location-outline" as IoniconName, label: t("address"), value: user.shop_address } : null,
              user?.area_name ? { icon: "navigate-outline" as IoniconName, label: t("area"), value: user.area_name } : null,
            ]
              .filter((d): d is { icon: IoniconName; label: string; value: string } => d !== null)
              .map((d, i) => (
                <View key={d.label}>
                  {i > 0 ? <View className="ml-[52px] h-px bg-border" /> : null}
                  <DetailRow icon={d.icon} label={d.label} value={d.value} c={c} />
                </View>
              ))}
          </View>
        </Card>

        {/* Update Available banner */}
        {rel ? (
          <LinearGradient
            colors={["#0C8259", "#0A6B4A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[shadow.hero, { borderRadius: 20, padding: 16, marginTop: 20 }]}
          >
            <View className="flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Ionicons name="phone-portrait-outline" size={20} color={theme.color.white} />
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text className="text-[15px] font-extrabold text-white">{t("updateAvailable")}</Text>
                  <View className="ml-2 rounded-full bg-white/20 px-2 py-0.5">
                    <Text className="text-[11px] font-bold text-white">v{rel.updated_version}</Text>
                  </View>
                </View>
                {rel.release_notes ? <Text className="mt-0.5 text-[12px] text-white/80">{rel.release_notes}</Text> : null}
                {sizeMb ? <Text className="text-[12px] text-white/70">{sizeMb}</Text> : null}
              </View>
              <Pressable
                onPress={() => rel.apk_url && openUrl(rel.apk_url)}
                className="rounded-full bg-white px-4 py-2 active:opacity-80"
              >
                <Text className="text-[13px] font-bold text-primary">{t("update")}</Text>
              </Pressable>
            </View>
          </LinearGradient>
        ) : null}

        {/* Preferences */}
        <SectionLabel label={t("preferences")} />
        <Card padded={false} className="overflow-hidden">
          <View className="flex-row items-center px-4 py-3">
            <IconChip icon="language-outline" tone="primary" size={38} />
            <Text className="ml-3 flex-1 text-[15px] text-ink">{t("language")}</Text>
            <SegmentToggle
              c={c}
              value={lang}
              options={[{ value: "bn", label: "বাংলা" }, { value: "en", label: "ENG" }]}
              onChange={(v) => setLang(v as "bn" | "en")}
            />
          </View>
          <Divider />
          <View className="flex-row items-center px-4 py-3">
            <IconChip icon="contrast-outline" tone="primary" size={38} />
            <Text className="ml-3 flex-1 text-[15px] text-ink">{t("theme")}</Text>
            <SegmentToggle
              c={c}
              value={mode}
              options={[{ value: "light", label: t("light") }, { value: "dark", label: t("dark") }]}
              onChange={(v) => setMode(v as "light" | "dark")}
            />
          </View>
        </Card>

        {/* Support & More */}
        <SectionLabel label={t("supportMore")} />
        <Card padded={false} className="overflow-hidden">
          <View className="flex-row items-center px-4 py-3.5">
            <IconChip icon="headset-outline" tone="primary" size={38} />
            <Text className="ml-3 flex-1 text-[15px] text-ink">{t("contactSupport")}</Text>
            <Pressable onPress={() => openUrl(`tel:${SUPPORT_PHONE}`)} hitSlop={8} className="mr-1 h-9 w-9 items-center justify-center rounded-full bg-primary-50 active:opacity-70">
              <Ionicons name="call-outline" size={18} color={c.primary} />
            </Pressable>
            <Pressable onPress={() => openUrl(`mailto:${SUPPORT_MAIL}`)} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full bg-primary-50 active:opacity-70">
              <Ionicons name="mail-outline" size={18} color={c.primary} />
            </Pressable>
          </View>
          <Divider />
          <LinkRow icon="document-text-outline" label={t("terms")} onPress={() => router.push("/terms" as Href)} />
          <Divider />
          <LinkRow icon="shield-checkmark-outline" label={t("privacy")} onPress={() => router.push("/privacy" as Href)} />
        </Card>

        {/* Log out */}
        <Pressable
          onPress={confirmLogout}
          style={[shadow.sm, { marginTop: 24, backgroundColor: c.surface, borderWidth: 1, borderColor: c.danger }]}
          className="mb-4 flex-row items-center justify-center rounded-2xl py-3.5 active:opacity-80"
        >
          <Ionicons name="log-out-outline" size={19} color={c.danger} />
          <Text style={{ color: c.danger }} className="ml-2 text-[15px] font-bold">{t("logOut")}</Text>
        </Pressable>

        <Text className="mt-1 text-center text-[12px] text-ink-faint">v1.0</Text>
      </ScrollView>
    </View>
  );
}

function Divider(): React.ReactElement {
  return <View className="ml-[66px] h-px bg-border" />;
}

/** One premium profile detail row: icon chip + label + value. */
function DetailRow({ icon, label, value, c }: { icon: IoniconName; label: string; value: string; c: ColorPalette }): React.ReactElement {
  return (
    <View className="flex-row items-center py-2.5">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
        <Ionicons name={icon} size={16} color={c.primary} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{label}</Text>
        <Text className="text-[14px] font-semibold text-ink" numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function SectionLabel({ label }: { label: string }): React.ReactElement {
  // Explicit inline margins (not utility classes) so the spacing is guaranteed
  // to render on the native build, not just on web.
  return <Text style={{ marginTop: 24, marginBottom: 10 }} className="ml-1 text-[12px] font-bold uppercase tracking-wide text-ink-faint">{label}</Text>;
}

/** Segmented pill toggle — the active option gets a filled primary pill. */
function SegmentToggle({
  options,
  value,
  onChange,
  c,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  c: ColorPalette;
}): React.ReactElement {
  return (
    <View className="flex-row rounded-full bg-primary-50 p-1" style={{ borderWidth: 1, borderColor: c.border }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            hitSlop={4}
            style={active ? { backgroundColor: c.primary } : undefined}
            className="rounded-full px-3 py-1 active:opacity-80"
          >
            <Text className="text-[12.5px] font-bold" style={{ color: active ? c.white : c.inkMuted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function LinkRow({ icon, label, onPress }: { icon: IoniconName; label: string; onPress: () => void }): React.ReactElement {
  return (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-3.5 active:opacity-60">
      <IconChip icon={icon} tone="primary" size={38} />
      <Text className="ml-3 flex-1 text-[15px] text-ink">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.color.inkFaint} />
    </Pressable>
  );
}
