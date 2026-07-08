// Web stub: push notifications are native-only. Metro resolves this file for
// web (platform extension), so `expo-notifications` never enters the web bundle.

export async function registerForPush(): Promise<void> {
  // no-op on web
}

export async function unregisterForPush(): Promise<void> {
  // no-op on web
}
