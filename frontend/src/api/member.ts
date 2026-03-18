import { apiClient } from "./client";
import type { Member, MemberListResponse } from "../types/member";

type ListMembersParams = {
  limit?: number;
  offset?: number;
};

export async function listMembers(
  params: ListMembersParams = {},
): Promise<MemberListResponse> {
  const response = await apiClient.get<MemberListResponse>("/members", {
    params: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  });

  return response.data;
}

export async function getMember(memberId: string | number): Promise<Member> {
  const response = await apiClient.get<Member>(`/members/${memberId}`);
  return response.data;
}