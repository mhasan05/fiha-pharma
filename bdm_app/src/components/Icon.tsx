import ExpoIonicons from "@expo/vector-icons/Ionicons";
import rawCreateIconSet from "@expo/vector-icons/build/vendor/react-native-vector-icons/lib/create-icon-set";
import IoniconsGlyphMap from "@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json";
import { Platform } from "react-native";

/**
 * Cross-platform Ionicons that actually renders in native release builds.
 *
 * `@expo/vector-icons` gates every glyph behind expo-font's async
 * `Font.loadAsync` — until it resolves, each icon renders an empty `<Text/>`.
 * In standalone Android builds that runtime load can fail outright, leaving
 * EVERY icon blank (works on web, blank in the APK — the bug we hit).
 *
 * The icon font is embedded natively at build time (assets/fonts/Ionicons.ttf
 * via the expo-font config plugin in app.json). React Native's ReactFontManager
 * resolves `fontFamily: "Ionicons"` straight from that bundled file, so on native
 * we render glyphs with the raw vendored icon set — the *same* component
 * `@expo/vector-icons` renders once loaded, just without the async gate. Result:
 * icons are always visible, no font-load race, no empty boxes.
 *
 * On web there is no ReactFontManager; the stock component injects its own
 * `@font-face` and already works, so we keep it there.
 */
export const Ionicons =
  Platform.OS === "web"
    ? ExpoIonicons
    : (rawCreateIconSet(IoniconsGlyphMap, "Ionicons", "Ionicons.ttf") as unknown as typeof ExpoIonicons);
