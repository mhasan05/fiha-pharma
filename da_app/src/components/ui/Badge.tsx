import { Text, View } from "react-native";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral" | "primary" | "violet";

const styles: Record<BadgeTone, { bg: string; text: string; dot: string }> = {
  success: { bg: "bg-success-soft", text: "text-success", dot: "bg-success" },
  warning: { bg: "bg-warning-soft", text: "text-warning", dot: "bg-warning" },
  danger: { bg: "bg-danger-soft", text: "text-danger", dot: "bg-danger" },
  info: { bg: "bg-info-soft", text: "text-info", dot: "bg-info" },
  violet: { bg: "bg-violet-soft", text: "text-violet", dot: "bg-violet" },
  primary: { bg: "bg-primary-50", text: "text-ink", dot: "bg-primary" },
  neutral: { bg: "bg-primary-50", text: "text-ink-muted", dot: "bg-ink-faint" },
};

export function Badge({
  label,
  tone = "neutral",
  dot = false,
}: {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
}): React.ReactElement {
  const s = styles[tone];
  return (
    <View className={`flex-row items-center self-start rounded-full px-2.5 py-1 ${s.bg}`}>
      {dot ? <View className={`mr-1.5 h-1.5 w-1.5 rounded-full ${s.dot}`} /> : null}
      <Text className={`text-xs font-semibold ${s.text}`}>{label}</Text>
    </View>
  );
}

/** Maps backend status strings to a badge tone. */
export function statusTone(status: string): BadgeTone {
  switch (status) {
    case "delivered":
    case "approved":
    case "confirmed":
    case "Paid":
      return "success";
    case "pending":
    case "processing":
    case "shipped":
      return "violet"; // "Pending" (not yet delivered)
    case "Partial":
    case "due":
      return "warning";
    case "cancelled":
    case "rejected":
    case "Due":
      return "danger";
    default:
      return "neutral";
  }
}

/** Human label for a delivery status (e.g. shipped -> "Pending"). */
export function deliveryStatusLabel(status: string): string {
  switch (status) {
    case "shipped":
    case "processing":
    case "pending":
      return "Pending";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "due":
      return "Due";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
