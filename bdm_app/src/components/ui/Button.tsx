import { Ionicons } from "@/components/Icon";
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";

import { shadow, useColors } from "@/theme";

type Variant =
  | "primary"
  | "primaryOutline"
  | "secondary"
  | "ghost"
  | "danger"
  | "success"
  | "dangerOutline";
type Size = "md" | "lg";
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface ButtonProps extends Omit<PressableProps, "children"> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: IoniconName;
}

const container: Record<Variant, string> = {
  primary: "bg-primary",
  primaryOutline: "bg-transparent border border-primary",
  secondary: "bg-primary-50 border border-primary-100",
  ghost: "bg-transparent",
  danger: "bg-danger",
  success: "bg-success",
  dangerOutline: "bg-transparent border border-danger",
};

const label: Record<Variant, string> = {
  primary: "text-white",
  primaryOutline: "text-primary",
  secondary: "text-ink",
  ghost: "text-ink-soft",
  danger: "text-white",
  success: "text-white",
  dangerOutline: "text-danger",
};

export function Button({
  title,
  variant = "primary",
  size = "lg",
  loading = false,
  fullWidth = true,
  icon,
  disabled,
  ...rest
}: ButtonProps): React.ReactElement {
  const c = useColors();
  const iconColor: Record<Variant, string> = {
    primary: c.white,
    primaryOutline: c.primary,
    secondary: c.ink,
    ghost: c.inkSoft,
    danger: c.white,
    success: c.white,
    dangerOutline: c.danger,
  };
  const isDisabled = disabled || loading;
  const elevated = !isDisabled && (variant === "primary" || variant === "danger" || variant === "success");

  return (
    <Pressable
      disabled={isDisabled}
      style={elevated ? shadow.primary : undefined}
      className={[
        "flex-row items-center justify-center rounded-2xl",
        size === "lg" ? "h-14 px-6" : "h-11 px-5",
        container[variant],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-40" : "active:scale-[0.98] active:opacity-90",
      ].join(" ")}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={iconColor[variant]} />
      ) : (
        <View className="flex-row items-center">
          {icon ? <Ionicons name={icon} size={18} color={iconColor[variant]} style={{ marginRight: 8 }} /> : null}
          <Text className={`text-base font-semibold ${label[variant]}`}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}
