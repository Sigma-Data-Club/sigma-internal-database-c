import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createProjectApplication,
  decideProjectApplication,
  deleteProject,
  getProject,
  getProjectStats,
  listProjectApplications,
  listProjectMembers,
  removeProjectMember,
  updateProject,
  updateProjectMember,
  withdrawProjectApplication,
} from "../../../api/projects";
import { hasPermission } from "../../../auth/permissions";
import { useAuth } from "../../../context/AuthContext";
import type {
  Project,
  ProjectApplication,
  ProjectApplicationStatus,
  ProjectMember,
  ProjectStats,
  ProjectStatus,
} from "../../../types/project";
import { extractProjectApiErrorMessage } from "../utils/projectErrors";
import { projectStrings } from "../utils/projectStrings";

const PROJECT_STATUSES: ProjectStatus[] = [
  "planned",
  "active",
  "finished",
  "archived",
];

type EditFormState = {
  name: string;
  description: string;
  status: ProjectStatus;
  started_at: string;
  finished_at: string;
};

type ApplyFormState = {
  desired_role: string;
  application_text: string;
};

export function useProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [applications, setApplications] = useState<ProjectApplication[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [removeMemberOpen, setRemoveMemberOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [decideApplicationOpen, setDecideApplicationOpen] = useState(false);

  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    description: "",
    status: "planned",
    started_at: "",
    finished_at: "",
  });

  const [applyForm, setApplyForm] = useState<ApplyFormState>({
    desired_role: "",
    application_text: "",
  });

  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<ProjectApplication | null>(null);
  const [decisionMode, setDecisionMode] = useState<
    Extract<ProjectApplicationStatus, "accepted" | "rejected">
  >("accepted");
  const [managerNote, setManagerNote] = useState("");

  const currentMemberId = user?.member_id ?? null;

  const canReadProject = hasPermission(user, "project.read");
  const canApply = hasPermission(user, "project.apply");
  const canUpdate = hasPermission(user, "project.update");
  const canDelete = hasPermission(user, "project.delete");
  const canManage = hasPermission(user, "project.manage");

  const activeMember = useMemo(() => {
    if (!currentMemberId) {
      return null;
    }

    return (
      members.find(
        (member) => member.member_id === currentMemberId && member.left_at === null,
      ) ?? null
    );
  }, [members, currentMemberId]);

  const myPendingApplication = useMemo(() => {
    if (!currentMemberId) {
      return null;
    }

    return (
      applications.find(
        (application) =>
          application.member_id === currentMemberId &&
          application.status === "pending",
      ) ?? null
    );
  }, [applications, currentMemberId]);

  const loadAll = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!canReadProject) {
      setError(projectStrings.messages.noPermission);
      setLoading(false);
      return;
    }

    if (!projectId) {
      setError(projectStrings.messages.missingProjectId);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [projectData, membersData] = await Promise.all([
        getProject(projectId),
        listProjectMembers(projectId),
      ]);

      setProject(projectData);
      setMembers(membersData.items);

      setEditForm({
        name: projectData.name,
        description: projectData.description ?? "",
        status: projectData.status,
        started_at: projectData.started_at ?? "",
        finished_at: projectData.finished_at ?? "",
      });

      try {
        const statsData = await getProjectStats(projectId);
        setStats(statsData);
      } catch {
        setStats(null);
      }

      if (canManage || currentMemberId) {
        try {
          const applicationsData = await listProjectApplications(projectId);
          setApplications(applicationsData.items);
        } catch {
          setApplications([]);
        }
      } else {
        setApplications([]);
      }
    } catch (err) {
      setError(
        extractProjectApiErrorMessage(err, projectStrings.messages.loadError),
      );
    } finally {
      setLoading(false);
    }
  }, [authLoading, canManage, canReadProject, currentMemberId, projectId]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void loadAll();
  }, [authLoading, loadAll]);

  async function submitProjectUpdate() {
    if (!projectId || !project) {
      return;
    }

    try {
      setBusy(true);
      setError(null);

      const updated = await updateProject(projectId, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        status: editForm.status,
        started_at: editForm.started_at || null,
        finished_at: editForm.finished_at || null,
      });

      setProject(updated);
      setEditOpen(false);
      await loadAll();
    } catch (err) {
      setError(
        extractProjectApiErrorMessage(err, projectStrings.messages.updateError),
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteProject() {
    if (!projectId || !project) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await deleteProject(projectId);
      navigate("/projects");
    } catch (err) {
      setError(
        extractProjectApiErrorMessage(err, projectStrings.messages.deleteError),
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitApplication() {
    if (!projectId || !currentMemberId) {
      setError(projectStrings.messages.missingCurrentUser);
      return;
    }

    const desiredRole = applyForm.desired_role.trim();
    const applicationText = applyForm.application_text.trim();

    if (!desiredRole || !applicationText) {
      setError(projectStrings.messages.requiredApplicationFields);
      return;
    }

    try {
      setBusy(true);
      setError(null);

      await createProjectApplication(projectId, currentMemberId, {
        desired_role: desiredRole,
        application_text: applicationText,
      });

      setApplyOpen(false);
      setApplyForm({ desired_role: "", application_text: "" });
      await loadAll();
    } catch (err) {
      setError(
        extractProjectApiErrorMessage(err, projectStrings.messages.submitError),
      );
    } finally {
      setBusy(false);
    }
  }

  async function withdrawApplication(applicationId: number) {
    if (!projectId || !currentMemberId) {
      return;
    }

    try {
      setBusy(true);
      setError(null);

      await withdrawProjectApplication(projectId, applicationId, currentMemberId);
      await loadAll();
    } catch (err) {
      setError(
        extractProjectApiErrorMessage(err, projectStrings.messages.withdrawError),
      );
    } finally {
      setBusy(false);
    }
  }

  function openDecisionDialog(
    application: ProjectApplication,
    mode: Extract<ProjectApplicationStatus, "accepted" | "rejected">,
  ) {
    setSelectedApplication(application);
    setDecisionMode(mode);
    setManagerNote("");
    setDecideApplicationOpen(true);
  }

  async function submitDecision() {
    if (!projectId || !currentMemberId || !selectedApplication) {
      setError(projectStrings.messages.missingManagerUser);
      return;
    }

    try {
      setBusy(true);
      setError(null);

      await decideProjectApplication(
        projectId,
        selectedApplication.application_id,
        currentMemberId,
        {
          status: decisionMode,
          manager_note: managerNote.trim() || null,
        },
      );

      setDecideApplicationOpen(false);
      setSelectedApplication(null);
      setManagerNote("");
      await loadAll();
    } catch (err) {
      setError(
        extractProjectApiErrorMessage(err, projectStrings.messages.decisionError),
      );
    } finally {
      setBusy(false);
    }
  }

  function openRemoveMemberDialog(member: ProjectMember) {
    setSelectedMember(member);
    setRemoveMemberOpen(true);
  }

  async function confirmRemoveMember() {
    if (!projectId || !selectedMember) {
      return;
    }

    try {
      setBusy(true);
      setError(null);

      await removeProjectMember(projectId, selectedMember.member_id);
      setRemoveMemberOpen(false);
      setSelectedMember(null);
      await loadAll();
    } catch (err) {
      setError(
        extractProjectApiErrorMessage(err, projectStrings.messages.removeMemberError),
      );
    } finally {
      setBusy(false);
    }
  }

  function openChangeRoleDialog(member: ProjectMember) {
    setSelectedMember(member);
    setChangeRoleOpen(true);
  }

  async function submitRoleChange() {
    if (!projectId || !selectedMember) {
      return;
    }

    const nextRole = selectedMember.project_role.trim();
    if (!nextRole) {
      return;
    }

    try {
      setBusy(true);
      setError(null);

      await updateProjectMember(projectId, selectedMember.member_id, {
        project_role: nextRole,
      });

      setChangeRoleOpen(false);
      setSelectedMember(null);
      await loadAll();
    } catch (err) {
      setError(
        extractProjectApiErrorMessage(err, projectStrings.messages.changeRoleError),
      );
    } finally {
      setBusy(false);
    }
  }

  return {
    projectId,
    project,
    stats,
    members,
    applications,
    loading,
    busy,
    error,
    tab,
    setTab,

    editOpen,
    setEditOpen,
    applyOpen,
    setApplyOpen,
    deleteProjectOpen,
    setDeleteProjectOpen,
    removeMemberOpen,
    setRemoveMemberOpen,
    changeRoleOpen,
    setChangeRoleOpen,
    decideApplicationOpen,
    setDecideApplicationOpen,

    editForm,
    setEditForm,
    applyForm,
    setApplyForm,

    selectedMember,
    setSelectedMember,
    selectedApplication,
    decisionMode,
    managerNote,
    setManagerNote,

    currentMemberId,
    canReadProject,
    canApply,
    canUpdate,
    canDelete,
    canManage,
    activeMember,
    myPendingApplication,
    projectStatuses: PROJECT_STATUSES,

    loadAll,
    submitProjectUpdate,
    confirmDeleteProject,
    submitApplication,
    withdrawApplication,
    openDecisionDialog,
    submitDecision,
    openRemoveMemberDialog,
    confirmRemoveMember,
    openChangeRoleDialog,
    submitRoleChange,
    navigate,
  };
}