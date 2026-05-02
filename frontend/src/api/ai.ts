import { apiClient } from "./client";
import type { AIChatRequest, AIChatResponse } from "../types/ai";

export async function sendAIChatMessage(
  payload: AIChatRequest,
): Promise<AIChatResponse> {
  const response = await apiClient.post<AIChatResponse>("/ai/chat", payload);
  return response.data;
}