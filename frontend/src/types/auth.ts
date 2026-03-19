export type LoginRequest = {
  email: string;
  password: string;
  device_label?: string | null;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type AuthRole = {
  role_id: number;
  name: string;
};

export type AuthAccessProfile = {
  member_id: number;
  email: string;
  is_active: boolean;
  roles: AuthRole[];
  permissions: string[];
};

export type CurrentMember = {
  member_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  academic_program_id: number | null;
  study_year: number | null;
  is_active: boolean;
};

export type AuthUser = {
  member_id: number;
  email: string;
  is_active: boolean;
  roles: AuthRole[];
  permissions: string[];
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  academic_program_id?: number | null;
  study_year?: number | null;
};