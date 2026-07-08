import { Ionicons } from "@/components/Icon";
import { Pressable, Text, View } from "react-native";

import { shadow, theme } from "@/theme";
import { IconChip, type ChipTone } from "./IconChip";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

/** Metric tile: icon chip + chevron on top, big value, label below. */
export function StatTile({
  icon,
  tone = "primary",
  value,
  label,
  onPress,
}: {
  icon: IoniconName;
  tone?: ChipTone;
  value: string | number;
  label: string;
  onPress?: () => void;
}): React.ReactElement {
  const body = (
    <>
      <View className="flex-row items-start justify-between">
        <IconChip icon={icon} tone={tone} size={40} />
        {onPress ? <Ionicons name="chevron-forward" size={18} color={theme.color.inkFaint} /> : null}
      </View>
      <Text className="mt-4 text-[26px] font-extrabold text-ink">{value}</Text>
      <Text className="mt-0.5 text-[13px] font-medium text-ink-muted">{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={shadow.sm}
        className="flex-1 rounded-2xl border border-border bg-surface p-4 active:scale-[0.98]"
      >
        {body}
      </Pressable>
    );
  }
  return (
    <View style={shadow.sm} className="flex-1 rounded-2xl border border-border bg-surface p-4">
      {body}
    </View>
  );
}
