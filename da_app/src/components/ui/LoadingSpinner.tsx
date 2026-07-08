import { ActivityIndicator, Text, View } from "react-native";

import { theme } from "@/theme";

export function LoadingSpinner({ label }: { label?: string }): React.ReactElement {
  return (
    <View className="flex-1 items-center justify-center bg-canvas py-12">
      <ActivityIndicator size="large" color={theme.color.primary} />
      {label ? <Text className="mt-3 text-sm text-ink-muted">{label}</Text> : null}
    </View>
  );
}
