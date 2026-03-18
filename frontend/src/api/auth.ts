import { apiClient } from "./client";
import type { CurrentMember, LoginRequest, LoginResponse } from "../types/auth";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/auth/login", payload);
  return response.data;
}

export async function getMe(): Promise<CurrentMember> {
  const response = await apiClient.get<CurrentMember>("/members/me");
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}