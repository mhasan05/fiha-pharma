import { Ionicons } from "@/components/Icon";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { changePassword, uploadProfileImage } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";
import { getLatestAppUpdate } from "@/api/settings";
import { Button, IconChip, Input, type ChipTone } from "@/components/ui";
import { FadeInScreen } from "@/components/ui";
import { mediaUrl } from "@/lib/env";
import { useAuthStore } from "@/store/authStore";
import { theme } from "@/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

export default function ProfileScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  // `picked` shows the chosen image immediately (optimistic) while it uploads.
  const [picked, setPicked] = useState<string | null>(null);
  const avatarUri = picked ?? mediaUrl(user?.image);
  const [pwOpen, setPwOpen] = useState(false);

  const update = useQuery({ queryKey: ["app-update"], queryFn: getLatestAppUpdate });
  const rel = update.data?.update_available ? update.data.data : null;
  const sizeMb = rel && rel.file_size ? `${(rel.file_size / 1048576).toFixed(1)} MB` : "";
  const openUrl = (url: string): void => void Linking.openURL(url).catch(() => undefined);

  // --- Profile image upload -------------------------------------------------
  const uploadImage = useMutation({
    mutationFn: (uri: string) => uploadProfileImage(uri),
    onSuccess: (updated) => {
      if (user) setUser({ ...user, ...updated });
      setPicked(null); // server URL now reflects the new image
      Alert.alert("Updated", "Profile picture updated.");
    },
    onError: (e) => {
      setPicked(null); // revert optimistic preview
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Please try again.");
    },
  });

  async function pickImage(): Promise<void> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to change your picture.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) {
      setPicked(res.assets[0].uri); // show immediately
      uploadImage.mutate(res.assets[0].uri);
    }
  }

  async function doLogout(): Promise<void> {
    await logout();
    router.replace("/(auth)/login");
  }

  function confirmLogout(): void {
    if (Platform.OS === "web") {
      const ok = typeof window === "undefined" || window.confirm("Are you sure you want to log out?");
      if (ok) void doLogout();
      return;
    }
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void doLogout() },
    ]);
  }

  return (
    <FadeInScreen>
      <View className="px-5 pb-1" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[28px] font-extrabold text-ink">Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        {/* Identity — logo left, info right */}
        <LinearGradient
          colors={["#0F9D6E", "#0C8259"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 22, padding: 16, marginBottom: 18 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Left — avatar with camera badge */}
            <Pressable onPress={pickImage} disabled={uploadImage.isPending} style={{ width: 76, height: 76 }}>
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  backgroundColor: "#FFFFFF",
                  padding: 3,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: 70, height: 70, borderRadius: 35 }} />
                ) : (
                  <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 26, fontWeight: "800", color: "#0C8259" }}>{initials(user?.full_name ?? "Agent")}</Text>
                  </View>
                )}
              </View>
              {/* Camera badge */}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  height: 28,
                  width: 28,
                  borderRadius: 14,
                  backgroundColor: "#0C8259",
                  borderWidth: 2.5,
                  borderColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="camera" size={13} color="#FFFFFF" />
              </View>
              {/* Uploading overlay */}
              {uploadImage.isPending ? (
                <View style={{ position: "absolute", top: 3, left: 3, width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>

            {/* Right — name, email, badges */}
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 19, fontWeight: "800" }} numberOfLines={1}>{user?.full_name}</Text>
              {user?.email ? (
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 }} numberOfLines={1}>{user.email}</Text>
              ) : null}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>Delivery Agent</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <View style={{ height: 7, width: 7, borderRadius: 4, backgroundColor: user?.is_active ? "#4ADE80" : "#F87171", marginRight: 6 }} />
                  <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>{user?.is_active ? "Active" : "Inactive"}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Update available */}
        {rel ? (
          <LinearGradient
            colors={["#0C8259", "#0A6B4A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 16, marginBottom: 24 }}
          >
            <View className="flex-row items-center">
              <View style={{ height: 44, width: 44, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="phone-portrait-outline" size={20} color="#FFFFFF" />
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>Update Available</Text>
                  <View style={{ marginLeft: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>v{rel.updated_version}</Text>
                  </View>
                </View>
                {rel.release_notes ? <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }} numberOfLines={2}>{rel.release_notes}</Text> : null}
                {sizeMb ? <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{sizeMb}</Text> : null}
              </View>
              <Pressable
                onPress={() => rel.apk_url && openUrl(rel.apk_url)}
                style={{ backgroundColor: "#FFFFFF", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 }}
                className="active:opacity-80"
              >
                <Text style={{ color: "#0F9D6E", fontSize: 13, fontWeight: "700" }}>Update</Text>
              </Pressable>
            </View>
          </LinearGradient>
        ) : null}

        {/* Account */}
        <SectionLabel>Account</SectionLabel>
        <View style={cardStyle} className="mb-6">
          <InfoRow icon="call-outline" tone="primary" label="Phone" value={user?.phone ?? "—"} />
          <Divider />
          {user?.email ? (
            <>
              <InfoRow icon="mail-outline" tone="info" label="Email" value={user.email} />
              <Divider />
            </>
          ) : null}
          <InfoRow icon="location-outline" tone="warning" label="Area" value={user?.area_name ?? "—"} />
        </View>

        {/* Reports */}
        <SectionLabel>Reports</SectionLabel>
        <View style={cardStyle} className="mb-6">
          <Pressable onPress={() => router.push("/summary")} className="flex-row items-center px-4 py-3.5 active:opacity-70">
            <IconChip icon="document-text-outline" tone="primary" size={38} />
            <View className="ml-3 flex-1">
              <Text className="text-[15px] font-semibold text-ink">Delivery Summary</Text>
              <Text className="text-[12px] text-ink-faint">Your total top sheet — orders, sales & collection</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.color.inkFaint} />
          </Pressable>
        </View>

        {/* Security */}
        <SectionLabel>Security</SectionLabel>
        <View style={cardStyle} className="mb-6">
          <Pressable onPress={() => setPwOpen(true)} className="flex-row items-center px-4 py-3.5 active:opacity-70">
            <IconChip icon="lock-closed-outline" tone="danger" size={38} />
            <View className="ml-3 flex-1">
              <Text className="text-[15px] font-semibold text-ink">Change Password</Text>
              <Text className="text-[12px] text-ink-faint">Update your account password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.color.inkFaint} />
          </Pressable>
        </View>

        <Button title="Logout" variant="dangerOutline" icon="log-out-outline" onPress={confirmLogout} />
      </ScrollView>

      <ChangePasswordModal visible={pwOpen} onClose={() => setPwOpen(false)} />
    </FadeInScreen>
  );
}

const cardStyle = {
  backgroundColor: theme.color.surface,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: theme.color.border,
  overflow: "hidden" as const,
};

function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }): React.ReactElement {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset(): void {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => {
      reset();
      onClose();
      Alert.alert("Password changed", "Your password has been updated.");
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  function submit(): void {
    if (!current || !next || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (next.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (next === current) {
      setError("New password must be different from the current one.");
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
          <Pressable className="rounded-t-3xl bg-surface px-5 pb-8 pt-3" onPress={() => undefined}>
            <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-border-strong" />
            <Text className="text-xl font-bold text-ink">Change Password</Text>
            <Text className="mt-0.5 text-sm text-ink-muted">Enter your current password to set a new one.</Text>

            <View className="mt-5 gap-3.5">
              <Input
                label="Current password"
                icon="lock-closed-outline"
                password
                placeholder="Current password"
                value={current}
                onChangeText={(t) => {
                  setCurrent(t);
                  if (error) setError(null);
                }}
              />
              <Input
                label="New password"
                icon="key-outline"
                password
                placeholder="At least 6 characters"
                value={next}
                onChangeText={(t) => {
                  setNext(t);
                  if (error) setError(null);
                }}
              />
              <Input
                label="Confirm new password"
                icon="key-outline"
                password
                placeholder="Re-enter new password"
                value={confirm}
                onChangeText={(t) => {
                  setConfirm(t);
                  if (error) setError(null);
                }}
                error={error}
              />
            </View>

            <View className="mt-6 flex-row gap-3">
              <View className="flex-1">
                <Button title="Cancel" variant="secondary" onPress={onClose} disabled={mutation.isPending} />
              </View>
              <View className="flex-1">
                <Button title="Update" loading={mutation.isPending} onPress={submit} />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SectionLabel({ children }: { children: string }): React.ReactElement {
  return (
    <Text className="mb-2 ml-1 text-[12px] font-bold uppercase tracking-wide text-ink-faint">{children}</Text>
  );
}

function Divider(): React.ReactElement {
  return <View className="ml-[66px] h-px bg-border" />;
}

function InfoRow({
  icon,
  tone,
  label,
  value,
}: {
  icon: IoniconName;
  tone: ChipTone;
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <View className="flex-row items-center px-4 py-3.5">
      <IconChip icon={icon} tone={tone} size={38} />
      <Text className="ml-3 flex-1 text-[15px] text-ink-muted">{label}</Text>
      <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
