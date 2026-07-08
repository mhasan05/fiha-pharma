import Constants from "expo-constants";

/**
 * Resolves the backend base URL from the public env var.
 * Never hardcode the API domain — set EXPO_PUBLIC_API_BASE_URL in `.env`.
 */
function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)
    ?.apiBaseUrl;

  const raw = fromEnv ?? fromExtra;
  if (!raw || raw.includes("${")) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env and set the backend URL."
    );
  }
  // Strip any trailing slash so we can join paths predictably.
  const url = raw.replace(/\/+$/, "");
  // Fail fast on a malformed URL (e.g. a typo'd scheme) instead of at request time.
  try {
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    throw new Error(`EXPO_PUBLIC_API_BASE_URL is not a valid URL: "${raw}"`);
  }
  return url;
}

export const API_BASE_URL: string = resolveApiBaseUrl();

/** Build an absolute URL for a media path returned by the backend.
 *  The API serves images as relative paths (e.g. "/media/..."), so prefix the
 *  base URL; pass-through anything already absolute. Returns null when empty.
 *
 *  Pass `version` (e.g. the record's `updated_on`) for cache-busting: it's added
 *  as `?v=...` so an edited image gets a fresh URL — the image cache serves the
 *  new file instead of a stale one — while unchanged images keep their URL (and
 *  their fast cache hit). */
export function mediaUrl(path?: string | null, version?: string | number | null): string | null {
  if (!path) return null;
  const base = /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  if (version == null || version === "") return base;
  // Prefer a compact epoch stamp for date strings; fall back to the raw value.
  const parsed = typeof version === "string" ? Date.parse(version) : Number(version);
  const v = Number.isFinite(parsed) ? parsed : version;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}v=${encodeURIComponent(String(v))}`;
}
