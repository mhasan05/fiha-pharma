import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getApiErrorMessage } from "@/api/client";
import { createOrder, updateOrder } from "@/api/orders";
import { bonusPercentFor, getConditionalDiscounts, getPrivacyPolicy } from "@/api/settings";
import { Ionicons } from "@/components/Icon";
import { Img } from "@/components/Img";
import { Button, Card, EmptyState } from "@/components/ui";
import { mediaUrl } from "@/lib/env";
import { formatCurrency } from "@/lib/format";
import { shadow, useColors } from "@/theme";
import { useT } from "@/lib/i18n";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { feedback, useFeedbackStore } from "@/store/feedbackStore";
import type { CartLine } from "@/types/api";

export default function CartScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const showFeedback = useFeedbackStore((s) => s.show);
  const lines = useCartStore((s) => s.lines);
  const editingOrderId = useCartStore((s) => s.editingOrderId);
  const setQty = useCartStore((s) => s.setQty);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotal());

  const delivery = 0;

  const privacy = useQuery({ queryKey: ["privacy-policy"], queryFn: getPrivacyPolicy });
  const discounts = useQuery({ queryKey: ["conditional-discounts"], queryFn: getConditionalDiscounts });

  // Privacy-policy points (each line is prefixed with "#" in the backend).
  const policyLines = (privacy.data?.content ?? "")
    .split(/\r?\n/)
    .map((l: string) => l.replace(/^\s*#\s?/, "").trim())
    .filter(Boolean);

  // Special discount from settings (highest tier whose minimum is met).
  const discountPct = bonusPercentFor(subtotal, discounts.data ?? []);
  const discountAmount = Math.round(((subtotal * discountPct) / 100) * 100) / 100;
  const total = subtotal + delivery - discountAmount;

  const placeOrder = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("You must be logged in.");
      // Edit mode → PATCH replaces the pending order's lines (no double-count).
      return editingOrderId != null
        ? updateOrder(editingOrderId, lines)
        : createOrder(user.user_id, lines);
    },
    onSuccess: () => {
      const wasEditing = editingOrderId != null;
      clear();
      void qc.invalidateQueries({ queryKey: ["orders"] });
      if (wasEditing && editingOrderId != null) void qc.invalidateQueries({ queryKey: ["order", editingOrderId] });
      showFeedback({
        type: "success",
        title: wasEditing ? t("orderUpdated") : t("orderPlaced"),
        message: wasEditing ? t("orderUpdatedMsg") : t("orderPlacedMsg"),
        actions: [
          { label: t("ok"), variant: "secondary" },
          { label: t("viewOrders"), variant: "primary", onPress: () => router.push("/(tabs)/history") },
        ],
      });
    },
    onError: (e) => feedback.error(t("orderFailed"), getApiErrorMessage(e)),
  });

  return (
    <View className="flex-1 bg-canvas">
      <View className="border-b border-border bg-surface px-5 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[24px] font-extrabold text-ink">{editingOrderId != null ? t("updateOrder") : t("myCart")}</Text>
        {editingOrderId != null ? (
          <Text className="text-[13px] font-semibold text-primary">{t("editingOrder")}</Text>
        ) : lines.length > 0 ? (
          <Text className="text-[13px] text-ink-muted">{lines.length} {lines.length === 1 ? t("item") : t("items")}</Text>
        ) : null}
      </View>

      {lines.length === 0 ? (
        <EmptyState icon="bag-outline" title={t("cartEmpty")} message={t("cartEmptyHint")} />
      ) : (
        <FlatList
          data={lines}
          keyExtractor={(l) => String(l.product_id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: CartLine }) => {
            const img = mediaUrl(item.product_image);
            return (
              <View style={shadow.sm} className="mb-2.5 flex-row items-center rounded-2xl border border-border bg-surface p-3">
                <View className="h-14 w-14 items-center justify-center rounded-xl bg-primary-50">
                  {img ? <Img source={{ uri: img }} style={{ width: "80%", height: "80%" }} contentFit="contain" /> : <Ionicons name="cube-outline" size={22} color={c.inkFaint} />}
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[14px] font-bold text-ink" numberOfLines={1}>{item.product_name}</Text>
                  <Text className="text-[12px] text-ink-muted" numberOfLines={1}>{item.company_name}</Text>
                </View>
                <View className="items-end">
                  <View className="flex-row items-center rounded-full bg-primary-50 px-1 py-1">
                    <Pressable onPress={() => setQty(item.product_id, item.quantity - 1)} hitSlop={6} className="h-6 w-7 items-center justify-center rounded-full active:opacity-60">
                      <Ionicons name="remove" size={15} color={c.danger} />
                    </Pressable>
                    <Text className="w-6 text-center text-[14px] font-bold text-primary">{item.quantity}</Text>
                    <Pressable onPress={() => setQty(item.product_id, item.quantity + 1)} hitSlop={6} className="h-6 w-7 items-center justify-center rounded-full active:opacity-60">
                      <Ionicons name="add" size={15} color={c.ink} />
                    </Pressable>
                  </View>
                  <Text className="mt-1 text-[13px] font-extrabold text-ink">{formatCurrency(item.selling_price * item.quantity)}</Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            <View>
              <Card className="mt-2">
                <Row label={t("subtotal")} value={formatCurrency(subtotal)} />
                <Row label={t("delivery")} value={formatCurrency(delivery)} />
                {discountAmount > 0 ? (
                  <Row label={`${t("discount")} (${discountPct}%)`} value={`- ${formatCurrency(discountAmount)}`} accent />
                ) : null}
                <View className="my-2 h-px bg-border" />
                <Row label={t("total")} value={formatCurrency(total)} bold />
              </Card>

              {policyLines.length > 0 ? (
                <Card className="mt-4">
                  {policyLines.map((line: string, i: number) => (
                    <Text key={i} className={`text-[13px] leading-5 text-ink-soft ${i > 0 ? "mt-3" : ""}`}>
                      {line}
                    </Text>
                  ))}
                </Card>
              ) : null}
            </View>
          }
        />
      )}

      {lines.length > 0 ? (
        <View className="border-t border-border bg-surface px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
          <Button title={editingOrderId != null ? t("updateOrder") : t("placeOrder")} icon="checkmark-circle" loading={placeOrder.isPending} onPress={() => placeOrder.mutate()} />
        </View>
      ) : null}
    </View>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }): React.ReactElement {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className={`text-[14px] ${bold ? "font-extrabold text-ink" : accent ? "font-medium text-success" : "text-ink-muted"}`}>{label}</Text>
      <Text className={`${bold ? "text-[16px] font-extrabold text-ink" : accent ? "text-[14px] font-bold text-success" : "text-[14px] font-semibold text-ink"}`}>{value}</Text>
    </View>
  );
}
