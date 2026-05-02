export type ThemeMode = "light" | "dark" | "system";
export type AccentColor = "blue" | "green" | "purple" | "orange" | "red";
export type TextSize = "small" | "medium" | "large";

export interface AppSettings {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  textSize: TextSize;
}

export interface SettingsContextValue {
  settings: AppSettings;
  setThemeMode: (value: ThemeMode) => void;
  setAccentColor: (value: AccentColor) => void;
  setTextSize: (value: TextSize) => void;
  resetSettings: () => void;
}