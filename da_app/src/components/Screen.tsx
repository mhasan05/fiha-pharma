import { Ionicons } from "@/components/Icon";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/theme";

interface BackHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

/** Light header with a circular back button for pushed (stack) screens. */
export function BackHeader({ title, subtitle, right }: BackHeaderProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View className="bg-canvas px-4 pb-3" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface active:opacity-70"
        >
          <Ionicons name="chevron-back" size={20} color={theme.color.ink} />
        </Pressable>
        <View className="ml-3 flex-1">
          <Text className="text-lg font-bold text-ink" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-[13px] text-ink-muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View className="ml-3">{right}</View> : null}
      </View>
    </View>
  );
}
