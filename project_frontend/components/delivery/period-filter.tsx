"use client";

import { useMemo, useState } from "react";

export type Period = "all" | "today" | "month" | "year" | "range";

export const PERIOD_LABELS: Record<Period, string> = {
  all: "All Time",
  today: "Today",
  month: "This Month",
  year: "This Year",
  range: "Custom Range",
};

const toApi = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

/** Shared period state + resolved {from,to} range for delivery report screens. */
export function usePeriod(initial: Period = "all") {
  const [period, setPeriod] = useState<Period>(initial);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const range = useMemo<{ from?: string; to?: string }>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    if (period === "today") return { from: toApi(new Date(y, m, d, 0, 0, 0)), to: toApi(new Date(y, m, d, 23, 59, 59)) };
    if (period === "month") return { from: toApi(new Date(y, m, 1)), to: toApi(new Date(y, m + 1, 0, 23, 59, 59)) };
    if (period === "year") return { from: toApi(new Date(y, 0, 1)), to: toApi(new Date(y, 11, 31, 23, 59, 59)) };
    if (period === "range" && start && end) return { from: toApi(new Date(`${start}T00:00:00`)), to: toApi(new Date(`${end}T23:59:59`)) };
    return {};
  }, [period, start, end]);

  const label = period === "range" && start && end ? `${start} to ${end}` : PERIOD_LABELS[period];

  return { period, setPeriod, start, setStart, end, setEnd, range, label };
}

export type PeriodState = ReturnType<typeof usePeriod>;

export default function PeriodFilter({ state, fetching }: { state: PeriodState; fetching?: boolean }) {
  const { period, setPeriod, start, setStart, end, setEnd } = state;
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 bg-gray-800 border border-gray-700 rounded-lg p-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">Period</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="px-3 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm"
        >
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
          ))}
        </select>
      </div>
      {period === "range" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Start</label>
            <input type="date" value={start} max={end || undefined} onChange={(e) => setStart(e.target.value)}
              className="px-3 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">End</label>
            <input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)}
              className="px-3 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm" />
          </div>
        </>
      )}
      {fetching && <span className="text-xs text-gray-400 ml-auto">Updating…</span>}
    </div>
  );
}
