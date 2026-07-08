import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAreas, signup } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";
import { Ionicons } from "@/components/Icon";
import { Button, Card, Input } from "@/components/ui";
import { useColors } from "@/theme";
import { useT } from "@/lib/i18n";
import { feedback } from "@/store/feedbackStore";
import type { Area } from "@/types/api";

const LOGO = require("../../assets/logo.png");

interface Form {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  shop_name: string;
  shop_address: string;
}

const EMPTY: Form = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
  shop_name: "",
  shop_address: "",
};

export default function SignupScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const t = useT();

  const [form, setForm] = useState<Form>(EMPTY);
  const [area, setArea] = useState<Area | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: areas = [] } = useQuery({ queryKey: ["areas"], queryFn: getAreas });

  function set<K extends keyof Form>(key: K, value: string): void {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(): Promise<void> {
    if (!form.full_name || !form.email || !form.phone || !form.password || !form.shop_name || !form.shop_address) {
      feedback.warning(t("missingFields"), t("missingFieldsMsg"));
      return;
    }
    if (!area) {
      feedback.warning(t("areaRequired"), t("areaRequiredMsg"));
      return;
    }
    if (form.password !== form.confirm_password) {
      feedback.warning(t("passwordsMismatch"), t("passwordsMismatchMsg"));
      return;
    }
    setSubmitting(true);
    try {
      await signup({ ...form, area_id: area.area_id });
      feedback.success(t("accountCreated"), t("accountCreatedMsg"), () => router.replace("/(auth)/login"));
    } catch (e) {
      feedback.error(t("signupFailed"), getApiErrorMessage(e, "Could not create the account."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image source={LOGO} style={{ width: 72, height: 72, alignSelf: "center" }} resizeMode="contain" />
        <Text className="mt-5 text-[26px] font-extrabold text-ink">{t("signUp")}</Text>
        <Text className="mt-1 text-[15px] text-ink-muted">{t("createAccount")}</Text>

        <Card className="mt-5 gap-4">
          <Input label={t("name")} icon="person-outline" placeholder={t("enterName")} value={form.full_name} onChangeText={(t) => set("full_name", t)} />
          <Input label={t("mail")} icon="mail-outline" placeholder={t("enterMail")} autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(t) => set("email", t)} />
          <Input label={t("phoneNumber")} icon="call-outline" placeholder={t("enterPhone")} keyboardType="phone-pad" value={form.phone} onChangeText={(t) => set("phone", t)} />
          <Input label={t("password")} icon="lock-closed-outline" placeholder={t("enterPassword")} password value={form.password} onChangeText={(t) => set("password", t)} />
          <Input label={t("confirmPassword")} icon="lock-closed-outline" placeholder={t("confirmYourPassword")} password value={form.confirm_password} onChangeText={(t) => set("confirm_password", t)} />
        </Card>

        <Text className="mb-3 mt-6 text-[20px] font-extrabold text-ink">{t("shopInformation")}</Text>
        <Card className="gap-4">
          <Input label={t("shopName")} icon="storefront-outline" placeholder={t("enterShopName")} value={form.shop_name} onChangeText={(t) => set("shop_name", t)} />
          <Input label={t("address")} icon="home-outline" placeholder={t("enterAddress")} value={form.shop_address} onChangeText={(t) => set("shop_address", t)} />

          <View>
            <Text className="mb-2 text-sm font-semibold text-ink-soft">Area</Text>
            <Pressable
              onPress={() => setPickerOpen(true)}
              className="h-14 flex-row items-center rounded-2xl border border-border bg-surface px-4 active:opacity-70"
            >
              <Ionicons name="location-outline" size={20} color={c.inkFaint} />
              <Text className={`ml-2 flex-1 text-[15px] ${area ? "text-ink" : "text-ink-faint"}`}>
                {area ? area.area_name : t("enterArea")}
              </Text>
              <Ionicons name="chevron-down" size={18} color={c.inkFaint} />
            </Pressable>
          </View>
        </Card>

        <View className="mt-8">
          <Button title={t("register")} loading={submitting} onPress={onSubmit} />
        </View>

        <View className="mt-4 flex-row justify-center">
          <Text className="text-[14px] text-ink-muted">{t("haveAccount")} </Text>
          <Pressable onPress={() => router.replace("/(auth)/login")} hitSlop={8}>
            <Text className="text-[14px] font-bold text-primary">{t("logIn")}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setPickerOpen(false)}>
          <Pressable className="max-h-[70%] rounded-t-3xl bg-surface px-5 pb-8 pt-3" onPress={() => undefined}>
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-border-strong" />
            <Text className="mb-3 text-lg font-bold text-ink">{t("selectArea")}</Text>
            <FlatList
              data={areas}
              keyExtractor={(a) => String(a.area_id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setArea(item);
                    setPickerOpen(false);
                  }}
                  className="flex-row items-center justify-between border-b border-border py-3.5 active:opacity-60"
                >
                  <Text className="text-[15px] text-ink">{item.area_name}</Text>
                  {area?.area_id === item.area_id ? (
                    <Ionicons name="checkmark-circle" size={20} color={c.primary} />
                  ) : null}
                </Pressable>
              )}
              ListEmptyComponent={<Text className="py-6 text-center text-ink-muted">No areas found.</Text>}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
