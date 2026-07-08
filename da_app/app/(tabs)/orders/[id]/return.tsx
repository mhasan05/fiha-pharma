import { Ionicons } from "@/components/Icon";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getApiErrorMessage } from "@/api/client";
import { getOrderDetail, submitReturn } from "@/api/delivery";
import { qk } from "@/api/queryKeys";
import { BackHeader } from "@/components/Screen";
import { Button, Input, LoadingSpinner } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { shadow, theme } from "@/theme";
import type { DeliveryOrderItem, ReturnItemInput } from "@/types/api";

interface LineState {
  selected: boolean;
  quantity: string;
  reason: string;
}

export default function ReturnScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.order(orderId),
    queryFn: () => getOrderDetail(orderId),
    enabled: Number.isFinite(orderId),
  });

  const [lines, setLines] = useState<Record<number, LineState>>({});
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: (items: ReturnItemInput[]) => submitReturn(orderId, items, note.trim()),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.order(orderId) });
      void qc.invalidateQueries({ queryKey: ["return-requests"] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      // The order total/due drop right away, so refresh the dues + order lists.
      void qc.invalidateQueries({ queryKey: qk.dues });
      void qc.invalidateQueries({ queryKey: ["orders"] });
      Alert.alert(
        "Return submitted",
        "The order amount has been updated. Collect the new amount. Staff will confirm the returned goods at end of day.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    onError: (e) => Alert.alert("Failed", getApiErrorMessage(e)),
  });

  if (isLoading || !data) return <LoadingSpinner label="Loading…" />;

  function lineFor(product: number): LineState {
    return lines[product] ?? { selected: false, quantity: "", reason: "" };
  }
  function update(product: number, patch: Partial<LineState>): void {
    setLines((prev) => ({ ...prev, [product]: { ...lineFor(product), ...patch } }));
  }
  function toggle(it: DeliveryOrderItem): void {
    const ls = lineFor(it.product);
    update(it.product, { selected: !ls.selected, quantity: ls.quantity || String(it.quantity) });
  }

  const selectedCount = Object.values(lines).filter((l) => l.selected).length;

  function submit(): void {
    const items: ReturnItemInput[] = [];
    for (const it of data.items) {
      const ls = lines[it.product];
      if (!ls?.selected) continue;
      const qty = Number(ls.quantity);
      if (!Number.isFinite(qty) || qty <= 0 || qty > it.quantity) {
        Alert.alert("Invalid quantity", `Check the quantity for ${it.product_name}.`);
        return;
      }
      items.push({ product: it.product, quantity: qty, reason: ls.reason.trim() || "Returned at delivery" });
    }
    if (items.length === 0) {
      Alert.alert("Nothing selected", "Select at least one item to return.");
      return;
    }
    mutation.mutate(items);
  }

  return (
    <View className="flex-1 bg-canvas">
      <BackHeader title="Return items" subtitle={data.invoice_number} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="mb-3 flex-row items-start rounded-2xl bg-info-soft p-3.5">
          <Ionicons name="information-circle" size={18} color={theme.color.info} style={{ marginTop: 1 }} />
          <Text className="ml-2 flex-1 text-[13px] text-info">
            The order amount updates immediately so you collect the correct
            total. Stock is restored after staff confirm the returned goods.
          </Text>
        </View>

        {data.items.map((it: DeliveryOrderItem) => {
          const ls = lineFor(it.product);
          return (
            <View
              key={it.product}
              style={ls.selected ? shadow.sm : undefined}
              className={`mb-3 rounded-2xl border bg-surface p-4 ${ls.selected ? "border-primary" : "border-border"}`}
            >
              <Pressable className="flex-row items-center" onPress={() => toggle(it)}>
                <View
                  className={`mr-3 h-6 w-6 items-center justify-center rounded-lg border-[1.5px] ${
                    ls.selected ? "border-primary bg-primary" : "border-border-strong bg-surface"
                  }`}
                >
                  {ls.selected ? <Ionicons name="checkmark" size={15} color={theme.color.white} /> : null}
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-semibold text-ink">{it.product_name}</Text>
                  <Text className="text-xs text-ink-muted">
                    Ordered {it.quantity} · {formatCurrency(it.unit_price)} each
                  </Text>
                </View>
              </Pressable>

              {ls.selected ? (
                <View className="mt-3.5 gap-3">
                  <Input
                    label={`Quantity (max ${it.quantity})`}
                    keyboardType="numeric"
                    icon="cube-outline"
                    value={ls.quantity}
                    onChangeText={(t) => update(it.product, { quantity: t })}
                  />
                  <Input
                    label="Reason"
                    placeholder="e.g. damaged, expired"
                    icon="alert-circle-outline"
                    value={ls.reason}
                    onChangeText={(t) => update(it.product, { reason: t })}
                  />
                </View>
              ) : null}
            </View>
          );
        })}

        <Input label="Overall note (optional)" placeholder="Anything to add" value={note} onChangeText={setNote} />
      </ScrollView>

      <View
        style={[shadow.md, { paddingBottom: insets.bottom + 12 }]}
        className="border-t border-border bg-surface px-4 pt-3"
      >
        <Button
          title={selectedCount > 0 ? `Submit return (${selectedCount})` : "Submit return request"}
          icon="arrow-undo"
          loading={mutation.isPending}
          onPress={submit}
        />
      </View>
    </View>
  );
}
