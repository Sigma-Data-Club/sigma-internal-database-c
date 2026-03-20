import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { useSettings } from "../../../context/SettingsContext";
import type { AccentColor, TextSize, ThemeMode } from "../../../types/settings";
import { settingsStrings as t } from "../utils/settingsStrings";

const accentPreviewMap: Record<AccentColor, string> = {
  blue: "#2563eb",
  green: "#16a34a",
  purple: "#9333ea",
  orange: "#ea580c",
  red: "#dc2626",
};

export default function SettingsPage() {
  const theme = useTheme();
  const { settings, setThemeMode, setAccentColor, setTextSize, resetSettings } =
    useSettings();

  const themeOptions: ThemeMode[] = ["light", "dark", "system"];
  const textSizeOptions: TextSize[] = ["small", "medium", "large"];
  const accentOptions: AccentColor[] = ["blue", "green", "purple", "orange", "red"];

  return (
    <Box sx={{ px: 3, py: 3, maxWidth: 1000 }}>
      <Typography variant="h3" fontWeight={700} gutterBottom>
        {t.title}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t.description}
      </Typography>

      {/* THEME */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {t.theme.title}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {t.theme.description}
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {themeOptions.map((option) => {
              const selected = settings.themeMode === option;

              return (
                <Chip
                  key={option}
                  label={t.theme.options[option]}
                  clickable
                  color={selected ? "primary" : "default"}
                  variant={selected ? "filled" : "outlined"}
                  onClick={() => setThemeMode(option)}
                  sx={{
                    fontWeight: 600,
                    px: 1,
                    py: 2.5,
                  }}
                />
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      {/* TEXT SIZE */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {t.textSize.title}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {t.textSize.description}
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {textSizeOptions.map((option) => {
              const selected = settings.textSize === option;

              return (
                <Chip
                  key={option}
                  label={t.textSize.options[option]}
                  clickable
                  color={selected ? "primary" : "default"}
                  variant={selected ? "filled" : "outlined"}
                  onClick={() => setTextSize(option)}
                  sx={{
                    fontWeight: 600,
                    px: 1,
                    py: 2.5,
                  }}
                />
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      {/* ACCENT */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {t.accent.title}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {t.accent.description}
          </Typography>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {accentOptions.map((option) => {
              const selected = settings.accentColor === option;
              const previewColor = accentPreviewMap[option];

              return (
                <Button
                  key={option}
                  variant={selected ? "contained" : "outlined"}
                  onClick={() => setAccentColor(option)}
                  sx={{
                    minWidth: 120,
                    justifyContent: "flex-start",
                    fontWeight: 600,
                    borderColor: selected ? previewColor : theme.palette.divider,
                    backgroundColor: selected
                      ? previewColor
                      : alpha(previewColor, theme.palette.mode === "dark" ? 0.12 : 0.06),
                    color: selected
                      ? theme.palette.getContrastText(previewColor)
                      : theme.palette.text.primary,
                  }}
                >
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      backgroundColor: previewColor,
                      mr: 1,
                    }}
                  />
                  {t.accent.options[option]}
                </Button>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      {/* PREVIEW */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {t.preview.title}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {t.preview.description}
          </Typography>

          <Stack direction="row" spacing={1.5}>
            <Button variant="contained">{t.preview.primaryButton}</Button>
            <Button variant="outlined">{t.preview.secondaryButton}</Button>
          </Stack>
        </CardContent>
      </Card>

      <Button variant="outlined" onClick={resetSettings}>
        {t.reset}
      </Button>
    </Box>
  );
}