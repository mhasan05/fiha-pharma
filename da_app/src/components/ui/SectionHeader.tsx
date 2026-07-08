import { Pressable, Text, View } from "react-native";

/** "Section title  ...  Action" row used above lists/groups. */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}): React.ReactElement {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Text className="text-base font-bold text-ink">{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-sm font-semibold text-primary">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
