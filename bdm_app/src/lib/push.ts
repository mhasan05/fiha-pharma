import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "@/api/client";

// Show notifications as a banner + sound even while the app is foregrounded.
// Native only — skip on web where push isn't configured.
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Avoid re-POSTing the same token every app open.
let lastRegistered: string | null = null;

/** This device's native FCM registration token (Android) / APNs token (iOS).
 *  No Expo project needed — the token comes straight from Firebase via the
 *  bundled google-services.json, and the backend pushes to it through FCM. */
async function getDeviceToken(): Promise<string | null> {
  try {
    const res = await Notifications.getDevicePushTokenAsync();
    return typeof res.data === "string" ? res.data : String(res.data);
  } catch {
    return null;
  }
}

/**
 * Ask for permission, get this device's FCM push token, and register it with
 * the backend so the server can push order-status/delivery updates.
 * Native-only (web push isn't configured). Safe to call repeatedly.
 */
export async function registerForPush(): Promise<void> {
  if (Platform.OS === "web" || !Device.isDevice) return;

  // Android requires a channel for notifications to be shown.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0F9D6E",
    });
  }

  let status = (await Notifications.getPermissionsAsync()).status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return;

  const token = await getDeviceToken();
  if (!token || token === lastRegistered) return;

  // Claim the token before awaiting so a second concurrent call (e.g. login +
  // hydrate firing together) doesn't double-POST the same token.
  lastRegistered = token;
  try {
    await api.post("/user/push-token/", { token, platform: Platform.OS });
  } catch {
    // Registration is best-effort; allow a retry on the next app open.
    lastRegistered = null;
  }
}

/** Remove this device's token on logout so it stops receiving pushes. */
export async function unregisterForPush(): Promise<void> {
  if (Platform.OS === "web" || !Device.isDevice) return;
  const token = await getDeviceToken();
  if (!token) return;
  try {
    await api.delete("/user/push-token/", { data: { token } });
  } catch {
    // ignore
  } finally {
    lastRegistered = null;
  }
}
