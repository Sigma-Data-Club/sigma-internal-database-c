import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type {
  AccentColor,
  AppSettings,
  SettingsContextValue,
  TextSize,
  ThemeMode,
} from "../types/settings";
import { DEFAULT_SETTINGS } from "../features/settings/utils/settingsDefaults";
import {
  loadSettings,
  saveSettings,
} from "../features/settings/utils/settingsStorage";

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function getResolvedTheme(themeMode: ThemeMode): "light" | "dark" {
  if (themeMode === "light" || themeMode === "dark") {
    return themeMode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyAccentColor(accentColor: AccentColor): void {
  const root = document.documentElement;

  const palette: Record<AccentColor, { primary: string; primaryHover: string; ring: string }> = {
    blue: {
      primary: "#2563eb",
      primaryHover: "#1d4ed8",
      ring: "rgba(37, 99, 235, 0.35)",
    },
    green: {
      primary: "#16a34a",
      primaryHover: "#15803d",
      ring: "rgba(22, 163, 74, 0.35)",
    },
    purple: {
      primary: "#9333ea",
      primaryHover: "#7e22ce",
      ring: "rgba(147, 51, 234, 0.35)",
    },
    orange: {
      primary: "#ea580c",
      primaryHover: "#c2410c",
      ring: "rgba(234, 88, 12, 0.35)",
    },
    red: {
      primary: "#dc2626",
      primaryHover: "#b91c1c",
      ring: "rgba(220, 38, 38, 0.35)",
    },
  };

  const selected = palette[accentColor];

  root.style.setProperty("--color-primary", selected.primary);
  root.style.setProperty("--color-primary-hover", selected.primaryHover);
  root.style.setProperty("--color-primary-ring", selected.ring);
}

function applyTextSize(textSize: TextSize): void {
  const root = document.documentElement;

  const sizes: Record<TextSize, string> = {
    small: "14px",
    medium: "16px",
    large: "18px",
  };

  root.style.fontSize = sizes[textSize];
  root.setAttribute("data-text-size", textSize);
}

function applyTheme(themeMode: ThemeMode): void {
  const root = document.documentElement;
  const resolvedTheme = getResolvedTheme(themeMode);

  root.setAttribute("data-theme", resolvedTheme);

  if (resolvedTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  root.style.colorScheme = resolvedTheme;
}

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  useEffect(() => {
    applyTheme(settings.themeMode);
    applyAccentColor(settings.accentColor);
    applyTextSize(settings.textSize);
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (settings.themeMode !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [settings.themeMode]);

  const setThemeMode = useCallback((value: ThemeMode) => {
    setSettings((prev) => ({ ...prev, themeMode: value }));
  }, []);

  const setAccentColor = useCallback((value: AccentColor) => {
    setSettings((prev) => ({ ...prev, accentColor: value }));
  }, []);

  const setTextSize = useCallback((value: TextSize) => {
    setSettings((prev) => ({ ...prev, textSize: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      setThemeMode,
      setAccentColor,
      setTextSize,
      resetSettings,
    }),
    [settings, setThemeMode, setAccentColor, setTextSize, resetSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }

  return context;
}