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