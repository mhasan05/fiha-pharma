import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getOrder } from "@/api/orders";
import { bonusPercentFor, getConditionalDiscounts } from "@/api/settings";
import { Ionicons } from "@/components/Icon";
import { Img } from "@/components/Img";
import { MenuBar } from "@/components/MenuBar";
import { Badge, Button, Card, EmptyState, LoadingSpinner, type BadgeTone } from "@/components/ui";
import { SUPPORT_PHONE } from "@/lib/constants";
import { mediaUrl } from "@/lib/env";
import { formatCurrency, formatDate, titleCase } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { shadow, useColors } from "@/theme";
import { useCartStore } from "@/store/cartStore";
import { feedback } from "@/store/feedbackStore";
import type { CartLine, OrderItem } from "@/types/api";

function orderTone(status: string): BadgeTone {
  if (status === "delivered") return "success";
  if (status === "cancelled") return "danger";
  return "warning";
}

function lineTotal(item: OrderItem): number {
  if (typeof item.items_total === "number") return item.items_total;
  return (item.selling_price ?? 0) * item.quantity;
}

function toCartLine(item: OrderItem): CartLine {
  return {
    product_id: item.product ?? 0,
    product_name: item.product_name,
    product_image: item.product_image ?? null,
    company_name: item.company_name ?? null,
    selling_price: item.selling_price ?? 0,
    mrp: item.mrp ?? item.selling_price ?? 0,
    quantity: item.quantity,
    stock_quantity: 0,
  };
}

export default function OrderDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const t = useT();
  const loadCart = useCartStore((s) => s.load);

  const validId = Number.isFinite(orderId);
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    enabled: validId,
  });
  const discounts = useQuery({ queryKey: ["conditional-discounts"], queryFn: getConditionalDiscounts });

  const items: OrderItem[] = order?.items ?? [];
  const subtotal = order?.subtotal_amount ?? items.reduce((s: number, i: OrderItem) => s + lineTotal(i), 0);
  const delivery = order?.delivery_charge ?? 0;

  // Special discount — mirror the cart's calculation for a consistent breakdown.
  const discountPct = bonusPercentFor(subtotal, discounts.data ?? []);
  const discountAmount = Math.round(((subtotal * discountPct) / 100) * 100) / 100;
  const total = subtotal + delivery - discountAmount;

  // Collected / outstanding on this invoice (from the backend). "Due" is only
  // meaningful once delivered — the goods are out and not fully paid; a pending
  // order's unpaid balance is not shown as a due.
  const isDelivered = order?.order_status === "delivered";
  const paidAmount = Number(order?.collected_amount ?? 0);
  const dueAmount = isDelivered ? Number(order?.due_amount ?? 0) : 0;

  const editable = order?.order_status === "pending";

  function updateOrder(): void {
    if (!items.length) return;
    loadCart(items.filter((i) => i.product != null).map(toCartLine), orderId);
    router.push("/(tabs)/cart");
  }

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center border-b border-border bg-surface px-4 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2 h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-ink" numberOfLines={1}>{order?.invoice_number ?? t("order")}</Text>
      </View>

      {!validId || isError || (!isLoading && !order) ? (
        <EmptyState icon="receipt-outline" title={t("noResults")} message="This order could not be found." />
      ) : isLoading || !order ? (
        <LoadingSpinner label="Loading…" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 96 }} showsVerticalScrollIndicator={false}>
          {/* Status + date */}
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-[13px] text-ink-muted">{formatDate(order.order_date)}</Text>
              <Text className="text-[14px] font-semibold text-ink">{items.length} {items.length === 1 ? t("item") : t("items")}</Text>
            </View>
            <Badge label={titleCase(order.order_status)} tone={orderTone(order.order_status)} />
          </View>

          {/* Items */}
          <Card padded={false} className="mb-4 overflow-hidden">
            {items.map((item: OrderItem, idx: number) => {
              const img = mediaUrl(item.product_image);
              return (
                <View key={item.id ?? idx}>
                  {idx > 0 ? <View className="ml-16 h-px bg-border" /> : null}
                  <View className="flex-row items-center px-4 py-3">
                    <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
                      {img ? <Img source={{ uri: img }} style={{ width: "78%", height: "78%" }} contentFit="contain" /> : <Ionicons name="cube-outline" size={20} color={c.inkFaint} />}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-[14px] font-bold text-ink" numberOfLines={1}>{item.product_name}</Text>
                      <Text className="text-[12px] text-ink-muted">{item.quantity} × {formatCurrency(item.selling_price ?? 0)}</Text>
                    </View>
                    <Text className="text-[14px] font-extrabold text-ink">{formatCurrency(lineTotal(item))}</Text>
                  </View>
                </View>
              );
            })}
          </Card>

          {/* Summary — same breakdown as the cart */}
          <Card style={shadow.sm}>
            <Row label={t("subtotal")} value={formatCurrency(subtotal)} />
            <Row label={t("delivery")} value={formatCurrency(delivery)} />
            {discountAmount > 0 ? (
              <Row label={`${t("discount")} (${discountPct}%)`} value={`- ${formatCurrency(discountAmount)}`} accent />
            ) : null}
            <View className="my-2 h-px bg-border" />
            <Row label={t("total")} value={formatCurrency(total)} bold />
            {paidAmount > 0 ? <Row label={t("paid")} value={formatCurrency(paidAmount)} accent /> : null}
            {dueAmount > 0 ? <Row label={t("due")} value={formatCurrency(dueAmount)} danger /> : null}
          </Card>

          <View className="mt-6 gap-3">
            {editable ? (
              // While pending the customer can still edit; once it's being
              // processed, editing is locked and only contacting the seller remains.
              <Button title={t("updateOrder")} icon="create-outline" onPress={updateOrder} />
            ) : (
              <Button
                title={t("contactSeller")}
                variant="primaryOutline"
                icon="call-outline"
                onPress={() => void Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => feedback.error(t("cannotOpenDialer")))}
              />
            )}
          </View>
        </ScrollView>
      )}

      <MenuBar active="history" />
    </View>
  );
}

function Row({ label, value, bold, accent, danger }: { label: string; value: string; bold?: boolean; accent?: boolean; danger?: boolean }): React.ReactElement {
  const labelTone = bold ? "font-extrabold text-ink" : danger ? "font-medium text-danger" : accent ? "font-medium text-success" : "text-ink-muted";
  const valueTone = bold
    ? "text-[16px] font-extrabold text-ink"
    : danger
      ? "text-[14px] font-bold text-danger"
      : accent
        ? "text-[14px] font-bold text-success"
        : "text-[14px] font-semibold text-ink";
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className={`text-[14px] ${labelTone}`}>{label}</Text>
      <Text className={valueTone}>{value}</Text>
    </View>
  );
}
