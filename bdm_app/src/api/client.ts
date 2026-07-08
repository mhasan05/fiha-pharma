import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL } from "@/lib/env";

/** In-memory access token, kept in sync with the auth store / SecureStore. */
let accessToken: string | null = null;

/** Called when a request returns 401 so the app can clear the session. */
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Current bearer token — used by fetch-based uploads that bypass axios. */
export function getAccessToken(): string | null {
  return accessToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // Generous timeout for slow 2G/3G networks (product lists carry images).
  timeout: 30_000,
  headers: { Accept: "application/json" },
});

// Attach the bearer token to every request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

// On 401 the backend has no refresh route, so we clear the session.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

/** First usable message from a field-error map: a plain string or the first
 *  item of a string array. Ignores the envelope's `status` key. */
function pickFieldError(obj?: Record<string, unknown>): string | undefined {
  if (!obj) return undefined;
  for (const [k, v] of Object.entries(obj)) {
    if (k === "status") continue;
    if (typeof v === "string" && v.trim()) return v;
    if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  }
  return undefined;
}

/** Extracts a human-readable message from a DRF error response. */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; detail?: string; error?: string; [k: string]: unknown }
      | undefined;
    if (data) {
      if (typeof data.message === "string") return data.message;
      if (typeof data.detail === "string") return data.detail;
      if (typeof data.error === "string") return data.error;
      // Field errors live either at the top level or inside `errors`, and the
      // backend uses both arrays ({ field: ["msg"] }) and plain strings
      // ({ items: "Not enough stock…" }). Skip the envelope's `status` key.
      const nested = data.errors && typeof data.errors === "object" ? (data.errors as Record<string, unknown>) : undefined;
      const fieldMsg = pickFieldError(nested) ?? pickFieldError(data);
      if (fieldMsg) return fieldMsg;
    }
    if (error.code === "ECONNABORTED") return "Request timed out. Check your connection.";
    if (error.message === "Network Error") return "Cannot reach the server. Check the API URL.";
  }
  return fallback;
}
