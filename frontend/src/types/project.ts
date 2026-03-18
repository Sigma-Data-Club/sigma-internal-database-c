export type ProjectStatus =
  | "planned"
  | "active"
  | "finished"
  | "archived";

export type Project = {
  project_id: number;
  title: string;
  summary: string | null;
  status: ProjectStatus;
  is_active: boolean;
};

export type ProjectListResponse = {
  items: Project[];
  total: number;
  limit: number;
  offset: number;
};