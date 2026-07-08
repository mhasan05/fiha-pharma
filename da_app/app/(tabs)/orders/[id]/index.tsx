import { Ionicons } from "@/components/Icon";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getApiErrorMessage } from "@/api/client";
import { collectPayment, deliverOrder, getOrderDetail } from "@/api/delivery";
import { qk } from "@/api/queryKeys";
import { AmountModal } from "@/components/AmountModal";
import { BackHeader } from "@/components/Screen";
import { Badge, Button, Card, EmptyState, LoadingSpinner, deliveryStatusLabel, statusTone } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { shadow, theme } from "@/theme";
import type { DeliveryOrderItem } from "@/types/api";

type ActiveModal = "deliver" | "collect" | null;

export default function OrderDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [modal, setModal] = useState<ActiveModal>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.order(orderId),
    queryFn: () => getOrderDetail(orderId),
    enabled: Number.isFinite(orderId),
  });

  function invalidateAll(): void {
    void qc.invalidateQueries({ queryKey: qk.order(orderId) });
    void qc.invalidateQueries({ queryKey: ["orders"] });
    void qc.invalidateQueries({ queryKey: qk.dashboard });
    void qc.invalidateQueries({ queryKey: qk.dues });
  }

  const deliverM = useMutation({
    mutationFn: (amount?: number) => deliverOrder(orderId, amount),
    onSuccess: () => {
      setModal(null);
      invalidateAll();
      Alert.alert("Delivered", "Order marked as delivered.");
    },
    onError: (e) => Alert.alert("Failed", getApiErrorMessage(e)),
  });

  const collectM = useMutation({
    mutationFn: ({ amount, note }: { amount: number; note: string }) => collectPayment(orderId, amount, note),
    onSuccess: () => {
      setModal(null);
      invalidateAll();
      Alert.alert("Collected", "Payment recorded.");
    },
    onError: (e) => Alert.alert("Failed", getApiErrorMessage(e)),
  });

  if (isLoading) return <LoadingSpinner label="Loading order…" />;
  if (isError || !data) {
    return (
      <View className="flex-1 bg-canvas">
        <BackHeader title="Order" />
        <EmptyState
          icon="warning-outline"
          tone="danger"
          title="Couldn't load order"
          message={error instanceof Error ? error.message : undefined}
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </View>
    );
  }

  const isDelivered = data.delivery_status === "delivered";
  const hasDue = data.due_amount > 0;
  const totalQty = data.items.reduce((s: number, it: DeliveryOrderItem) => s + it.quantity, 0);

  return (
    <View className="flex-1 bg-canvas">
      <BackHeader
        title={data.invoice_number}
        subtitle={data.shop_name || data.customer_name}
        right={<Badge label={deliveryStatusLabel(data.delivery_status)} tone={statusTone(data.delivery_status)} />}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Customer */}
        <Card>
          <Text className="text-base font-bold text-ink">{data.customer_name}</Text>
          {data.shop_name ? <Text className="mt-0.5 text-[13px] text-ink-muted">{data.shop_name}</Text> : null}
          <View className="mt-3 flex-row gap-3">
            <ContactButton
              icon="call"
              label="Call"
              onPress={() => Linking.openURL(`tel:${data.phone}`)}
            />
            <ContactButton
              icon="navigate"
              label="Map"
              onPress={() => {
                // Navigate to the shop's exact GPS pin when set; otherwise fall
                // back to a text search on the address/area.
                const url =
                  data.shop_latitude != null && data.shop_longitude != null
                    ? `https://www.google.com/maps/dir/?api=1&destination=${data.shop_latitude},${data.shop_longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address || data.area || "")}`;
                void Linking.openURL(url);
              }}
            />
          </View>
          <View className="mt-3 flex-row items-start">
            <Ionicons name="location-outline" size={15} color={theme.color.inkFaint} style={{ marginTop: 2 }} />
            <Text className="ml-1.5 flex-1 text-[13px] text-ink-muted">{data.address || data.area || "—"}</Text>
          </View>
        </Card>

        {/* Items */}
        <Card className="mt-4">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-ink">Items</Text>
            <Text className="text-xs font-medium text-ink-muted">
              {data.items.length} items · {totalQty} units
            </Text>
          </View>
          {data.items.map((it: DeliveryOrderItem, idx: number) => (
            <View
              key={`${it.product}-${idx}`}
              className={`flex-row items-center justify-between py-2.5 ${idx < data.items.length - 1 ? "border-b border-border" : ""}`}
            >
              <View className="flex-1 pr-2">
                <Text className="text-[14px] font-medium text-ink" numberOfLines={1}>
                  {it.product_name}
                </Text>
                <Text className="mt-0.5 text-xs text-ink-faint">
                  {it.quantity} × {formatCurrency(it.unit_price)}
                </Text>
              </View>
              <Text className="text-[14px] font-semibold text-ink">{formatCurrency(it.line_total)}</Text>
            </View>
          ))}
        </Card>

        {/* Payment summary */}
        <Card className="mt-4">
          <SummaryRow label="Invoice amount" value={formatCurrency(data.invoice_amount)} />
          <SummaryRow label="Collected" value={formatCurrency(data.collected_amount)} valueClass="text-success" />
          <View className="my-2.5 h-px bg-border" />
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-ink">Due</Text>
            <Text className={`text-2xl font-extrabold ${hasDue ? "text-danger" : "text-success"}`}>
              {formatCurrency(data.due_amount)}
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Sticky action bar */}
      <View
        style={[shadow.md, { paddingBottom: insets.bottom + 12 }]}
        className="border-t border-border bg-surface px-4 pt-3"
      >
        {!isDelivered ? (
          <Button title="Mark delivered" variant="success" icon="checkmark-circle" loading={deliverM.isPending} onPress={() => setModal("deliver")} />
        ) : hasDue ? (
          <Button title="Collect payment" icon="cash" onPress={() => setModal("collect")} />
        ) : (
          <Button title="Fully paid" variant="secondary" disabled />
        )}
        {!isDelivered ? (
          <View className="mt-2.5">
            <Button
              title="Return"
              variant="secondary"
              size="md"
              icon="arrow-undo-outline"
              onPress={() => router.push(`/(tabs)/orders/${orderId}/return` as Href)}
            />
          </View>
        ) : null}
      </View>

      <AmountModal
        visible={modal === "deliver"}
        title="Mark delivered"
        subtitle="Optionally collect payment now"
        defaultAmount={data.due_amount > 0 ? data.due_amount : undefined}
        maxAmount={data.due_amount}
        optional
        confirmLabel="Slide to confirm delivery"
        slideToConfirm
        submitting={deliverM.isPending}
        onCancel={() => setModal(null)}
        onConfirm={(amount) => deliverM.mutate(amount)}
      />
      <AmountModal
        visible={modal === "collect"}
        title="Collect payment"
        subtitle={`Due ${formatCurrency(data.due_amount)}`}
        defaultAmount={data.due_amount}
        maxAmount={data.due_amount}
        confirmLabel="Record payment"
        submitting={collectM.isPending}
        onCancel={() => setModal(null)}
        onConfirm={(amount, note) => {
          if (amount != null) collectM.mutate({ amount, note });
        }}
      />
    </View>
  );
}

function ContactButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable onPress={onPress} className="flex-1 flex-row items-center justify-center rounded-xl bg-primary-50 py-2.5 active:opacity-80">
      <Ionicons name={icon} size={16} color={theme.color.primary} style={{ marginRight: 6 }} />
      <Text className="text-sm font-semibold text-primary-700">{label}</Text>
    </Pressable>
  );
}

function SummaryRow({
  label,
  value,
  valueClass = "text-ink",
}: {
  label: string;
  value: string;
  valueClass?: string;
}): React.ReactElement {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-sm text-ink-muted">{label}</Text>
      <Text className={`text-[15px] font-semibold ${valueClass}`}>{value}</Text>
    </View>
  );
}
