import { create } from "zustand";

import * as authApi from "@/api/auth";
import {
  getApiErrorMessage,
  setAccessToken,
  setUnauthorizedHandler,
} from "@/api/client";
import { ALLOWED_ROLE, StorageKeys } from "@/lib/constants";
import { registerForPush, unregisterForPush } from "@/lib/push";
import { secureStorage } from "@/lib/storage";
import type { AuthUser } from "@/types/api";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  /** True until the persisted session has been loaded on app start. */
  hydrating: boolean;
  signingIn: boolean;
  hydrate: () => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  hydrating: true,
  signingIn: false,

  /** Restore token + user from secure storage on launch. */
  hydrate: async () => {
    // Any 401 from now on clears the session.
    setUnauthorizedHandler(() => {
      void get().logout();
    });

    try {
      const [token, userJson] = await Promise.all([
        secureStorage.getItem(StorageKeys.accessToken),
        secureStorage.getItem(StorageKeys.user),
      ]);
      if (token && userJson) {
        const user = JSON.parse(userJson) as AuthUser;
        setAccessToken(token);
        set({ token, user });
        void registerForPush();
      }
    } catch {
      // Corrupt/missing session — start logged out.
      setAccessToken(null);
    } finally {
      set({ hydrating: false });
    }
  },

  login: async (phone, password) => {
    set({ signingIn: true });
    try {
      const res = await authApi.login(phone, password);
      const token = res.access_token ?? res.access ?? res.token ?? null;
      if (!token) {
        throw new Error("No access token returned by the server.");
      }

      // Make the token available before fetching the profile.
      setAccessToken(token);

      // The login response carries the user in `data`; fall back to the profile endpoint.
      const user = res.data ?? res.user ?? (await authApi.getProfile());

      if (user.role !== ALLOWED_ROLE) {
        setAccessToken(null);
        throw new Error("This app is for delivery agents only.");
      }
      if (!user.is_active) {
        setAccessToken(null);
        throw new Error("Your account is inactive. Contact the admin.");
      }

      await Promise.all([
        secureStorage.setItem(StorageKeys.accessToken, token),
        secureStorage.setItem(StorageKeys.user, JSON.stringify(user)),
      ]);
      set({ token, user });
      void registerForPush();
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Login failed. Check your credentials."));
    } finally {
      set({ signingIn: false });
    }
  },

  logout: async () => {
    // Detach this device's push token first (needs the token to still be set).
    await unregisterForPush();
    setAccessToken(null);
    await Promise.all([
      secureStorage.removeItem(StorageKeys.accessToken),
      secureStorage.removeItem(StorageKeys.user),
    ]);
    set({ user: null, token: null });
  },

  setUser: (user) => {
    set({ user });
    void secureStorage.setItem(StorageKeys.user, JSON.stringify(user));
  },
}));
