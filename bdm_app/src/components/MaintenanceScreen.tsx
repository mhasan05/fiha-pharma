import { LinearGradient } from "expo-linear-gradient";
import { Image, Linking, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@/components/Icon";
import { shadow, useColors } from "@/theme";
import type { SiteInfo } from "@/types/api";

const LOGO = require("../../assets/logo.png");

/** Full-screen block shown when the admin enables maintenance mode
 *  (settings → site_info). Rendered before login, in place of the whole app. */
export function MaintenanceScreen({
  info,
  onRetry,
  retrying,
}: {
  info: SiteInfo | null;
  onRetry: () => void;
  retrying?: boolean;
}): React.ReactElement {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const message = info?.maintenance_message?.trim() || "We are currently under maintenance. Please check back soon.";
  const phone = info?.contact_phone?.trim();

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-1 items-center justify-center px-8">
        {/* Layered icon hero */}
        <View style={{ height: 128, width: 128, borderRadius: 64, backgroundColor: c.primary50, alignItems: "center", justifyContent: "center" }}>
          <LinearGradient
            colors={["#0F9D6E", "#0C8259"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[shadow.primary, { height: 92, width: 92, borderRadius: 46, alignItems: "center", justifyContent: "center" }]}
          >
            <Ionicons name="construct" size={42} color={c.white} />
          </LinearGradient>
        </View>

        <Text style={{ marginTop: 32, fontSize: 24, fontWeight: "800", color: c.ink }}>Under Maintenance</Text>
        <Text style={{ marginTop: 12, maxWidth: 320, textAlign: "center", fontSize: 14, lineHeight: 24, color: c.inkMuted }}>
          {message}
        </Text>

        {/* Try Again */}
        <Pressable onPress={onRetry} disabled={retrying} style={{ marginTop: 36, width: "100%", maxWidth: 320 }} className="active:opacity-90">
          <LinearGradient
            colors={["#0F9D6E", "#0C8259"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[shadow.primary, { borderRadius: 16, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
          >
            <Ionicons name="refresh" size={18} color={c.white} />
            <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: "700", color: c.white }}>{retrying ? "Checking…" : "Try Again"}</Text>
          </LinearGradient>
        </Pressable>

        {/* Support contact */}
        {phone ? (
          <Pressable
            onPress={() => void Linking.openURL(`tel:${phone}`).catch(() => undefined)}
            style={{ marginTop: 16, width: "100%", maxWidth: 320, borderWidth: 1, borderColor: c.border, borderRadius: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: c.surface }}
            className="active:opacity-80"
          >
            <Ionicons name="call-outline" size={16} color={c.primary} />
            <Text style={{ marginLeft: 8, fontSize: 13.5, fontWeight: "600", color: c.ink }}>Need help? {phone}</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Footer brand */}
      <View style={{ alignItems: "center", paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image source={LOGO} style={{ width: 18, height: 18 }} resizeMode="contain" />
        </View>
      </View>
    </View>
  );
}
