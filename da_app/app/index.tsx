import { Redirect } from "expo-router";

import { LoadingSpinner } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";

/** Entry gate: wait for session hydration, then route by auth state. */
export default function Index(): React.ReactElement {
  const hydrating = useAuthStore((s) => s.hydrating);
  const token = useAuthStore((s) => s.token);

  if (hydrating) {
    return <LoadingSpinner label="Loading…" />;
  }
  return token ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />;
}
