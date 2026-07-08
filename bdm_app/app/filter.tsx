import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getCompanies, getGenerics } from "@/api/products";
import { Ionicons } from "@/components/Icon";
import { MenuBar } from "@/components/MenuBar";
import { Button } from "@/components/ui";
import { useColors } from "@/theme";
import { useT } from "@/lib/i18n";
import type { Company, GenericName } from "@/types/api";

type Mode = "company" | "generic";

export default function FilterScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const t = useT();
  const [mode, setMode] = useState<Mode>("company");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const companies = useQuery({ queryKey: ["companies"], queryFn: getCompanies });
  const generics = useQuery({ queryKey: ["generics"], queryFn: getGenerics });

  const names: string[] = useMemo(() => {
    const list: string[] =
      mode === "company"
        ? (companies.data ?? []).map((c: Company) => c.company_name)
        : (generics.data ?? []).map((g: GenericName) => g.name);
    const q = search.trim().toLowerCase();
    const filtered = q ? list.filter((n: string) => n.toLowerCase().includes(q)) : list;
    return Array.from(new Set(filtered)).sort((a: string, b: string) => a.localeCompare(b));
  }, [mode, companies.data, generics.data, search]);

  function toggle(name: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function switchMode(m: Mode): void {
    setMode(m);
    setSelected(new Set());
    setSearch("");
  }

  function apply(): void {
    const picked = Array.from(selected);
    if (picked.length === 0) {
      router.back();
      return;
    }
    const key = mode === "company" ? "company_names" : "generic_names";
    router.push({ pathname: "/products", params: { [key]: picked.join(",") } });
  }

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center border-b border-border bg-surface px-4 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2 h-9 w-9 items-center justify-center active:opacity-60">
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t("filter")}</Text>
      </View>

      <View className="p-4">
        {/* Search */}
        <View className="h-12 flex-row items-center rounded-full bg-surface px-4" style={{ borderWidth: 1, borderColor: c.border }}>
          <TextInput
            className="h-full flex-1 py-0 text-[15px] text-ink"
            placeholder={mode === "company" ? t("searchCompany") : t("searchGeneric")}
            placeholderTextColor={c.inkFaint}
            value={search}
            onChangeText={setSearch}
          />
          <Ionicons name="funnel-outline" size={18} color={c.primary} />
        </View>

        {/* Mode toggle — segmented control */}
        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row rounded-full bg-primary-50 p-1" style={{ borderWidth: 1, borderColor: c.border }}>
            <ModeChip label={t("company")} active={mode === "company"} onPress={() => switchMode("company")} />
            <ModeChip label={t("generic")} active={mode === "generic"} onPress={() => switchMode("generic")} />
          </View>
          {selected.size > 0 ? (
            <Pressable onPress={() => setSelected(new Set())} hitSlop={8} className="h-8 w-8 items-center justify-center">
              <Ionicons name="close" size={20} color={c.inkMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={names}
        keyExtractor={(n) => n}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const checked = selected.has(item);
          return (
            <Pressable
              onPress={() => toggle(item)}
              className="mb-2 flex-row items-center justify-between rounded-2xl bg-primary-50 px-4 py-3.5 active:opacity-70"
            >
              <Text className="flex-1 pr-3 text-[15px] text-ink" numberOfLines={1}>{item}</Text>
              <View className={`h-6 w-6 items-center justify-center rounded-md border ${checked ? "border-primary bg-primary" : "border-border-strong bg-surface"}`}>
                {checked ? <Ionicons name="checkmark" size={16} color={c.white} /> : null}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text className="py-8 text-center text-ink-muted">Nothing to show.</Text>}
      />

      <View className="flex-row gap-3 border-t border-border bg-surface px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <View className="flex-1">
          <Button title={t("clear")} variant="secondary" onPress={() => setSelected(new Set())} />
        </View>
        <View className="flex-1">
          <Button title={t("apply")} onPress={apply} />
        </View>
      </View>
      <MenuBar active="index" />
    </View>
  );
}

function ModeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }): React.ReactElement {
  return (
    <Pressable onPress={onPress} className={`rounded-full px-5 py-2 ${active ? "bg-primary" : ""}`}>
      <Text className={`text-[13px] font-semibold ${active ? "text-white" : "text-ink-muted"}`}>{label}</Text>
    </Pressable>
  );
}
