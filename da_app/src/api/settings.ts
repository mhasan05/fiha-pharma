import Constants from "expo-constants";

import { api } from "./client";
import type { AppUpdateResponse } from "@/types/api";

/** This app's identifier on the backend's app-release track. */
const APP = "da";

/** GET /settings/app-update/latest/?app=da — whether a newer Rider-app build is
 *  available. Sends this build's versionCode so the backend can compare. */
export async function getLatestAppUpdate(): Promise<AppUpdateResponse> {
  const versionCode = Number(
    (Constants.expoConfig?.android as { versionCode?: number } | undefined)?.versionCode ?? 0,
  );
  const { data } = await api.get<AppUpdateResponse>("/settings/app-update/latest/", {
    params: versionCode ? { app: APP, version_code: versionCode } : { app: APP },
  });
  return data;
}
