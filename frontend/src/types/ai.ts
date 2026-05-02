export type AIMessageRole = "user" | "assistant";

export type AIMessage = {
  role: AIMessageRole;
  content: string;
};

export type AIToolCall = {
  name: string;
  ok: boolean;
  data?: Record<string, unknown> | Record<string, unknown>[] | string[] | null;
  error?: string | null;
};

export type AIChatRequest = {
  messages: AIMessage[];
  include_debug?: boolean;
};

export type AIChatResponse = {
  answer: string;
  tools_used: string[];
  debug?: AIToolCall[] | null;
};

export type AIChatMessage = {
  id: string;
  role: AIMessageRole;
  content: string;
  toolsUsed?: string[];
};