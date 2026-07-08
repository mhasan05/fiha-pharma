import { useEffect, useRef } from "react";
import { Animated, View, type DimensionValue } from "react-native";

/** A single shimmering placeholder block. */
export function Skeleton({
  width = "100%",
  height = 16,
  radius = 8,
  className,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  className?: string;
}): React.ReactElement {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ width, height, borderRadius: radius, opacity }}
      className={`bg-border-strong ${className ?? ""}`}
    />
  );
}

/** A card-shaped skeleton placeholder for list items. */
export function SkeletonCard(): React.ReactElement {
  return (
    <View className="mb-3 rounded-2xl border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Skeleton width={140} height={16} />
        <Skeleton width={60} height={22} radius={11} />
      </View>
      <Skeleton width={180} height={12} className="mt-3" />
      <View className="mt-4 flex-row justify-between">
        <Skeleton width={70} height={20} />
        <Skeleton width={70} height={20} />
      </View>
    </View>
  );
}
