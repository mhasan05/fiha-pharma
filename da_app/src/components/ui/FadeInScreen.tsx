import { useEffect, useRef } from "react";
import { Animated } from "react-native";

import { theme } from "@/theme";

/** Screen root with a subtle fade + rise on mount — a light, modern entrance.
 *  Use in place of the top-level `<View className="flex-1 bg-canvas">`. */
export function FadeInScreen({ children }: { children: React.ReactNode }): React.ReactElement {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={{ flex: 1, backgroundColor: theme.color.canvas, opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
