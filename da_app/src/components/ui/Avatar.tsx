import { Text, View } from "react-native";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

export function Avatar({
  name,
  size = 44,
  light = false,
}: {
  name: string;
  size?: number;
  /** Use a translucent style for placing on a colored header. */
  light?: boolean;
}): React.ReactElement {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`items-center justify-center ${light ? "bg-white/20" : "bg-primary-100"}`}
    >
      <Text
        style={{ fontSize: size * 0.38 }}
        className={`font-bold ${light ? "text-white" : "text-primary-700"}`}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
