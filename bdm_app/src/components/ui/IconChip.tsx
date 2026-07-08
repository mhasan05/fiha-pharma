import { Ionicons } from "@/components/Icon";
import { View } from "react-native";

import { theme } from "@/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];
export type ChipTone = "primary" | "success" | "warning" | "danger" | "info" | "violet" | "neutral";

const bg: Record<ChipTone, string> = {
  primary: "bg-primary-50",
  success: "bg-success-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
  info: "bg-info-soft",
  violet: "bg-violet-soft",
  neutral: "bg-primary-50",
};

const fg: Record<ChipTone, string> = {
  primary: theme.color.primary,
  success: theme.color.success,
  warning: theme.color.warning,
  danger: theme.color.danger,
  info: theme.color.info,
  violet: theme.color.violet,
  neutral: theme.color.inkMuted,
};

/** A rounded tinted square holding an icon — the core fintech accent element. */
export function IconChip({
  icon,
  tone = "primary",
  size = 40,
}: {
  icon: IoniconName;
  tone?: ChipTone;
  size?: number;
}): React.ReactElement {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size * 0.32 }}
      className={`items-center justify-center ${bg[tone]}`}
    >
      <Ionicons name={icon} size={size * 0.5} color={fg[tone]} />
    </View>
  );
}
