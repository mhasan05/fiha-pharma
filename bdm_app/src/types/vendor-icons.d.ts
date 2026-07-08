// The vendored react-native-vector-icons `create-icon-set` ships no types.
// We use it directly to build an icon component that renders without
// @expo/vector-icons' async font gate (see src/components/Icon.tsx).
declare module "@expo/vector-icons/build/vendor/react-native-vector-icons/lib/create-icon-set" {
  import type { ComponentType } from "react";
  import type { TextProps } from "react-native";

  export interface RawIconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  const createIconSet: (
    glyphMap: Record<string, number>,
    fontFamily: string,
    fontFile?: string
  ) => ComponentType<RawIconProps>;

  export default createIconSet;
}
