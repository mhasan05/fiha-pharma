import { api } from "./client";
import type { ApiEnvelope, AppNotification } from "@/types/api";

/** GET /user/notifications/ — the current user's in-app notifications (newest first). */
export async function getNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get<ApiEnvelope<AppNotification[]>>("/user/notifications/");
  return data.data ?? [];
}

/** POST /user/notifications/mark_as_read/<id>/ */
export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/user/notifications/mark_as_read/${id}/`);
}

/** POST /user/notifications/mark_all_as_read/ */
export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/user/notifications/mark_all_as_read/");
}
