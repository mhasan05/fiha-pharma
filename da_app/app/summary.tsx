import { Ionicons } from "@/components/Icon";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import { getDeliverySummary } from "@/api/delivery";
import { qk } from "@/api/queryKeys";
import { BackHeader } from "@/components/Screen";
import { Card, EmptyState, LoadingSpinner } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { theme } from "@/theme";

function initials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

export default function SummaryScreen(): React.ReactElement {
  const q = useQuery({ queryKey: qk.summary, queryFn: getDeliverySummary });
  const s = q.data;

  return (
    <View className="flex-1 bg-canvas">
      <BackHeader title="Delivery Summary" subtitle="Your overall top sheet" />

      {q.isLoading ? (
        <LoadingSpinner label="Loading summary…" />
      ) : q.isError || !s ? (
        <EmptyState icon="warning-outline" tone="danger" title="Couldn't load summary" actionLabel="Try again" onAction={() => void q.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* Identity + Net Sales */}
          <Card className="mb-4">
            <View className="flex-row items-center">
              {/* Avatar */}
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                <Text className="text-[16px] font-extrabold text-primary-700">{initials(s.delivery_man_name)}</Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[16px] font-bold text-ink" numberOfLines={1}>{s.delivery_man_name}</Text>
                <Text className="mt-0.5 text-[12px] text-ink-muted">{s.phone}</Text>
              </View>
              {/* Net Sales highlight */}
              <View className="items-end rounded-xl bg-success-soft px-3 py-2">
                <Text className="text-[9px] font-bold uppercase tracking-wide text-success">Net Sales</Text>
                <Text className="text-[17px] font-extrabold text-success" numberOfLines={1}>{formatCurrency(s.net_sales)}</Text>
              </View>
            </View>

            <View className="my-3 h-px bg-border" />

            <View className="flex-row items-center">
              <Ionicons name="location" size={14} color={theme.color.danger} />
              <Text className="ml-1 text-[12.5px] font-medium text-ink-soft">{s.area || "—"}</Text>
            </View>
          </Card>

          {/* Details */}
          <Card padded={false} className="overflow-hidden">
            <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
              <Text className="text-[15px] font-bold text-ink">Details</Text>
              <Text className="text-[12px] font-semibold text-ink-muted">Total</Text>
            </View>
            <Row label="Area" value={s.area || "—"} />
            <Row label="Number of Orders" value={String(s.number_of_orders)} />
            <Row label="Delivered" value={String(s.delivered_count)} />
            <Row label="Unique Pharmacies" value={String(s.unique_pharmacies)} />
            <Row label="Return Qty" value={String(s.return_qty)} />
            <Row label="Invoice Amount" value={formatCurrency(s.invoice_amount)} />
            <Row label="Return Amount" value={formatCurrency(s.return_amount)} />
            <Row label="Net Sales" value={formatCurrency(s.net_sales)} bold />
            <Row label="Outstanding Due" value={formatCurrency(s.due_amount)} valueClass={s.due_amount > 0 ? "text-danger" : "text-ink"} />
            <Row
              label="Payment Received"
              value={`${formatCurrency(s.collected_amount)}  (${s.payment_percent}%)`}
              valueClass={s.collected_amount > 0 ? "text-success" : "text-danger"}
              last
            />
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

function Row({
  label,
  value,
  valueClass = "text-ink",
  bold = false,
  last = false,
}: {
  label: string;
  value: string;
  valueClass?: string;
  bold?: boolean;
  last?: boolean;
}): React.ReactElement {
  return (
    <View className={`flex-row items-center justify-between px-4 py-3 ${last ? "" : "border-b border-border"}`}>
      <Text className="text-[13.5px] text-ink-muted">{label}</Text>
      <Text className={`text-[14px] ${bold ? "font-extrabold" : "font-semibold"} ${valueClass}`}>{value}</Text>
    </View>
  );
}
