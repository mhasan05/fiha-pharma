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
  return raw.replace(/\/+$/, "");
}

export const API_BASE_URL: string = resolveApiBaseUrl();

/** Build an absolute URL for a media path returned by the backend.
 *  The API serves images as relative paths (e.g. "/media/..."), so prefix the
 *  base URL; pass-through anything already absolute. Returns null when empty. */
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
