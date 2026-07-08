import { Ionicons } from "@/components/Icon";
import { Text, View } from "react-native";

import { theme } from "@/theme";
import { Button } from "./Button";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface EmptyStateProps {
  icon?: IoniconName;
  tone?: "neutral" | "danger";
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "file-tray-outline",
  tone = "neutral",
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps): React.ReactElement {
  const isDanger = tone === "danger";
  return (
    <View className="flex-1 items-center justify-center px-10 py-16">
      <View
        className={`h-20 w-20 items-center justify-center rounded-full ${isDanger ? "bg-danger-soft" : "bg-primary-50"}`}
      >
        <Ionicons name={icon} size={36} color={isDanger ? theme.color.danger : theme.color.primary} />
      </View>
      <Text className="mt-5 text-center text-lg font-bold text-ink">{title}</Text>
      {message ? <Text className="mt-1.5 text-center text-sm text-ink-muted">{message}</Text> : null}
      {actionLabel && onAction ? (
        <View className="mt-6 w-full max-w-[220px]">
          <Button title={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
