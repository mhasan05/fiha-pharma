import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import { ActivityIndicator, Animated, PanResponder, StyleSheet, View } from "react-native";

import { Ionicons } from "@/components/Icon";
import { shadow, theme } from "@/theme";

const THUMB = 52;
const PAD = 5;
const HEIGHT = THUMB + PAD * 2;
const TRACK = ["#0F9D6E", "#0C8259"] as const;

/**
 * Slide-to-confirm control: drag the thumb to the right edge to trigger
 * `onConfirm` (prevents accidental taps on a committing action).
 * Built on core Animated + PanResponder — no reanimated/gesture-handler.
 * Uses inline styles (NativeWind classes don't apply to Animated components).
 *
 * Remount it (via a `key`) to reset the thumb to the start.
 */
export function SlideToConfirm({
  label,
  confirmingLabel = "Confirming…",
  submitting = false,
  onConfirm,
}: {
  label: string;
  confirmingLabel?: string;
  submitting?: boolean;
  onConfirm: () => void;
}): React.ReactElement {
  const [trackW, setTrackW] = useState(0);
  const maxX = Math.max(0, trackW - THUMB - PAD * 2);

  const x = useRef(new Animated.Value(0)).current;
  // Refs so the (once-created) PanResponder always reads fresh values.
  const maxXRef = useRef(maxX);
  maxXRef.current = maxX;
  const submittingRef = useRef(submitting);
  submittingRef.current = submitting;
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;
  const firedRef = useRef(false);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !submittingRef.current && !firedRef.current,
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 3 && !submittingRef.current && !firedRef.current,
      onPanResponderMove: (_e, g) => {
        const m = maxXRef.current;
        x.setValue(Math.min(Math.max(0, g.dx), m));
      },
      onPanResponderRelease: (_e, g) => {
        const m = maxXRef.current;
        const nx = Math.min(Math.max(0, g.dx), m);
        if (m > 0 && nx >= m * 0.9) {
          Animated.timing(x, { toValue: m, duration: 110, useNativeDriver: false }).start(() => {
            if (!firedRef.current) {
              firedRef.current = true;
              onConfirmRef.current();
            }
          });
        } else {
          Animated.spring(x, { toValue: 0, useNativeDriver: false, bounciness: 8, speed: 14 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
      },
    })
  ).current;

  const labelOpacity = x.interpolate({
    inputRange: [0, Math.max(1, maxX * 0.55)],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      style={[shadow.primary, { height: HEIGHT, borderRadius: HEIGHT / 2, overflow: "hidden" }]}
    >
      <LinearGradient
        colors={TRACK}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Centered label */}
      <View style={styles.center} pointerEvents="none">
        <Animated.Text
          style={{
            color: theme.color.white,
            fontSize: 15,
            fontWeight: "800",
            letterSpacing: 0.2,
            paddingLeft: THUMB / 2,
            opacity: submitting ? 1 : labelOpacity,
          }}
        >
          {submitting ? confirmingLabel : label}
        </Animated.Text>
      </View>

      {/* Direction hint on the right (fades as you slide) */}
      {!submitting ? (
        <Animated.View style={[styles.hint, { opacity: labelOpacity }]} pointerEvents="none">
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.55)" />
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" style={{ marginLeft: -9 }} />
        </Animated.View>
      ) : null}

      {/* Thumb / spinner */}
      {submitting ? (
        <View style={[styles.thumb, { right: PAD, top: PAD }]}>
          <ActivityIndicator color={theme.color.primary} />
        </View>
      ) : (
        <Animated.View
          {...responder.panHandlers}
          style={[styles.thumb, shadow.sm, { left: PAD, top: PAD, transform: [{ translateX: x }] }]}
        >
          <Ionicons name="chevron-forward" size={26} color={theme.color.primary} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    position: "absolute",
    right: 18,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
