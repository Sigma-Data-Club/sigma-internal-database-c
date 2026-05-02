export type Member = {
  member_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  academic_program_id: number | null;
  study_year: number | null;
  is_active: boolean;
};

export type MemberListResponse = {
  items: Member[];
  total: number;
  limit: number;
  offset: number;
};

export type MemberUpdatePayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  academic_program_id?: number | null;
  study_year?: number | null;
  is_active?: boolean;
};

export type MemberRole = {
  role_id: number;
  role_name?: string | null;
  name?: string | null;
  code?: string | null;
};

export type MemberRolesResponse =
  | MemberRole[]
  | {
      items: MemberRole[];
      total?: number;
      limit?: number;
      offset?: number;
    };

export type ReplaceMemberRolesPayload = {
  role_ids: number[];
};

export type MemberEventsSummary = Record<string, unknown>;