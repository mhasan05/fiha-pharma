import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, Image, Text, View } from "react-native";

const LOGO = require("../../assets/logo.png");

/**
 * Branded boot screen shown while the app hydrates (fonts + first data).
 * Professional look: a soft brand-tinted gradient backdrop, a gradient-ring
 * logo badge with depth, a clean wordmark + divider, and a sleek indeterminate
 * progress bar. Uses only hardcoded colors + a local asset so it renders even
 * before providers mount. The top of the gradient is pure white so it blends
 * seamlessly with the native (pre-JS) splash — no launch flash.
 */
export function SplashScreen(): React.ReactElement {
  const enter = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.timing(bar, {
        toValue: 1,
        duration: 1150,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [enter, bar]);

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });

  // Indeterminate bar: a short segment sliding across a fixed-width track.
  const TRACK = 148;
  const SEG = 56;
  const translateX = bar.interpolate({ inputRange: [0, 1], outputRange: [-SEG, TRACK] });

  return (
    <LinearGradient
      colors={["#FFFFFF", "#F6EFFE"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}
    >
      <Animated.View style={{ alignItems: "center", opacity: enter, transform: [{ translateY }, { scale }] }}>
        {/* Gradient-ring logo badge */}
        <LinearGradient
          colors={["#0F9D6E", "#0C8259"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 140,
            width: 140,
            borderRadius: 70,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#0C8259",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.28,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          <View
            style={{
              height: 128,
              width: 128,
              borderRadius: 64,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image source={LOGO} style={{ height: 104, width: 104 }} resizeMode="contain" />
          </View>
        </LinearGradient>

        <Text style={{ marginTop: 26, fontSize: 34, fontWeight: "800", letterSpacing: 4, color: "#1A1030" }}>Fiha Pharma</Text>
        <View style={{ marginTop: 8, height: 3, width: 34, borderRadius: 2, backgroundColor: "#0F9D6E" }} />
        <Text style={{ marginTop: 12, fontSize: 13, fontWeight: "600", letterSpacing: 0.3, color: "#4A4560" }}>
          Trusted Healthcare
        </Text>
      </Animated.View>

      {/* Indeterminate progress bar */}
      <View
        style={{
          position: "absolute",
          bottom: 74,
          height: 4,
          width: TRACK,
          borderRadius: 2,
          backgroundColor: "rgba(15,157,110,0.14)",
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: 4,
            width: SEG,
            borderRadius: 2,
            backgroundColor: "#0F9D6E",
            transform: [{ translateX }],
          }}
        />
      </View>
    </LinearGradient>
  );
}
