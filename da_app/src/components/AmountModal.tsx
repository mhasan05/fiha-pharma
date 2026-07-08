import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from "react-native";

import { Button, Input, SlideToConfirm } from "@/components/ui";

interface AmountModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  /** Prefill the amount field (e.g. the due amount). */
  defaultAmount?: number;
  /** Reject amounts above this (e.g. the due amount) — can't collect more than owed. */
  maxAmount?: number;
  /** Allow submitting with no amount (e.g. deliver without collecting). */
  optional?: boolean;
  confirmLabel?: string;
  submitting?: boolean;
  /** Replace the tap button with a slide-to-confirm control. */
  slideToConfirm?: boolean;
  onCancel: () => void;
  onConfirm: (amount: number | undefined, note: string) => void;
}

export function AmountModal({
  visible,
  title,
  subtitle,
  defaultAmount,
  maxAmount,
  optional = false,
  confirmLabel = "Confirm",
  submitting = false,
  slideToConfirm = false,
  onCancel,
  onConfirm,
}: AmountModalProps): React.ReactElement {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setAmount(defaultAmount != null ? String(defaultAmount) : "");
      setNote("");
      setError(null);
    }
  }, [visible, defaultAmount]);

  function submit(): void {
    const trimmed = amount.trim();
    if (!trimmed) {
      if (optional) {
        onConfirm(undefined, note.trim());
        return;
      }
      setError("Enter an amount.");
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter a valid positive amount.");
      return;
    }
    if (maxAmount != null && n > maxAmount) {
      setError(`Cannot collect more than the due (৳${maxAmount}).`);
      return;
    }
    onConfirm(n, note.trim());
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <Pressable className="flex-1 justify-end bg-black/50" onPress={onCancel}>
          <Pressable className="rounded-t-3xl bg-surface px-5 pb-8 pt-3" onPress={() => undefined}>
            <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-border-strong" />
            <Text className="text-xl font-bold text-ink">{title}</Text>
            {subtitle ? <Text className="mt-0.5 text-sm text-ink-muted">{subtitle}</Text> : null}

            <View className="mt-5 gap-3.5">
              <Input
                label={`Amount${optional ? " (optional)" : ""}`}
                placeholder="0"
                keyboardType="numeric"
                icon="cash-outline"
                value={amount}
                onChangeText={(t) => {
                  setAmount(t);
                  if (error) setError(null);
                }}
                error={error}
              />
              <Input
                label="Note (optional)"
                placeholder="e.g. paid cash"
                icon="create-outline"
                value={note}
                onChangeText={setNote}
              />
            </View>

            {slideToConfirm ? (
              <View className="mt-6 gap-3">
                <SlideToConfirm
                  key={visible ? "open" : "closed"}
                  label={confirmLabel}
                  submitting={submitting}
                  onConfirm={submit}
                />
                <Pressable onPress={onCancel} disabled={submitting} hitSlop={8} className="self-center py-1.5 active:opacity-60">
                  <Text className="text-[14px] font-semibold text-ink-muted">Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <View className="mt-6 flex-row gap-3">
                <View className="flex-1">
                  <Button title="Cancel" variant="secondary" onPress={onCancel} disabled={submitting} />
                </View>
                <View className="flex-1">
                  <Button title={confirmLabel} loading={submitting} onPress={submit} />
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
