import { colorScheme } from "nativewind";
import { create } from "zustand";

import { StorageKeys } from "@/lib/constants";
import { secureStorage } from "@/lib/storage";

export type ThemeMode = "light" | "dark";
export type Lang = "en" | "bn";

interface PrefsState {
  mode: ThemeMode;
  lang: Lang;
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => void;
  setLang: (lang: Lang) => void;
}

export const usePrefsStore = create<PrefsState>((set) => ({
  mode: "light",
  lang: "en",

  hydrate: async () => {
    try {
      const [m, l] = await Promise.all([
        secureStorage.getItem(StorageKeys.theme),
        secureStorage.getItem(StorageKeys.lang),
      ]);
      const mode: ThemeMode = m === "dark" ? "dark" : "light";
      const lang: Lang = l === "bn" ? "bn" : "en";
      colorScheme.set(mode);
      set({ mode, lang });
    } catch {
      colorScheme.set("light");
    }
  },

  setMode: (mode) => {
    colorScheme.set(mode);
    set({ mode });
    void secureStorage.setItem(StorageKeys.theme, mode);
  },

  setLang: (lang) => {
    set({ lang });
    void secureStorage.setItem(StorageKeys.lang, lang);
  },
}));
