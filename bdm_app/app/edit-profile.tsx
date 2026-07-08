import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { updateProfile, uploadProfileImage } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";
import { Ionicons } from "@/components/Icon";
import { Img } from "@/components/Img";
import { MenuBar } from "@/components/MenuBar";
import { Avatar, Button, Card, Input } from "@/components/ui";
import { mediaUrl } from "@/lib/env";
import { useColors } from "@/theme";
import { useT } from "@/lib/i18n";
import { feedback } from "@/store/feedbackStore";
import { useAuthStore } from "@/store/authStore";

export default function EditProfileScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.full_name ?? "");
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const currentUri = picked ?? mediaUrl(user?.image);

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    user?.latitude != null && user?.longitude != null
      ? { latitude: user.latitude, longitude: user.longitude }
      : null,
  );
  const [locating, setLocating] = useState(false);

  // Capture the shop's GPS location and save it immediately, so delivery agents
  // can navigate to the exact pin.
  async function captureLocation(): Promise<void> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      feedback.warning(t("permissionNeeded"), "Allow location access to set your shop location.");
      return;
    }
    setLocating(true);
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const latitude = Number(pos.coords.latitude.toFixed(6));
      const longitude = Number(pos.coords.longitude.toFixed(6));
      const updated = await updateProfile({ latitude, longitude });
      setUser({ ...(user ?? updated), ...updated, latitude, longitude });
      setCoords({ latitude, longitude });
      feedback.success("Location saved", "Your shop location has been set.");
    } catch (e) {
      feedback.error("Couldn't get location", getApiErrorMessage(e));
    } finally {
      setLocating(false);
    }
  }

  async function pickImage(): Promise<void> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      feedback.warning(t("permissionNeeded"), t("photoPermissionMsg"));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) setPicked(res.assets[0].uri);
  }

  async function onSave(): Promise<void> {
    if (!name.trim()) {
      feedback.warning(t("nameRequired"), t("nameRequiredMsg"));
      return;
    }
    setSaving(true);
    try {
      let updated;
      if (picked) {
        updated = await uploadProfileImage(picked, { full_name: name.trim() });
      } else {
        updated = await updateProfile({ full_name: name.trim() });
      }
      setUser({ ...(user ?? updated), ...updated, full_name: name.trim() });
      feedback.success(t("profileSaved"), t("profileSavedMsg"), () => router.back());
    } catch (e) {
      feedback.error(t("updateFailed"), getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-canvas">
      <View className="flex-row items-center border-b border-border bg-surface px-4 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2 h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t("editProfile")}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Card className="mb-6 items-center py-6">
          <Pressable onPress={pickImage} className="active:opacity-80">
            {currentUri ? (
              <Img source={{ uri: currentUri }} style={{ height: 96, width: 96, borderRadius: 48, backgroundColor: c.primary50 }} contentFit="cover" />
            ) : (
              <Avatar name={user?.full_name ?? "Shop"} size={96} />
            )}
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-primary">
              <Ionicons name="camera" size={16} color={c.white} />
            </View>
          </Pressable>
          <Text className="mt-2 text-[12px] text-ink-muted">{t("changePhoto")}</Text>

          <View className="mt-4 w-full">
            <Input label={t("name")} icon="person-outline" placeholder={t("enterName")} value={name} onChangeText={setName} />
          </View>
        </Card>

        {/* Shop Location */}
        <Card className="mb-6">
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={18} color={c.primary} />
            <Text className="ml-2 text-[15px] font-bold text-ink">Shop Location</Text>
          </View>
          <Text className="mt-1 text-[12.5px] leading-5 text-ink-muted">
            Set your shop&apos;s exact location so delivery agents can navigate straight to you.
          </Text>

          <View className="mt-3 flex-row items-center rounded-xl bg-primary-50 px-3 py-2.5">
            <Ionicons name={coords ? "checkmark-circle" : "alert-circle-outline"} size={16} color={coords ? c.success : c.inkFaint} />
            <Text className="ml-2 flex-1 text-[12.5px] text-ink-soft" numberOfLines={1}>
              {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : "No location set yet"}
            </Text>
          </View>

          <View className="mt-3">
            <Button
              title={coords ? "Update location" : "Use current location"}
              variant="secondary"
              icon="navigate-outline"
              loading={locating}
              onPress={captureLocation}
            />
          </View>
        </Card>

        <Button title={t("saveNow")} loading={saving} onPress={onSave} />
      </ScrollView>
      <MenuBar active="profile" />
    </KeyboardAvoidingView>
  );
}
