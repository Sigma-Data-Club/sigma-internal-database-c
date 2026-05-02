import { useMemo, useRef, useState } from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import type { AxiosError } from "axios";

import { sendAIChatMessage } from "../../../api/ai";
import type { AIChatMessage } from "../../../types/ai";
import { aiText } from "../utils/aiStrings";

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{
    detail?: string | { error?: { message?: string } };
  }>;

  const detail = axiosError.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (detail?.error?.message) {
    return detail.error.message;
  }

  return aiText.fallbackError;
}

export default function AiChatPage() {
  const theme = useTheme();

  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const trimmedMessage = inputValue.trim();
  const canSend = trimmedMessage.length > 0 && !isSending;

  const helperText = useMemo(() => {
    if (trimmedMessage.length > 3900) {
      return `${trimmedMessage.length}/4000`;
    }

    return " ";
  }, [trimmedMessage.length]);

  const assistantBubbleBg =
    theme.palette.mode === "dark"
      ? alpha(theme.palette.primary.main, 0.14)
      : alpha(theme.palette.primary.main, 0.08);

  const assistantIconBg =
    theme.palette.mode === "dark"
      ? alpha(theme.palette.primary.main, 0.22)
      : alpha(theme.palette.primary.main, 0.12);

const handleSend = async () => {
  if (!canSend) {
    return;
  }

  const userMessage: AIChatMessage = {
    id: createMessageId(),
    role: "user",
    content: trimmedMessage,
  };

  const nextMessages = [...messages, userMessage];

  setMessages(nextMessages);
  setInputValue("");
  setErrorMessage(null);
  setIsSending(true);

  try {
    const response = await sendAIChatMessage({
      messages: nextMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      include_debug: false,
    });

    const assistantMessage: AIChatMessage = {
      id: createMessageId(),
      role: "assistant",
      content: response.answer,
      toolsUsed: response.tools_used,
    };

    setMessages((current) => [...current, assistantMessage]);
  } catch (error) {
    setErrorMessage(getErrorMessage(error));
  } finally {
    setIsSending(false);
    inputRef.current?.focus();
  }
};

  const handleClear = () => {
    setMessages([]);
    setErrorMessage(null);
    inputRef.current?.focus();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Box>
              <Typography variant="h4" gutterBottom>
                {aiText.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {aiText.subtitle}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleClear}
              disabled={messages.length === 0 || isSending}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              {aiText.clear}
            </Button>
          </Stack>
        </Box>

        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage(null)}>
            <Typography fontWeight={600}>{aiText.errorTitle}</Typography>
            <Typography variant="body2">{errorMessage}</Typography>
          </Alert>
        )}

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box
                sx={{
                  minHeight: 420,
                  maxHeight: "60vh",
                  overflowY: "auto",
                  pr: 1,
                }}
              >
                {messages.length === 0 ? (
                  <Stack
                    spacing={1.5}
                    alignItems="center"
                    justifyContent="center"
                    sx={{ minHeight: 360, textAlign: "center" }}
                  >
                    <SmartToyIcon color="primary" sx={{ fontSize: 48 }} />
                    <Typography variant="h6">{aiText.emptyTitle}</Typography>
                    <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
                      {aiText.emptyDescription}
                    </Typography>
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    {messages.map((message) => {
                      const isUser = message.role === "user";

                      return (
                        <Box
                          key={message.id}
                          sx={{
                            display: "flex",
                            justifyContent: isUser ? "flex-end" : "flex-start",
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="flex-start"
                            sx={{
                              maxWidth: { xs: "100%", md: "75%" },
                              flexDirection: isUser ? "row-reverse" : "row",
                            }}
                          >
                            <Box
                              sx={{
                                mt: 0.5,
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: isUser
                                  ? "primary.main"
                                  : assistantIconBg,
                                color: isUser
                                  ? "primary.contrastText"
                                  : "primary.main",
                              }}
                            >
                              {isUser ? (
                                <PersonIcon fontSize="small" />
                              ) : (
                                <SmartToyIcon fontSize="small" />
                              )}
                            </Box>

                            <Box>
                              <Box
                                sx={{
                                  px: 2,
                                  py: 1.5,
                                  borderRadius: 3,
                                  bgcolor: isUser
                                    ? "primary.main"
                                    : assistantBubbleBg,
                                  color: isUser
                                    ? "primary.contrastText"
                                    : "text.primary",
                                  border: isUser
                                    ? "none"
                                    : `1px solid ${alpha(
                                        theme.palette.primary.main,
                                        0.18,
                                      )}`,
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                <Typography variant="body1">
                                  {message.content}
                                </Typography>
                              </Box>

                              {!isUser &&
                                message.toolsUsed &&
                                message.toolsUsed.length > 0 && (
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                    useFlexGap
                                    sx={{ mt: 1 }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ alignSelf: "center" }}
                                    >
                                      {aiText.toolsUsed}:
                                    </Typography>
                                    {message.toolsUsed.map((tool) => (
                                      <Chip
                                        key={tool}
                                        label={tool}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                      />
                                    ))}
                                  </Stack>
                                )}
                            </Box>
                          </Stack>
                        </Box>
                      );
                    })}

                    {isSending && (
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <CircularProgress size={20} />
                        <Typography color="text.secondary">
                          {aiText.sending}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                )}
              </Box>

              <Divider />

              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <TextField
                  inputRef={inputRef}
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder={aiText.placeholder}
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={5}
                  inputProps={{ maxLength: 4000 }}
                  helperText={helperText}
                  disabled={isSending}
                />

                <IconButton
                  color="primary"
                  onClick={() => void handleSend()}
                  disabled={!canSend}
                  sx={{
                    mt: 1,
                    border: 1,
                    borderColor: "primary.main",
                  }}
                >
                  {isSending ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}