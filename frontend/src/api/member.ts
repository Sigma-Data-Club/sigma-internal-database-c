import { apiClient } from "./client";
import type {
  Member,
  MemberEventsSummary,
  MemberListResponse,
  MemberRole,
  MemberRolesResponse,
  MemberUpdatePayload,
  ReplaceMemberRolesPayload,
} from "../types/member";
import type { Event, EventListResponse } from "../types/event";

type PaginationParams = {
  limit?: number;
  offset?: number;
};

export async function listMembers(
  params: PaginationParams = {},
): Promise<MemberListResponse> {
  const response = await apiClient.get<MemberListResponse>("/members", {
    params: {
      limit: params.limit ?? 100,
      offset: params.offset ?? 0,
    },
  });

  return response.data;
}

export async function getMe(): Promise<Member> {
  const response = await apiClient.get<Member>("/members/me");
  return response.data;
}

export async function getMember(memberId: string | number): Promise<Member> {
  const response = await apiClient.get<Member>(`/members/${memberId}`);
  return response.data;
}

export async function updateMember(
  memberId: string | number,
  payload: MemberUpdatePayload,
): Promise<Member> {
  const response = await apiClient.patch<Member>(
    `/members/${memberId}`,
    payload,
  );
  return response.data;
}

export async function activateMember(
  memberId: string | number,
): Promise<{ status: string }> {
  const response = await apiClient.post<{ status: string }>(
    `/members/${memberId}/activate`,
  );
  return response.data;
}

export async function deactivateMember(
  memberId: string | number,
): Promise<{ status: string }> {
  const response = await apiClient.post<{ status: string }>(
    `/members/${memberId}/deactivate`,
  );
  return response.data;
}

export async function getMemberRoles(
  memberId: string | number,
): Promise<MemberRole[]> {
  const response = await apiClient.get<MemberRolesResponse>(
    `/members/${memberId}/roles`,
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.items ?? [];
}

export async function replaceMemberRoles(
  memberId: string | number,
  payload: ReplaceMemberRolesPayload,
): Promise<MemberRole[] | { status: string }> {
  const response = await apiClient.put<MemberRole[] | { status: string }>(
    `/members/${memberId}/roles`,
    payload,
  );
  return response.data;
}

export async function addMemberRole(
  memberId: string | number,
  roleId: string | number,
): Promise<MemberRole | { status: string }> {
  const response = await apiClient.post<MemberRole | { status: string }>(
    `/members/${memberId}/roles/${roleId}`,
  );
  return response.data;
}

export async function removeMemberRole(
  memberId: string | number,
  roleId: string | number,
): Promise<{ status: string }> {
  const response = await apiClient.delete<{ status: string }>(
    `/members/${memberId}/roles/${roleId}`,
  );
  return response.data;
}

export async function listMemberEvents(
  memberId: string | number,
  params: PaginationParams = {},
): Promise<EventListResponse | Event[]> {
  const response = await apiClient.get<EventListResponse | Event[]>(
    `/members/${memberId}/events`,
    {
      params: {
        limit: params.limit ?? 100,
        offset: params.offset ?? 0,
      },
    },
  );

  return response.data;
}

export async function getMemberEventsSummary(
  memberId: string | number,
): Promise<MemberEventsSummary> {
  const response = await apiClient.get<MemberEventsSummary>(
    `/members/${memberId}/events/summary`,
  );
  return response.data;
}