import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@/components/Icon";
import { Button, Card, Input } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { useColors } from "@/theme";
import { useAuthStore } from "@/store/authStore";

const LOGO = require("../../assets/logo.png");

export default function LoginScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useT();
  const c = useColors();
  const login = useAuthStore((s) => s.login);
  const signingIn = useAuthStore((s) => s.signingIn);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(): Promise<void> {
    setError(null);
    if (!phone.trim() || !password) {
      setError("Enter your phone and password.");
      return;
    }
    try {
      await login(phone.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image source={LOGO} style={{ width: 84, height: 84, alignSelf: "center" }} resizeMode="contain" />
        <Text className="mt-6 text-[26px] font-extrabold text-ink">{t("welcomeBack")}</Text>
        <Text className="mt-1 text-[15px] text-ink-muted">{t("pleaseLogIn")}</Text>

        <Card className="mt-6 gap-4">
          <Input
            label={t("emailOrPhone")}
            icon="mail-outline"
            placeholder={t("enterMailOrPhone")}
            autoCapitalize="none"
            keyboardType="default"
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              if (error) setError(null);
            }}
          />
          <Input
            label={t("password")}
            icon="lock-closed-outline"
            placeholder={t("enterPassword")}
            password
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) setError(null);
            }}
            error={error}
          />
        </Card>

        <Pressable
          onPress={() => setRemember((r) => !r)}
          className="mt-4 flex-row items-center justify-end gap-2"
          hitSlop={8}
        >
          <View
            className={`h-5 w-5 items-center justify-center rounded-md border ${
              remember ? "border-primary bg-primary" : "border-border-strong bg-surface"
            }`}
          >
            {remember ? <Ionicons name="checkmark" size={14} color={c.white} /> : null}
          </View>
          <Text className="text-[14px] text-ink-soft">{t("rememberMe")}</Text>
        </Pressable>

        <View className="mt-8">
          <Button title={t("logIn")} loading={signingIn} onPress={onSubmit} />
        </View>

        <View className="mt-4 flex-row justify-center">
          <Text className="text-[14px] text-ink-muted">{t("noAccount")} </Text>
          <Pressable onPress={() => router.replace("/(auth)/signup")} hitSlop={8}>
            <Text className="text-[14px] font-bold text-primary">{t("signUp")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
