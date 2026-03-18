export type ProjectStatus =
  | "planned"
  | "active"
  | "finished"
  | "archived";

export type ProjectApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type Project = {
  project_id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  started_at: string | null;
  finished_at: string | null;
};

export type ProjectListResponse = {
  items: Project[];
  total: number;
  limit: number;
  offset: number;
};

export type ProjectStats = {
  members_total: number;
  members_active: number;
  applications_pending: number;
  finance_income_total: number | null;
  finance_expense_total: number | null;
  finance_balance: number | null;
};

export type ProjectSummary = {
  project: Project;
  stats: ProjectStats;
};

export type ProjectMember = {
  project_id: number;
  member_id: number;
  project_role: string;
  joined_at: string;
  left_at: string | null;
};

export type ProjectMemberListResponse = {
  items: ProjectMember[];
  total: number;
};

export type ProjectApplication = {
  application_id: number;
  project_id: number;
  member_id: number;
  desired_role: string;
  application_text: string;
  status: ProjectApplicationStatus;
  manager_note: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by_member_id: number | null;
};

export type ProjectApplicationListResponse = {
  items: ProjectApplication[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateProjectPayload = {
  name: string;
  description: string | null;
  status: ProjectStatus;
  started_at: string | null;
  finished_at: string | null;
};

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export type CreateProjectApplicationPayload = {
  desired_role: string;
  application_text: string;
};

export type DecideProjectApplicationPayload = {
  status: Extract<ProjectApplicationStatus, "accepted" | "rejected">;
  manager_note: string | null;
};

export type UpdateProjectMemberPayload = {
  project_role?: string;
  left_at?: string | null;
};