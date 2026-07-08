import { api } from "./client";
import type { ApiEnvelope, AppNotification, Notice } from "@/types/api";

export async function getNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get<ApiEnvelope<AppNotification[]>>("/user/notifications/");
  return data.data;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/user/notifications/mark_as_read/${id}/`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/user/notifications/mark_all_as_read/");
}

export async function getNotices(): Promise<Notice[]> {
  const { data } = await api.get<ApiEnvelope<Notice[]>>("/announcement/notices/");
  return data.data;
}
