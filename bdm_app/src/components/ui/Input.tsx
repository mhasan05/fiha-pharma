import { Ionicons } from "@/components/Icon";
import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
  type TextInputProps,
} from "react-native";

import { useColors } from "@/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  icon?: IoniconName;
  /** Renders a show/hide toggle and masks input. */
  password?: boolean;
}

export function Input({
  label,
  error,
  hint,
  icon,
  password = false,
  onFocus,
  onBlur,
  ...rest
}: InputProps): React.ReactElement {
  const c = useColors();
  const [hidden, setHidden] = useState(password);
  const [focused, setFocused] = useState(false);

  function handleFocus(e: NativeSyntheticEvent<TextInputFocusEventData>): void {
    setFocused(true);
    onFocus?.(e);
  }
  function handleBlur(e: NativeSyntheticEvent<TextInputFocusEventData>): void {
    setFocused(false);
    onBlur?.(e);
  }

  const borderClass = error
    ? "border-danger"
    : focused
      ? "border-primary"
      : "border-border-strong";

  return (
    <View className="w-full">
      {label ? <Text className="mb-2 text-sm font-semibold text-ink-soft">{label}</Text> : null}
      <View
        className={[
          "h-14 flex-row items-center rounded-2xl border-[1.5px] bg-surface px-4",
          focused ? "bg-primary-50/40" : "",
          borderClass,
        ].join(" ")}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={19}
            color={focused ? c.primary : c.inkFaint}
            style={{ marginRight: 10 }}
          />
        ) : null}
        <TextInput
          className="h-full flex-1 py-0 text-base text-ink"
          placeholderTextColor={c.inkFaint}
          secureTextEntry={hidden}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {password ? (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={10} className="pl-2">
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={c.inkMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="mt-1.5 text-xs font-medium text-danger">{error}</Text>
      ) : hint ? (
        <Text className="mt-1.5 text-xs text-ink-faint">{hint}</Text>
      ) : null}
    </View>
  );
}
