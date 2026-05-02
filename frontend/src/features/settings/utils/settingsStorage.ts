import type { AppSettings } from "../../../types/settings";
import { DEFAULT_SETTINGS } from "./settingsDefaults";

const SETTINGS_STORAGE_KEY = "app_settings";

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<AppSettings>;

    return {
      themeMode: parsed.themeMode ?? DEFAULT_SETTINGS.themeMode,
      accentColor: parsed.accentColor ?? DEFAULT_SETTINGS.accentColor,
      textSize: parsed.textSize ?? DEFAULT_SETTINGS.textSize,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}