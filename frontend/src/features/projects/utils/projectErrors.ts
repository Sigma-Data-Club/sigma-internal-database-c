import axios from "axios";

export function extractProjectApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data as
    | {
        message?: unknown;
        detail?: unknown;
      }
    | undefined;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (
    data?.detail &&
    typeof data.detail === "object" &&
    !Array.isArray(data.detail) &&
    typeof (data.detail as { message?: unknown }).message === "string"
  ) {
    return (data.detail as { message: string }).message;
  }

  if (Array.isArray(data?.detail)) {
    const text = data.detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
          const record = item as {
            msg?: unknown;
            loc?: unknown;
          };

          const msg =
            typeof record.msg === "string" ? record.msg : "Error de validación";

          const loc = Array.isArray(record.loc)
            ? record.loc.map((part) => String(part)).join(".")
            : "";

          return loc ? `${loc}: ${msg}` : msg;
        }

        return "Error de validación";
      })
      .join("; ");

    if (text) {
      return text;
    }
  }

  if (typeof data?.message === "string") {
    return data.message;
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
}