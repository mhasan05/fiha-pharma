import { Redirect } from "expo-router";
import { View } from "react-native";

import { LoadingSpinner } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";

/** Entry gate: wait for hydration, then route to the app or the welcome screen. */
export default function Index(): React.ReactElement {
  const hydrating = useAuthStore((s) => s.hydrating);
  const token = useAuthStore((s) => s.token);

  if (hydrating) {
    return (
      <View className="flex-1 bg-surface">
        <LoadingSpinner label="Loading…" />
      </View>
    );
  }
  return <Redirect href={token ? "/(tabs)" : "/(auth)/welcome"} />;
}
