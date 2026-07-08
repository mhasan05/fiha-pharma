import { Modal, Pressable, Text, View } from "react-native";

import { Ionicons } from "@/components/Icon";
import { shadow, useColors, type ColorPalette } from "@/theme";
import { useFeedbackStore, type FeedbackAction, type FeedbackType } from "@/store/feedbackStore";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function visuals(type: FeedbackType, c: ColorPalette): { icon: IoniconName; accent: string; soft: string } {
  switch (type) {
    case "success":
      return { icon: "checkmark-circle", accent: c.success, soft: c.successSoft };
    case "error":
      return { icon: "close-circle", accent: c.danger, soft: c.dangerSoft };
    case "warning":
      return { icon: "warning", accent: c.warning, soft: c.warningSoft };
    case "confirm":
      return { icon: "help-circle", accent: c.primary, soft: c.primary50 };
    default:
      return { icon: "information-circle", accent: c.info, soft: c.infoSoft };
  }
}

/** App-wide feedback modal (success / error / info / warning / confirm).
 *  Rendered once at the root; driven by the feedback store. Trigger via the
 *  `feedback.*` helpers, never Alert.alert. */
export function FeedbackModal(): React.ReactElement {
  const c = useColors();
  const { visible, type, title, message, actions, hide } = useFeedbackStore();
  const { icon, accent, soft } = visuals(type, c);
  const multi = actions.length > 1;

  function press(a: FeedbackAction): void {
    hide();
    a.onPress?.();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={hide}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, backgroundColor: "rgba(15,23,42,0.55)" }}>
        {/* All sizing/spacing is inline so the card renders correctly on the
            native build (utility classes for padding/size can silently no-op). */}
        <View
          style={[
            shadow.md,
            {
              width: "100%",
              maxWidth: 360,
              borderRadius: 24,
              backgroundColor: c.surface,
              paddingHorizontal: 24,
              paddingTop: 28,
              paddingBottom: 24,
              alignItems: "center",
            },
          ]}
        >
          {/* Icon — soft halo + solid accent circle */}
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: soft, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: accent, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={icon} size={30} color={c.white} />
            </View>
          </View>

          {/* Text */}
          <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "800", color: c.ink, textAlign: "center" }}>{title}</Text>
          {message ? (
            <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 20, color: c.inkMuted, textAlign: "center" }}>{message}</Text>
          ) : null}

          {/* Actions */}
          <View style={{ marginTop: 24, width: "100%", flexDirection: multi ? "row" : "column", gap: 12 }}>
            {actions.map((a, i) => {
              const isPrimary = a.variant === "primary" || a.variant === undefined;
              const isDanger = a.variant === "danger";
              const solid = isPrimary || isDanger;
              const bg = isDanger ? c.danger : isPrimary ? c.primary : c.primary50;
              const fg = solid ? c.white : c.ink;
              return (
                <Pressable
                  key={i}
                  onPress={() => press(a)}
                  className="active:opacity-90"
                  style={[
                    solid ? shadow.sm : undefined,
                    {
                      flex: multi ? 1 : undefined,
                      width: multi ? undefined : "100%",
                      backgroundColor: bg,
                      borderRadius: 16,
                      paddingVertical: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: solid ? 0 : 1,
                      borderColor: solid ? "transparent" : c.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: fg }}>{a.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
