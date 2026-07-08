import { Ionicons } from "@/components/Icon";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from "react-native";

import { getApiErrorMessage } from "@/api/client";
import { collectPayment } from "@/api/delivery";
import { Avatar, Badge, Button, Input } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { theme } from "@/theme";

export interface CollectTarget {
  orderId: number;
  name: string;
  invoice: string;
  dueAmount: number;
}

export function CollectSheet({
  target,
  onClose,
  onCollected,
}: {
  target: CollectTarget | null;
  onClose: () => void;
  onCollected: () => void;
}): React.ReactElement {
  const [step, setStep] = useState<"choice" | "partial">("choice");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setStep("choice");
      setAmount(String(target.dueAmount));
      setNote("");
      setError(null);
    }
  }, [target]);

  const mutation = useMutation({
    mutationFn: ({ amt, n }: { amt: number; n: string }) => collectPayment(target!.orderId, amt, n),
    onSuccess: () => {
      onCollected();
      onClose();
      Alert.alert("Collected", "Payment recorded.");
    },
    onError: (e) => Alert.alert("Failed", getApiErrorMessage(e)),
  });

  function submitPartial(): void {
    const n = Number(amount.trim());
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (target && n > target.dueAmount) {
      setError(`Cannot collect more than the due (${formatCurrency(target.dueAmount)}).`);
      return;
    }
    mutation.mutate({ amt: n, n: note.trim() });
  }

  return (
    <Modal visible={!!target} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
          <Pressable className="rounded-t-3xl bg-surface px-5 pb-8 pt-3" onPress={() => undefined}>
            <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-border-strong" />

            {/* Customer row */}
            {target ? (
              <View className="mb-5 flex-row items-center">
                <Avatar name={target.name} size={44} />
                <View className="ml-3 flex-1">
                  <Text className="text-[15px] font-bold text-ink">{target.name}</Text>
                  <Text className="text-xs text-ink-faint">{target.invoice}</Text>
                </View>
                <Badge label={formatCurrency(target.dueAmount)} tone="danger" />
              </View>
            ) : null}

            {step === "choice" ? (
              <View className="gap-3">
                <Pressable
                  onPress={() => target && mutation.mutate({ amt: target.dueAmount, n: "Full collection" })}
                  className="flex-row items-center rounded-2xl border border-success-soft bg-success-soft/50 p-4 active:opacity-80"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-success-soft">
                    <Ionicons name="checkmark-circle" size={22} color={theme.color.success} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[15px] font-bold text-ink">Full Collection</Text>
                    <Text className="text-[13px] font-semibold text-success">
                      {formatCurrency(target?.dueAmount ?? 0)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.color.inkFaint} />
                </Pressable>

                <Pressable
                  onPress={() => setStep("partial")}
                  className="flex-row items-center rounded-2xl border border-warning-soft bg-warning-soft/50 p-4 active:opacity-80"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-warning-soft">
                    <Ionicons name="cash-outline" size={22} color={theme.color.warning} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[15px] font-bold text-ink">Partial Payment</Text>
                    <Text className="text-[13px] text-ink-muted">Enter custom amount</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.color.inkFaint} />
                </Pressable>
              </View>
            ) : (
              <View>
                <Text className="mb-3 text-lg font-bold text-ink">Partial Payment</Text>
                <View className="gap-3">
                  <Input
                    placeholder="Amount"
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
                    placeholder="Enter note (optional)"
                    icon="create-outline"
                    value={note}
                    onChangeText={setNote}
                  />
                </View>
                <View className="mt-5">
                  <Button title="Submit" loading={mutation.isPending} onPress={submitPartial} />
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
