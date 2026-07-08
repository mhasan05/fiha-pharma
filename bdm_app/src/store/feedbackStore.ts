import { create } from "zustand";

export type FeedbackType = "success" | "error" | "info" | "warning" | "confirm";

export interface FeedbackAction {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger";
}

interface FeedbackConfig {
  type: FeedbackType;
  title: string;
  message?: string;
  actions?: FeedbackAction[];
}

interface FeedbackState extends FeedbackConfig {
  visible: boolean;
  actions: FeedbackAction[];
  show: (cfg: FeedbackConfig) => void;
  hide: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  visible: false,
  type: "info",
  title: "",
  message: undefined,
  actions: [],
  show: (cfg) =>
    set({
      visible: true,
      type: cfg.type,
      title: cfg.title,
      message: cfg.message,
      actions: cfg.actions?.length ? cfg.actions : [{ label: "OK", variant: "primary" }],
    }),
  hide: () => set({ visible: false }),
}));

// -------------------------------------------------------------------------
// Ergonomic helpers — call from anywhere (event handlers, mutations):
//   feedback.success("Order placed", "We've received your order.")
//   feedback.error("Could not place order", msg)
//   feedback.confirm({ title, message, confirmLabel, destructive, onConfirm })
// -------------------------------------------------------------------------
const showFn = (): FeedbackState["show"] => useFeedbackStore.getState().show;

export const feedback = {
  success(title: string, message?: string, onClose?: () => void): void {
    showFn()({ type: "success", title, message, actions: [{ label: "OK", variant: "primary", onPress: onClose }] });
  },
  error(title: string, message?: string): void {
    showFn()({ type: "error", title, message });
  },
  info(title: string, message?: string): void {
    showFn()({ type: "info", title, message });
  },
  warning(title: string, message?: string): void {
    showFn()({ type: "warning", title, message });
  },
  confirm(opts: {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
  }): void {
    showFn()({
      type: opts.destructive ? "warning" : "confirm",
      title: opts.title,
      message: opts.message,
      actions: [
        { label: opts.cancelLabel ?? "Cancel", variant: "secondary" },
        { label: opts.confirmLabel ?? "Confirm", variant: opts.destructive ? "danger" : "primary", onPress: opts.onConfirm },
      ],
    });
  },
};
