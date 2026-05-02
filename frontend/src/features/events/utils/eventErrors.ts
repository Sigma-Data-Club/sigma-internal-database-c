import axios from "axios";

export function extractEventApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const detail = error.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message === "string" &&
    detail.message.trim()
  ) {
    return detail.message;
  }

  return fallbackMessage;
}