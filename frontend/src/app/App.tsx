import { useEffect, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { RouterProvider } from "react-router-dom";

import { router } from "../router";
import { useSettings } from "../context/SettingsContext";

function resolveThemeMode(mode: "light" | "dark" | "system"): "light" | "dark" {
  if (mode === "light" || mode === "dark") {
    return mode;
  }

  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return "light";
}

const accentPalette = {
  blue: "#2563eb",
  green: "#16a34a",
  purple: "#9333ea",
  orange: "#ea580c",
  red: "#dc2626",
} as const;

export default function App() {
  const { settings } = useSettings();
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">(
    resolveThemeMode(settings.themeMode),
  );

  useEffect(() => {
    const updateMode = () => {
      setResolvedMode(resolveThemeMode(settings.themeMode));
    };

    updateMode();

    if (settings.themeMode !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", updateMode);

    return () => {
      media.removeEventListener("change", updateMode);
    };
  }, [settings.themeMode]);

  const theme = useMemo(() => {
    const primaryMain = accentPalette[settings.accentColor];

    return createTheme({
      palette: {
        mode: resolvedMode,
        primary: {
          main: primaryMain,
        },
      },
      typography: {
        fontSize:
          settings.textSize === "small"
            ? 13
            : settings.textSize === "large"
              ? 17
              : 15,
      },
      shape: {
        borderRadius: 10,
      },
    });
  }, [resolvedMode, settings.accentColor, settings.textSize]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}