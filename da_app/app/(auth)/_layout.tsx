import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "@/store/authStore";

/** Auth stack — if already signed in, bounce to the app. */
export default function AuthLayout(): React.ReactElement {
  const token = useAuthStore((s) => s.token);
  if (token) {
    return <Redirect href="/(tabs)" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
