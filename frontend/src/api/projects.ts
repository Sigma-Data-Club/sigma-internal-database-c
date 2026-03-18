import { apiClient } from "./client";
import type { Project, ProjectListResponse } from "../types/project";

type ListProjectsParams = {
  limit?: number;
  offset?: number;
};

export async function listProjects(
  params: ListProjectsParams = {},
): Promise<ProjectListResponse> {
  const response = await apiClient.get<ProjectListResponse>("/projects", {
    params: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  });

  return response.data;
}

export async function getProject(
  projectId: string | number,
): Promise<Project> {
  const response = await apiClient.get<Project>(`/projects/${projectId}`);
  return response.data;
}