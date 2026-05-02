import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

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
  ProjectMember,
  ProjectStats,
  ProjectStatus,
} from "../../../types/project";
import ChangeProjectRoleDialog from "../dialogs/ChangeProjectRoleDialog";
import ConfirmProjectDeleteDialog from "../dialogs/ConfirmProjectDeleteDialog";
import EditProjectDialog from "../dialogs/EditProjectDialog";
import { extractProjectApiErrorMessage } from "../utils/projectErrors";
import { formatProjectDate } from "../utils/projectFormatters";
import { projectStrings } from "../utils/projectStrings";

type ProjectManagementTab = "overview" | "members" | "applications" | "stats";

type EditFormState = {
  name: string;
  description: string;
  status: ProjectStatus;
  started_at: string;
  finished_at: string;
};

const PROJECT_STATUSES: ProjectStatus[] = [
  "planned",
  "active",
  "finished",
  "archived",
];

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, minWidth: 180 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ mt: 1 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function ProjectManagementPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user, isLoading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [applySubmitting, setApplySubmitting] = useState(false);
  const [busyApplicationId, setBusyApplicationId] = useState<number | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [removeMemberOpen, setRemoveMemberOpen] = useState(false);

  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    description: "",
    status: "planned",
    started_at: "",
    finished_at: "",
  });

  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);

  const currentMemberId = user?.member_id ?? null;

  const canReadProject = hasPermission(user, "project.read");
  const canApply = hasPermission(user, "project.apply");
  const canUpdate = hasPermission(user, "project.update");
  const canDelete = hasPermission(user, "project.delete");
  const canManage = hasPermission(user, "project.manage");
  const canReadStats = hasPermission(user, "project.stats.read");

  const requestedTab =
    (searchParams.get("tab") as ProjectManagementTab | null) ?? "overview";

  const currentTab: ProjectManagementTab =
    requestedTab === "members" && !canManage
      ? "overview"
      : requestedTab === "applications" && !canManage && !currentMemberId
        ? "overview"
        : requestedTab === "stats" && !canReadStats
          ? "overview"
          : requestedTab;

  useEffect(() => {
    if (requestedTab !== currentTab) {
      setSearchParams({ tab: currentTab }, { replace: true });
    }
  }, [requestedTab, currentTab, setSearchParams]);

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

  async function loadData(showRefresh = false) {
    if (!projectId) {
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);
      setActionError(null);

      const projectPromise = getProject(projectId);
      const membersPromise = listProjectMembers(projectId);

      const applicationsPromise =
        canManage || currentMemberId
          ? listProjectApplications(projectId).catch(() => ({ items: [], total: 0 }))
          : Promise.resolve({ items: [], total: 0 });

      const statsPromise = canReadStats
        ? getProjectStats(projectId).catch(() => null)
        : Promise.resolve(null);

      const [projectResult, membersResult, applicationsResult, statsResult] =
        await Promise.all([
          projectPromise,
          membersPromise,
          applicationsPromise,
          statsPromise,
        ]);

      setProject(projectResult);
      setMembers(membersResult.items);
      setApplications(applicationsResult.items);
      setStats(statsResult);

      setEditForm({
        name: projectResult.name,
        description: projectResult.description ?? "",
        status: projectResult.status,
        started_at: projectResult.started_at ?? "",
        finished_at: projectResult.finished_at ?? "",
      });
    } catch (err) {
      setError(
        extractProjectApiErrorMessage(err, projectStrings.messages.loadError),
      );
    } finally {
      if (showRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
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

    void loadData();
  }, [authLoading, canReadProject, canManage, canReadStats, currentMemberId, projectId]);

  const handleTabChange = (_: SyntheticEvent, value: ProjectManagementTab) => {
    setSearchParams({ tab: value });
  };

  async function handleApply() {
    if (!projectId || !currentMemberId) {
      setActionError(projectStrings.messages.missingCurrentUser);
      return;
    }

    try {
      setApplySubmitting(true);
      setActionError(null);

      await createProjectApplication(projectId, currentMemberId, {
        desired_role: "member",
        application_text: "Project application",
      });

      await loadData(true);
    } catch (err) {
      setActionError(
        extractProjectApiErrorMessage(err, projectStrings.messages.submitError),
      );
    } finally {
      setApplySubmitting(false);
    }
  }

  async function handleWithdraw(applicationId: number) {
    if (!projectId || !currentMemberId) {
      return;
    }

    try {
      setBusyApplicationId(applicationId);
      setActionError(null);

      await withdrawProjectApplication(projectId, applicationId, currentMemberId);
      await loadData(true);
    } catch (err) {
      setActionError(
        extractProjectApiErrorMessage(err, projectStrings.messages.withdrawError),
      );
    } finally {
      setBusyApplicationId(null);
    }
  }

  async function handleDecision(
    applicationId: number,
    status: "accepted" | "rejected",
  ) {
    if (!projectId || !currentMemberId) {
      setActionError(projectStrings.messages.missingManagerUser);
      return;
    }

    try {
      setBusyApplicationId(applicationId);
      setActionError(null);

      await decideProjectApplication(projectId, applicationId, currentMemberId, {
        status,
        manager_note: null,
      });

      await loadData(true);
    } catch (err) {
      setActionError(
        extractProjectApiErrorMessage(err, projectStrings.messages.decisionError),
      );
    } finally {
      setBusyApplicationId(null);
    }
  }

  async function handleSubmitProjectUpdate() {
    if (!projectId || !project) {
      return;
    }

    try {
      setBusy(true);
      setActionError(null);

      const updated = await updateProject(projectId, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        status: editForm.status,
        started_at: editForm.started_at || null,
        finished_at: editForm.finished_at || null,
      });

      setProject(updated);
      setEditOpen(false);
      await loadData(true);
    } catch (err) {
      setActionError(
        extractProjectApiErrorMessage(err, projectStrings.messages.updateError),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteProject() {
    if (!projectId) {
      return;
    }

    try {
      setBusy(true);
      setActionError(null);

      await deleteProject(projectId);
      navigate("/projects");
    } catch (err) {
      setActionError(
        extractProjectApiErrorMessage(err, projectStrings.messages.deleteError),
      );
    } finally {
      setBusy(false);
      setDeleteProjectOpen(false);
    }
  }

  function openChangeRoleDialog(member: ProjectMember) {
    setSelectedMember(member);
    setChangeRoleOpen(true);
  }

  async function handleSubmitRoleChange() {
    if (!projectId || !selectedMember) {
      return;
    }

    const nextRole = selectedMember.project_role.trim();
    if (!nextRole) {
      return;
    }

    try {
      setBusy(true);
      setActionError(null);

      await updateProjectMember(projectId, selectedMember.member_id, {
        project_role: nextRole,
      });

      setChangeRoleOpen(false);
      setSelectedMember(null);
      await loadData(true);
    } catch (err) {
      setActionError(
        extractProjectApiErrorMessage(
          err,
          projectStrings.messages.changeRoleError,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  function openRemoveMemberDialog(member: ProjectMember) {
    setSelectedMember(member);
    setRemoveMemberOpen(true);
  }

  async function handleRemoveMember() {
    if (!projectId || !selectedMember) {
      return;
    }

    try {
      setBusy(true);
      setActionError(null);

      await removeProjectMember(projectId, selectedMember.member_id);

      setRemoveMemberOpen(false);
      setSelectedMember(null);
      await loadData(true);
    } catch (err) {
      setActionError(
        extractProjectApiErrorMessage(
          err,
          projectStrings.messages.removeMemberError,
        ),
      );
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
              {project?.name ?? projectStrings.page.titleFallback}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Project management
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/projects")}
            >
              Back to projects
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => void loadData(true)}
              disabled={refreshing}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}
        {!loading && actionError && <Alert severity="error">{actionError}</Alert>}

        {!loading && !error && project && (
          <>
            <Paper sx={{ p: 2 }}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                variant="scrollable"
                allowScrollButtonsMobile
              >
                <Tab value="overview" label="Overview" />
                {canManage && <Tab value="members" label="Members" />}
                {(canManage || currentMemberId) && (
                  <Tab value="applications" label="Applications" />
                )}
                {canReadStats && <Tab value="stats" label="Stats" />}
              </Tabs>
            </Paper>

            {currentTab === "overview" && (
              <Stack spacing={3}>
                <Paper sx={{ p: 3 }}>
                  <Stack spacing={1.25}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      spacing={1}
                    >
                      <Typography variant="h6">Project overview</Typography>
                      <Chip label={project.status} />
                    </Stack>

                    <Typography>
                      <strong>ID:</strong> {project.project_id}
                    </Typography>

                    <Typography>
                      <strong>Name:</strong> {project.name}
                    </Typography>

                    <Typography>
                      <strong>Description:</strong> {project.description || "—"}
                    </Typography>

                    <Typography>
                      <strong>Started:</strong> {formatProjectDate(project.started_at)}
                    </Typography>

                    <Typography>
                      <strong>Finished:</strong> {formatProjectDate(project.finished_at)}
                    </Typography>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      sx={{ pt: 1 }}
                    >
                      {canApply && !activeMember && !myPendingApplication && (
                        <Button
                          variant="contained"
                          onClick={() => void handleApply()}
                          disabled={applySubmitting}
                        >
                          {applySubmitting ? "Applying..." : "Apply"}
                        </Button>
                      )}

                      {canUpdate && (
                        <Button
                          variant="outlined"
                          onClick={() => setEditOpen(true)}
                          disabled={busy}
                        >
                          Edit
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => setDeleteProjectOpen(true)}
                          disabled={busy}
                        >
                          Delete
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Paper>

                {currentMemberId && (
                  <Paper sx={{ p: 3 }}>
                    <Stack spacing={1.25}>
                      <Typography variant="h6">My participation</Typography>

                      {activeMember && (
                        <Alert severity="success">
                          You are already an active project member.
                        </Alert>
                      )}

                      {!activeMember && myPendingApplication && (
                        <>
                          <Typography>
                            <strong>Application ID:</strong>{" "}
                            {myPendingApplication.application_id}
                          </Typography>
                          <Typography>
                            <strong>Status:</strong> {myPendingApplication.status}
                          </Typography>
                          <Typography>
                            <strong>Desired role:</strong>{" "}
                            {myPendingApplication.desired_role}
                          </Typography>
                          <Typography>
                            <strong>Created:</strong>{" "}
                            {formatProjectDate(myPendingApplication.created_at)}
                          </Typography>

                          <Box>
                            <Button
                              variant="outlined"
                              color="warning"
                              disabled={
                                busyApplicationId ===
                                myPendingApplication.application_id
                              }
                              onClick={() =>
                                void handleWithdraw(
                                  myPendingApplication.application_id,
                                )
                              }
                            >
                              Withdraw application
                            </Button>
                          </Box>
                        </>
                      )}

                      {!activeMember && !myPendingApplication && (
                        <Typography color="text.secondary">
                          No active membership or pending application found.
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            )}

            {currentTab === "members" && canManage && (
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Project members</Typography>

                  {members.length === 0 ? (
                    <Typography color="text.secondary">
                      No members found.
                    </Typography>
                  ) : (
                    members.map((member) => (
                      <Paper
                        key={member.member_id}
                        variant="outlined"
                        sx={{ p: 2 }}
                      >
                        <Stack spacing={1.25}>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            spacing={1}
                          >
                            <Box>
                              <Typography fontWeight={600}>
                                Member ID: {member.member_id}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Role:</strong> {member.project_role}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Joined:</strong>{" "}
                                {formatProjectDate(member.joined_at)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Left:</strong>{" "}
                                {formatProjectDate(member.left_at)}
                              </Typography>
                            </Box>

                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                            >
                              <Button
                                variant="outlined"
                                onClick={() => openChangeRoleDialog(member)}
                                disabled={busy}
                              >
                                Change role
                              </Button>

                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() => openRemoveMemberDialog(member)}
                                disabled={busy}
                              >
                                Remove
                              </Button>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Paper>
            )}

            {currentTab === "applications" && (canManage || currentMemberId) && (
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Project applications</Typography>

                  {applications.length === 0 ? (
                    <Typography color="text.secondary">
                      No applications found.
                    </Typography>
                  ) : (
                    applications.map((application) => {
                      const isOwnPending =
                        currentMemberId === application.member_id &&
                        application.status === "pending";

                      return (
                        <Paper
                          key={application.application_id}
                          variant="outlined"
                          sx={{ p: 2 }}
                        >
                          <Stack spacing={1.25}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Typography fontWeight={600}>
                                Application #{application.application_id}
                              </Typography>
                              <Chip label={application.status} />
                            </Stack>

                            <Typography variant="body2">
                              <strong>Member ID:</strong> {application.member_id}
                            </Typography>

                            <Typography variant="body2">
                              <strong>Desired role:</strong>{" "}
                              {application.desired_role}
                            </Typography>

                            <Typography variant="body2">
                              <strong>Application text:</strong>{" "}
                              {application.application_text}
                            </Typography>

                            <Typography variant="body2">
                              <strong>Created:</strong>{" "}
                              {formatProjectDate(application.created_at)}
                            </Typography>

                            {application.manager_note && (
                              <Typography variant="body2">
                                <strong>Manager note:</strong>{" "}
                                {application.manager_note}
                              </Typography>
                            )}

                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                            >
                              {canManage && application.status === "pending" && (
                                <>
                                  <Button
                                    variant="contained"
                                    disabled={
                                      busyApplicationId ===
                                      application.application_id
                                    }
                                    onClick={() =>
                                      void handleDecision(
                                        application.application_id,
                                        "accepted",
                                      )
                                    }
                                  >
                                    Accept
                                  </Button>

                                  <Button
                                    variant="outlined"
                                    color="error"
                                    disabled={
                                      busyApplicationId ===
                                      application.application_id
                                    }
                                    onClick={() =>
                                      void handleDecision(
                                        application.application_id,
                                        "rejected",
                                      )
                                    }
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}

                              {isOwnPending && (
                                <Button
                                  variant="outlined"
                                  color="warning"
                                  disabled={
                                    busyApplicationId === application.application_id
                                  }
                                  onClick={() =>
                                    void handleWithdraw(application.application_id)
                                  }
                                >
                                  Withdraw
                                </Button>
                              )}
                            </Stack>
                          </Stack>
                        </Paper>
                      );
                    })
                  )}
                </Stack>
              </Paper>
            )}

            {currentTab === "stats" && canReadStats && (
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Project stats</Typography>

                  {!stats ? (
                    <Typography color="text.secondary">
                      No statistics available.
                    </Typography>
                  ) : (
                    <Stack
                      direction="row"
                      spacing={2}
                      useFlexGap
                      flexWrap="wrap"
                    >
                      <StatCard label="Total members" value={stats.members_total} />
                      <StatCard
                        label="Active members"
                        value={stats.members_active}
                      />
                      <StatCard
                        label="Pending applications"
                        value={stats.applications_pending}
                      />
                      <StatCard
                        label="Finance income"
                        value={stats.finance_income_total ?? "—"}
                      />
                      <StatCard
                        label="Finance expense"
                        value={stats.finance_expense_total ?? "—"}
                      />
                      <StatCard
                        label="Finance balance"
                        value={stats.finance_balance ?? "—"}
                      />
                    </Stack>
                  )}
                </Stack>
              </Paper>
            )}
          </>
        )}
      </Stack>

      <EditProjectDialog
        open={editOpen}
        busy={busy}
        value={editForm}
        statuses={PROJECT_STATUSES}
        onClose={() => setEditOpen(false)}
        onChange={setEditForm}
        onSubmit={() => void handleSubmitProjectUpdate()}
      />

      <ChangeProjectRoleDialog
        open={changeRoleOpen}
        busy={busy}
        memberId={selectedMember?.member_id ?? null}
        role={selectedMember?.project_role ?? ""}
        onClose={() => {
          setChangeRoleOpen(false);
          setSelectedMember(null);
        }}
        onRoleChange={(value: string) => {
          if (!selectedMember) {
            return;
          }

          setSelectedMember({
            ...selectedMember,
            project_role: value,
          });
        }}
        onSubmit={() => void handleSubmitRoleChange()}
      />

      <ConfirmProjectDeleteDialog
        open={deleteProjectOpen}
        busy={busy}
        projectName={project?.name ?? ""}
        onClose={() => setDeleteProjectOpen(false)}
        onConfirm={() => void handleDeleteProject()}
      />

      <Dialog
        open={removeMemberOpen}
        onClose={busy ? undefined : () => setRemoveMemberOpen(false)}
      >
        <DialogTitle>Remove member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedMember
              ? `Are you sure you want to remove member #${selectedMember.member_id} from this project?`
              : "Are you sure you want to remove this member from the project?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRemoveMemberOpen(false);
              setSelectedMember(null);
            }}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => void handleRemoveMember()}
            disabled={busy}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}