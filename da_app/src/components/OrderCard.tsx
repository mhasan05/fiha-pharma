import { Ionicons } from "@/components/Icon";
import { Pressable, Text, View } from "react-native";

import { Badge, deliveryStatusLabel, statusTone } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { shadow, theme } from "@/theme";
import type { DeliveryOrder } from "@/types/api";

export function OrderCard({
  order,
  onPress,
}: {
  order: DeliveryOrder;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={shadow.sm}
      className="mb-3 rounded-2xl border border-border bg-surface p-4 active:scale-[0.99]"
    >
      {/* Header: invoice + shop + status */}
      <View className="flex-row items-center">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-50">
          <Ionicons name="cube-outline" size={20} color={theme.color.primary} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[14px] font-bold text-ink" numberOfLines={1}>
            {order.invoice_number}
          </Text>
          <View className="mt-0.5 flex-row items-center">
            <Ionicons name="storefront-outline" size={11} color={theme.color.inkMuted} />
            <Text className="ml-1 flex-1 text-xs text-ink-muted" numberOfLines={1}>
              {order.shop_name || order.customer_name}
            </Text>
          </View>
          {order.address || order.area ? (
            <View className="mt-0.5 flex-row items-center">
              <Ionicons name="location-outline" size={11} color={theme.color.inkFaint} />
              <Text className="ml-1 flex-1 text-[11px] text-ink-faint" numberOfLines={1}>
                {order.address || order.area}
              </Text>
            </View>
          ) : null}
        </View>
        <Badge label={deliveryStatusLabel(order.delivery_status)} tone={statusTone(order.delivery_status)} />
      </View>

      <View className="my-3 h-px bg-border" />

      {/* Footer: amount + expected date */}
      <View className="flex-row items-end justify-between">
        <View>
          <Text className="text-[11px] font-medium text-ink-faint">Amount</Text>
          <Text className="text-[20px] font-extrabold text-ink">{formatCurrency(order.invoice_amount)}</Text>
        </View>
        <View className="flex-row items-center rounded-full bg-primary-50 px-2.5 py-1">
          <Ionicons name="calendar-outline" size={12} color={theme.color.inkMuted} />
          <Text className="ml-1.5 text-[12px] font-medium text-ink-soft">{formatDate(order.order_date)}</Text>
        </View>
      </View>
    </Pressable>
  );
}
