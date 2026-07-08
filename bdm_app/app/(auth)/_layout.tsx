import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "@/store/authStore";

export default function AuthLayout(): React.ReactElement {
  const token = useAuthStore((s) => s.token);
  // Already signed in → send to the app.
  if (token) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F4F5F7" } }} />;
}
