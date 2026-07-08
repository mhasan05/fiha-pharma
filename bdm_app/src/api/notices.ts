import { api } from "./client";
import type { ApiEnvelope, Notice } from "@/types/api";

/** GET /announcement/notices/ — active notices. */
export async function getNotices(): Promise<Notice[]> {
  const { data } = await api.get<ApiEnvelope<Notice[]> | Notice[]>("/announcement/notices/");
  if (Array.isArray(data)) return data;
  return data.data ?? [];
}
