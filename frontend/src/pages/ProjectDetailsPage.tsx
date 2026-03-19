import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HowToRegIcon from "@mui/icons-material/HowToReg";
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
} from "../api/projects";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../auth/permissions";
import type {
  Project,
  ProjectApplication,
  ProjectApplicationStatus,
  ProjectMember,
  ProjectStatus,
} from "../types/project";

const PROJECT_STATUSES: ProjectStatus[] = [
  "planned",
  "active",
  "finished",
  "archived",
];

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<{
    members_total: number;
    members_active: number;
    applications_pending: number;
    finance_income_total: number | null;
    finance_expense_total: number | null;
    finance_balance: number | null;
  } | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [applications, setApplications] = useState<ProjectApplication[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "planned" as ProjectStatus,
    started_at: "",
    finished_at: "",
  });

  const [applyForm, setApplyForm] = useState({
    desired_role: "",
    application_text: "",
  });

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

    return members.find(
      (member) => member.member_id === currentMemberId && member.left_at === null,
    ) ?? null;
  }, [members, currentMemberId]);

  const myPendingApplication = useMemo(() => {
    if (!currentMemberId) {
      return null;
    }

    return applications.find(
      (application) =>
        application.member_id === currentMemberId &&
        application.status === "pending",
    ) ?? null;
  }, [applications, currentMemberId]);

  async function loadAll() {
    if (authLoading) {
      return;
    }

    if (!canReadProject) {
      setError("You do not have permission to view project details.");
      setLoading(false);
      return;
    }

    if (!projectId) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [projectData, statsData, membersData] = await Promise.all([
        getProject(projectId),
        getProjectStats(projectId),
        listProjectMembers(projectId),
      ]);

      setProject(projectData);
      setStats(statsData);
      setMembers(membersData.items);

      setEditForm({
        name: projectData.name,
        description: projectData.description ?? "",
        status: projectData.status,
        started_at: projectData.started_at ?? "",
        finished_at: projectData.finished_at ?? "",
      });

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
      if (axios.isAxiosError(err)) {
        setError(
          String(err.response?.data?.detail?.message ?? "Failed to load project details."),
        );
      } else {
        setError("Failed to load project details.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, authLoading, canReadProject, canManage, currentMemberId]);

  async function handleUpdateProject() {
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
      if (axios.isAxiosError(err)) {
        setError(
          String(err.response?.data?.detail?.message ?? "Failed to update project."),
        );
      } else {
        setError("Failed to update project.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteProject() {
    if (!projectId || !project) {
      return;
    }

    const confirmed = window.confirm(
      `Delete project "${project.name}"? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await deleteProject(projectId);
      navigate("/projects");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          String(err.response?.data?.detail?.message ?? "Failed to delete project."),
        );
      } else {
        setError("Failed to delete project.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleApply() {
    if (!projectId || !currentMemberId) {
      setError("Current user is not available.");
      return;
    }

    try {
      setBusy(true);
      setError(null);

      await createProjectApplication(projectId, currentMemberId, {
        desired_role: applyForm.desired_role.trim(),
        application_text: applyForm.application_text.trim(),
      });

      setApplyOpen(false);
      setApplyForm({ desired_role: "", application_text: "" });
      await loadAll();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          String(err.response?.data?.detail?.message ?? "Failed to submit application."),
        );
      } else {
        setError("Failed to submit application.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw(applicationId: number) {
    if (!projectId || !currentMemberId) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await withdrawProjectApplication(projectId, applicationId, currentMemberId);
      await loadAll();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          String(err.response?.data?.detail?.message ?? "Failed to withdraw application."),
        );
      } else {
        setError("Failed to withdraw application.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDecision(
    applicationId: number,
    status: Extract<ProjectApplicationStatus, "accepted" | "rejected">,
  ) {
    if (!projectId || !currentMemberId) {
      setError("Current manager user is not available.");
      return;
    }

    const managerNote = window.prompt(
      `Optional manager note for ${status}:`,
      "",
    );

    try {
      setBusy(true);
      setError(null);
      await decideProjectApplication(projectId, applicationId, currentMemberId, {
        status,
        manager_note: managerNote || null,
      });
      await loadAll();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          String(err.response?.data?.detail?.message ?? "Failed to update application."),
        );
      } else {
        setError("Failed to update application.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleMemberLeave(memberId: number) {
    if (!projectId) {
      return;
    }

    const confirmed = window.confirm("Remove this member from the project?");
    if (!confirmed) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await removeProjectMember(projectId, memberId);
      await loadAll();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          String(err.response?.data?.detail?.message ?? "Failed to remove member."),
        );
      } else {
        setError("Failed to remove member.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleChangeRole(member: ProjectMember) {
    if (!projectId) {
      return;
    }

    const nextRole = window.prompt("New role", member.project_role);
    if (!nextRole?.trim()) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await updateProjectMember(projectId, member.member_id, {
        project_role: nextRole.trim(),
      });
      await loadAll();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          String(err.response?.data?.detail?.message ?? "Failed to update member role."),
        );
      } else {
        setError("Failed to update member role.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              {project?.name ?? "Project details"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View project information, members, applications, and management actions.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<FolderIcon />}
              onClick={() => navigate("/projects")}
            >
              Back
            </Button>

            {canApply && !activeMember && !myPendingApplication && (
              <Button
                variant="contained"
                startIcon={<HowToRegIcon />}
                onClick={() => setApplyOpen(true)}
              >
                Apply
              </Button>
            )}

            {canUpdate && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<EditIcon />}
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
            )}

            {canDelete && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => void handleDeleteProject()}
              >
                Delete
              </Button>
            )}
          </Stack>
        </Stack>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && project && (
          <>
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                >
                  <Typography variant="h5">{project.name}</Typography>
                  <Chip
                    label={project.status}
                    color={
                      project.status === "active"
                        ? "success"
                        : project.status === "planned"
                          ? "info"
                          : project.status === "finished"
                            ? "default"
                            : "warning"
                    }
                  />
                </Stack>

                <Typography color="text.secondary">
                  {project.description || "No description"}
                </Typography>

                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                  <Typography>
                    <strong>ID:</strong> {project.project_id}
                  </Typography>
                  <Typography>
                    <strong>Start:</strong> {project.started_at || "—"}
                  </Typography>
                  <Typography>
                    <strong>Finish:</strong> {project.finished_at || "—"}
                  </Typography>
                </Stack>

                {activeMember && (
                  <Alert severity="success">
                    You are already a member of this project as <strong>{activeMember.project_role}</strong>.
                  </Alert>
                )}

                {myPendingApplication && (
                  <Alert
                    severity="info"
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        onClick={() => void handleWithdraw(myPendingApplication.application_id)}
                      >
                        Withdraw
                      </Button>
                    }
                  >
                    You already have a pending application for this project.
                  </Alert>
                )}
              </Stack>
            </Paper>

            {stats && (
              <Paper sx={{ p: 3 }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={3}
                  divider={<Divider orientation="vertical" flexItem />}
                >
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Members total
                    </Typography>
                    <Typography variant="h6">{stats.members_total}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Members active
                    </Typography>
                    <Typography variant="h6">{stats.members_active}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Applications pending
                    </Typography>
                    <Typography variant="h6">{stats.applications_pending}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Finance balance
                    </Typography>
                    <Typography variant="h6">
                      {stats.finance_balance ?? "—"}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}

            <Paper sx={{ p: 2 }}>
              <Tabs value={tab} onChange={(_, value) => setTab(value)}>
                <Tab label="Members" />
                <Tab label="Applications" />
              </Tabs>

              <Box sx={{ pt: 2 }}>
                {tab === 0 && (
                  <Stack spacing={1.5}>
                    {members.length === 0 ? (
                      <Typography color="text.secondary">
                        No members found.
                      </Typography>
                    ) : (
                      members.map((member) => (
                        <Paper
                          key={`${member.project_id}-${member.member_id}`}
                          variant="outlined"
                          sx={{ p: 2 }}
                        >
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            spacing={2}
                          >
                            <Box>
                              <Typography variant="subtitle1">
                                Member #{member.member_id}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Role: {member.project_role}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Joined: {formatDate(member.joined_at)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Left: {formatDate(member.left_at)}
                              </Typography>
                            </Box>

                            {canManage && (
                              <Stack direction="row" spacing={1}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => void handleChangeRole(member)}
                                >
                                  Change role
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={() => void handleMemberLeave(member.member_id)}
                                >
                                  Remove
                                </Button>
                              </Stack>
                            )}
                          </Stack>
                        </Paper>
                      ))
                    )}
                  </Stack>
                )}

                {tab === 1 && (
                  <Stack spacing={1.5}>
                    {!canManage && applications.length === 0 ? (
                      <Typography color="text.secondary">
                        Applications are available only for project managers.
                      </Typography>
                    ) : applications.length === 0 ? (
                      <Typography color="text.secondary">
                        No applications found.
                      </Typography>
                    ) : (
                      applications.map((application) => (
                        <Paper
                          key={application.application_id}
                          variant="outlined"
                          sx={{ p: 2 }}
                        >
                          <Stack spacing={1.5}>
                            <Stack
                              direction={{ xs: "column", md: "row" }}
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Box>
                                <Typography variant="subtitle1">
                                  Application #{application.application_id}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Member #{application.member_id}
                                </Typography>
                              </Box>

                              <Chip
                                label={application.status}
                                color={
                                  application.status === "accepted"
                                    ? "success"
                                    : application.status === "rejected"
                                      ? "error"
                                      : application.status === "withdrawn"
                                        ? "default"
                                        : "info"
                                }
                                size="small"
                              />
                            </Stack>

                            <Typography variant="body2">
                              <strong>Desired role:</strong> {application.desired_role}
                            </Typography>

                            <Typography variant="body2">
                              <strong>Application text:</strong>{" "}
                              {application.application_text || "—"}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                              Applied: {formatDate(application.created_at)}
                            </Typography>

                            {application.manager_note && (
                              <Typography variant="body2">
                                <strong>Manager note:</strong> {application.manager_note}
                              </Typography>
                            )}

                            {canManage &&
                              application.status === "pending" && (
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() =>
                                      void handleDecision(application.application_id, "accepted")
                                    }
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() =>
                                      void handleDecision(application.application_id, "rejected")
                                    }
                                  >
                                    Reject
                                  </Button>
                                </Stack>
                              )}
                          </Stack>
                        </Paper>
                      ))
                    )}
                  </Stack>
                )}
              </Box>
            </Paper>
          </>
        )}
      </Stack>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit project</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Name"
              value={editForm.name}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, name: event.target.value }))
              }
              fullWidth
            />

            <TextField
              label="Description"
              value={editForm.description}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, description: event.target.value }))
              }
              multiline
              minRows={4}
              fullWidth
            />

            <TextField
              select
              label="Status"
              value={editForm.status}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  status: event.target.value as ProjectStatus,
                }))
              }
              fullWidth
            >
              {PROJECT_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Started at"
              type="datetime-local"
              value={editForm.started_at}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, started_at: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Finished at"
              type="datetime-local"
              value={editForm.finished_at}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, finished_at: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void handleUpdateProject()}
            disabled={busy || !editForm.name.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Apply to project</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Desired role"
              value={applyForm.desired_role}
              onChange={(event) =>
                setApplyForm((prev) => ({ ...prev, desired_role: event.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Application text"
              value={applyForm.application_text}
              onChange={(event) =>
                setApplyForm((prev) => ({ ...prev, application_text: event.target.value }))
              }
              multiline
              minRows={4}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void handleApply()}
            disabled={busy || !applyForm.desired_role.trim()}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}