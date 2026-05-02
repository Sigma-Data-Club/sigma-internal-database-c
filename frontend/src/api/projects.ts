import { apiClient } from "./client";
import type {
  CreateProjectApplicationPayload,
  CreateProjectPayload,
  DecideProjectApplicationPayload,
  Project,
  ProjectApplication,
  ProjectApplicationListResponse,
  ProjectListResponse,
  ProjectMember,
  ProjectMemberListResponse,
  ProjectStats,
  ProjectSummary,
  UpdateProjectMemberPayload,
  UpdateProjectPayload,
} from "../types/project";

type ListProjectsParams = {
  limit?: number;
  offset?: number;
  q?: string;
  status?: string;
};

type ListProjectApplicationsParams = {
  limit?: number;
  offset?: number;
  status?: string;
};

type ListProjectMembersParams = {
  limit?: number;
  offset?: number;
};

export async function listProjects(
  params: ListProjectsParams = {},
): Promise<ProjectListResponse> {
  const response = await apiClient.get<ProjectListResponse>("/projects", {
    params: {
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
      q: params.q ?? undefined,
      status: params.status ?? undefined,
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

export async function createProject(
  payload: CreateProjectPayload,
): Promise<Project> {
  const response = await apiClient.post<Project>("/projects", payload);
  return response.data;
}

export async function updateProject(
  projectId: string | number,
  payload: UpdateProjectPayload,
): Promise<Project> {
  const response = await apiClient.patch<Project>(
    `/projects/${projectId}`,
    payload,
  );
  return response.data;
}

export async function deleteProject(
  projectId: string | number,
): Promise<void> {
  await apiClient.delete(`/projects/${projectId}`);
}

export async function getProjectStats(
  projectId: string | number,
): Promise<ProjectStats> {
  const response = await apiClient.get<ProjectStats>(
    `/projects/${projectId}/stats`,
  );
  return response.data;
}

export async function getProjectSummary(
  projectId: string | number,
): Promise<ProjectSummary> {
  const response = await apiClient.get<ProjectSummary>(
    `/projects/${projectId}/summary`,
  );
  return response.data;
}

export async function listProjectMembers(
  projectId: string | number,
  params: ListProjectMembersParams = {},
): Promise<ProjectMemberListResponse> {
  const response = await apiClient.get<ProjectMemberListResponse>(
    `/projects/${projectId}/members`,
    {
      params: {
        limit: params.limit ?? 100,
        offset: params.offset ?? 0,
      },
    },
  );
  return response.data;
}

export async function addProjectMember(
  projectId: string | number,
  memberId: string | number,
  projectRole: string,
): Promise<ProjectMember> {
  const response = await apiClient.post<ProjectMember>(
    `/projects/${projectId}/members/${memberId}`,
    { project_role: projectRole },
  );
  return response.data;
}

export async function updateProjectMember(
  projectId: string | number,
  memberId: string | number,
  payload: UpdateProjectMemberPayload,
): Promise<ProjectMember> {
  const response = await apiClient.patch<ProjectMember>(
    `/projects/${projectId}/members/${memberId}`,
    payload,
  );
  return response.data;
}

export async function removeProjectMember(
  projectId: string | number,
  memberId: string | number,
): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
}

export async function listProjectApplications(
  projectId: string | number,
  params: ListProjectApplicationsParams = {},
): Promise<ProjectApplicationListResponse> {
  const response = await apiClient.get<ProjectApplicationListResponse>(
    `/projects/${projectId}/applications`,
    {
      params: {
        limit: params.limit ?? 100,
        offset: params.offset ?? 0,
        status: params.status ?? undefined,
      },
    },
  );
  return response.data;
}

export async function createProjectApplication(
  projectId: string | number,
  memberId: string | number,
  payload: CreateProjectApplicationPayload,
): Promise<ProjectApplication> {
  const response = await apiClient.post<ProjectApplication>(
    `/projects/${projectId}/applications/${memberId}`,
    payload,
  );
  return response.data;
}

export async function decideProjectApplication(
  projectId: string | number,
  applicationId: string | number,
  decidedByMemberId: string | number,
  payload: DecideProjectApplicationPayload,
): Promise<ProjectApplication> {
  const response = await apiClient.patch<ProjectApplication>(
    `/projects/${projectId}/applications/${applicationId}/decide/${decidedByMemberId}`,
    payload,
  );
  return response.data;
}

export async function withdrawProjectApplication(
  projectId: string | number,
  applicationId: string | number,
  memberId: string | number,
): Promise<ProjectApplication> {
  const response = await apiClient.post<ProjectApplication>(
    `/projects/${projectId}/applications/${applicationId}/withdraw/${memberId}`,
  );
  return response.data;
}