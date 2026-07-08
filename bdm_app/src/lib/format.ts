/** Formatting helpers shared across screens. */

/** Money for summaries/totals, e.g. ৳1,250.50 (two decimals, like the design). */
export function formatCurrency(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  const safe = Number.isFinite(n) ? (n as number) : 0;
  return `৳${safe.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Product price shown on cards/detail, e.g. ৳70.0 (one decimal, like the design). */
export function formatPrice(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  const safe = Number.isFinite(n) ? (n as number) : 0;
  return `৳${safe.toLocaleString("en-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

/** Formats an ISO date string as a short readable date, e.g. 27 Jun 2026. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Formats an ISO date string with time, e.g. 27 Jun 2026, 14:05. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
