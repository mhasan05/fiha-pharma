import * as FileSystem from "expo-file-system";

import { api, getAccessToken } from "./client";
import { API_BASE_URL } from "@/lib/env";
import type { ApiEnvelope, AuthUser, LoginResponse } from "@/types/api";

/** POST /auth/login/ — phone + password. Returns { access_token, data: user }. */
export async function login(phone: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login/", { phone, password });
  return data;
}

/** GET /auth/user_profile/ — the authenticated user's profile.
 *  Tolerates either a bare user object or a { data: user } envelope. */
export async function getProfile(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser | ApiEnvelope<AuthUser>>("/auth/user_profile/");
  return "data" in data ? data.data : data;
}

/** PATCH /auth/user_profile/ — update editable profile fields. */
export async function updateProfile(payload: Partial<AuthUser>): Promise<AuthUser> {
  const { data } = await api.patch<AuthUser>("/auth/user_profile/", payload);
  return data;
}

/** PATCH /auth/user_profile/ — upload a profile image (and optional extra fields).
 *  Uses expo-file-system's uploadAsync, which reads the file natively and builds
 *  a correct multipart body. This is far more reliable in React Native than
 *  axios/fetch + FormData, which mangle the file part so the server rejects it. */
export async function uploadProfileImage(uri: string, fields?: Record<string, string>): Promise<AuthUser> {
  const token = getAccessToken();
  const res = await FileSystem.uploadAsync(`${API_BASE_URL}/auth/user_profile/`, uri, {
    httpMethod: "PATCH",
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: "image",
    mimeType: "image/jpeg",
    parameters: fields,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  let data: (AuthUser & { message?: string; errors?: Record<string, string[]> }) | ApiEnvelope<AuthUser> = {} as AuthUser;
  try {
    data = JSON.parse(res.body || "{}");
  } catch {
    // non-JSON response
  }
  if (res.status < 200 || res.status >= 300) {
    const err = data as { message?: string; errors?: Record<string, string[]> };
    const fieldErr = err.errors ? Object.values(err.errors)[0]?.[0] : undefined;
    throw new Error(err.message || fieldErr || "Image upload failed.");
  }
  return "data" in data ? data.data : (data as AuthUser);
}

/** POST /auth/change_password/ — change my password by supplying the current one. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post("/auth/change_password/", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}
