import { Pressable, View, type ViewProps } from "react-native";

import { shadow } from "@/theme";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  /** Remove the soft shadow (e.g. nested cards or flat sections). */
  flat?: boolean;
  /** Makes the whole card tappable with a press animation. */
  onPress?: () => void;
  padded?: boolean;
}

export function Card({
  children,
  className,
  flat = false,
  onPress,
  padded = true,
  style,
  ...rest
}: CardProps): React.ReactElement {
  const classes = [
    "rounded-2xl bg-surface border border-border",
    padded ? "p-4" : "",
    className ?? "",
  ].join(" ");

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[flat ? undefined : shadow.sm, style]}
        className={`${classes} active:scale-[0.99] active:opacity-95`}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={classes} style={[flat ? undefined : shadow.sm, style]} {...rest}>
      {children}
    </View>
  );
}
