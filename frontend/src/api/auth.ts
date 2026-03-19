import { apiClient } from "./client";
import type {
  AuthAccessProfile,
  CurrentMember,
  LoginRequest,
  LoginResponse,
} from "../types/auth";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/auth/login", payload);
  return response.data;
}

export async function getMe(): Promise<CurrentMember> {
  const response = await apiClient.get<CurrentMember>("/members/me");
  return response.data;
}

export async function getMyAccessProfile(): Promise<AuthAccessProfile> {
  const response = await apiClient.get<AuthAccessProfile>("/auth/me/access-profile");
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}