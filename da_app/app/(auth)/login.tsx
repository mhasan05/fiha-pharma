import { Ionicons } from "@/components/Icon";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Input } from "@/components/ui";
import { theme } from "@/theme";
import { useAuthStore } from "@/store/authStore";

const LOGO = require("../../assets/logo.png");

export default function LoginScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((s) => s.login);
  const signingIn = useAuthStore((s) => s.signingIn);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; password?: string }>({});

  function validate(): boolean {
    const next: { phone?: string; password?: string } = {};
    if (!phone.trim()) next.phone = "Phone number is required.";
    if (!password) next.password = "Password is required.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(): Promise<void> {
    setError(null);
    if (!validate()) return;
    try {
      await signIn(phone.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-canvas" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="px-6"
        style={{ paddingTop: insets.top + 16 }}
      >
        {/* Brand */}
        <View className="mb-9 items-center">
          <Image source={LOGO} style={{ width: 104, height: 104 }} resizeMode="contain" />
          <Text className="mt-4 text-[26px] font-extrabold text-ink">Delivery Assist</Text>
          <Text className="mt-1 text-[15px] text-ink-muted">Sign in to your delivery account</Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <Input
            label="Phone number"
            placeholder="01XXXXXXXXX"
            icon="call-outline"
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoComplete="tel"
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              if (fieldErrors.phone) setFieldErrors((f) => ({ ...f, phone: undefined }));
            }}
            error={fieldErrors.phone}
            editable={!signingIn}
          />
          <Input
            label="Password"
            placeholder="Your password"
            icon="lock-closed-outline"
            password
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
            error={fieldErrors.password}
            editable={!signingIn}
            onSubmitEditing={() => void onSubmit()}
            returnKeyType="go"
          />

          {error ? (
            <View className="flex-row items-center rounded-2xl bg-danger-soft px-4 py-3">
              <Ionicons name="alert-circle" size={18} color={theme.color.danger} />
              <Text className="ml-2 flex-1 text-[13px] font-medium text-danger">{error}</Text>
            </View>
          ) : null}

          <View className="mt-1">
            <Button title="Sign in" icon="log-in-outline" loading={signingIn} onPress={() => void onSubmit()} />
          </View>
        </View>

        <Text className="mt-8 text-center text-xs text-ink-faint">
          Delivery agents only. Accounts are provisioned by the Fiha Pharma admin.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
