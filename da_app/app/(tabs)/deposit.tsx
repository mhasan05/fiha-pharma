import { Ionicons } from "@/components/Icon";
import { FadeInScreen } from "@/components/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getApiErrorMessage } from "@/api/client";
import { getDashboard, getDeposits, submitDeposit } from "@/api/delivery";
import { qk } from "@/api/queryKeys";
import { Badge, Button, Card, Input, Skeleton, statusTone } from "@/components/ui";
import { formatCurrency, formatDateTime, titleCase } from "@/lib/format";
import { gradient, shadow, theme } from "@/theme";
import type { DepositRequest, DepositStatus } from "@/types/api";

const HISTORY_FILTERS: ("all" | DepositStatus)[] = ["all", "pending", "approved", "rejected"];

export default function DepositScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [filterIdx, setFilterIdx] = useState(0);
  const filter = HISTORY_FILTERS[filterIdx] ?? "all";

  const deposits = useQuery({ queryKey: qk.deposits(), queryFn: () => getDeposits() });
  const dash = useQuery({ queryKey: qk.dashboard, queryFn: getDashboard });

  const submitM = useMutation({
    mutationFn: () => submitDeposit(note.trim()),
    onSuccess: () => {
      setNote("");
      void qc.invalidateQueries({ queryKey: ["deposits"] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      Alert.alert("Deposit submitted", "Your cash deposit is awaiting admin approval.");
    },
    onError: (e) => Alert.alert("Failed", getApiErrorMessage(e)),
  });

  const undeposited = deposits.data?.undeposited_amount ?? 0;

  function onSubmit(): void {
    if (undeposited <= 0) {
      Alert.alert("Nothing to deposit", "You have no undeposited cash right now.");
      return;
    }
    submitM.mutate();
  }

  const history = (deposits.data?.data ?? []).filter(
    (d: DepositRequest) => filter === "all" || d.status === filter
  );

  return (
    <FadeInScreen>
      <View className="px-5 pb-2" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[28px] font-extrabold text-ink">Summary / Deposit</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={deposits.isRefetching || dash.isRefetching}
            tintColor={theme.color.primary}
            onRefresh={() => {
              void deposits.refetch();
              void dash.refetch();
            }}
          />
        }
      >
        {/* Black hero */}
        {deposits.isLoading ? (
          <Skeleton height={150} radius={24} />
        ) : (
          <LinearGradient
            colors={gradient.collection}
            start={gradient.start}
            end={gradient.end}
            style={[shadow.hero, { borderRadius: 24, padding: 20 }]}
          >
            <Text className="text-sm text-white/70">Today's Total Collection</Text>
            <Text className="mt-1 text-[34px] font-extrabold text-white">
              {formatCurrency(dash.data?.today_collection ?? 0)}
            </Text>
            <View className="mt-4 flex-row justify-between">
              <Text className="text-[13px] text-white/80">
                Cash in Hand: <Text className="font-bold text-white">{formatCurrency(deposits.data?.cash_in_hand ?? 0)}</Text>
              </Text>
              <Text className="text-[13px] text-white/80">
                Pending Deposit: <Text className="font-bold text-white">{formatCurrency(dash.data?.pending_deposit_amount ?? 0)}</Text>
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Deposit form */}
        <View className="mt-6 gap-4">
          <Input
            label="Deposit Amount"
            icon="business-outline"
            value={undeposited > 0 ? String(undeposited) : ""}
            editable={false}
            placeholder="No undeposited cash"
            hint="All undeposited cash is submitted together."
          />
          <Input
            label="Note"
            icon="create-outline"
            placeholder="Enter note (optional)"
            value={note}
            onChangeText={setNote}
          />
          <Button title="Submit Deposit" loading={submitM.isPending} onPress={onSubmit} />
        </View>

        {/* History */}
        <View className="mt-7 mb-3 flex-row items-center justify-between">
          <Text className="text-base font-bold text-ink">Day-wise Deposit History</Text>
          <Pressable
            onPress={() => setFilterIdx((i) => (i + 1) % HISTORY_FILTERS.length)}
            className="flex-row items-center rounded-full bg-primary-50 px-3 py-1.5"
          >
            <Ionicons name="filter" size={14} color={theme.color.inkMuted} style={{ marginRight: 4 }} />
            <Text className="text-[13px] font-semibold capitalize text-ink-soft">{filter}</Text>
          </Pressable>
        </View>

        {deposits.isLoading ? (
          <Skeleton height={72} radius={18} />
        ) : history.length === 0 ? (
          <Card className="items-center py-8">
            <Text className="text-sm font-semibold text-ink">No deposits</Text>
            <Text className="text-xs text-ink-muted">Submitted deposits will show here.</Text>
          </Card>
        ) : (
          history.map((d: DepositRequest) => (
            <Card key={d.id} className="mb-2.5 flex-row items-center justify-between">
              <View>
                <Text className="text-[15px] font-bold text-ink">End of Day</Text>
                <Text className="text-xs text-ink-muted">{formatDateTime(d.requested_at)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-[15px] font-extrabold text-ink">{formatCurrency(d.amount)}</Text>
                <View className="mt-1">
                  <Badge label={titleCase(d.status)} tone={statusTone(d.status)} />
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </FadeInScreen>
  );
}
