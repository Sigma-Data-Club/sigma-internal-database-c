import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../components/common/PageHeader";
import { createProject, listProjects } from "../../../api/projects";
import { useAuth } from "../../../context/AuthContext";
import { hasPermission } from "../../../auth/permissions";
import type {
  CreateProjectPayload,
  Project,
  ProjectStatus,
} from "../../../types/project";
import { extractProjectApiErrorMessage } from "../utils/projectErrors";
import { formatProjectDate } from "../utils/projectFormatters";
import { projectStrings } from "../utils/projectStrings";

const PROJECT_STATUSES: ProjectStatus[] = [
  "planned",
  "active",
  "finished",
  "archived",
];

type CreateProjectFormState = {
  name: string;
  description: string;
  status: ProjectStatus;
  started_at: string;
  finished_at: string;
  has_finish_date: boolean;
};

function createInitialFormState(): CreateProjectFormState {
  return {
    name: "",
    description: "",
    status: "planned",
    started_at: "",
    finished_at: "",
    has_finish_date: false,
  };
}

function normalizeDateTimeLocal(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
}

function isFinishBeforeStart(
  startedAt: string,
  finishedAt: string,
  hasFinishDate: boolean,
): boolean {
  if (!hasFinishDate) {
    return false;
  }

  if (!startedAt.trim() || !finishedAt.trim()) {
    return false;
  }

  const start = new Date(startedAt);
  const finish = new Date(finishedAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(finish.getTime())) {
    return false;
  }

  return finish < start;
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProjectFormState>(
    createInitialFormState(),
  );

  const canReadProjects = hasPermission(user, "project.read");
  const canCreateProject = hasPermission(user, "project.create");
  const canReadStats = hasPermission(user, "project.stats.read");

  const finishBeforeStart = isFinishBeforeStart(
    createForm.started_at,
    createForm.finished_at,
    createForm.has_finish_date,
  );

  const createDisabled =
    submitting || !createForm.name.trim() || finishBeforeStart;

  async function loadProjects() {
    try {
      setLoading(true);
      setError(null);

      const data = await listProjects({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        limit: 100,
        offset: 0,
      });

      setProjects(data.items);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 401) {
          setError(projectStrings.messages.sessionExpired);
        } else if (status === 403) {
          setError(projectStrings.messages.noListPermission);
        } else if (status === 404) {
          setError(projectStrings.messages.missingProjectsEndpoint);
        } else {
          setError(
            extractProjectApiErrorMessage(
              err,
              projectStrings.messages.loadProjectsError,
            ),
          );
        }
      } else {
        setError(projectStrings.messages.unexpectedError);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!canReadProjects) {
      setProjects([]);
      setError(projectStrings.messages.noListPermission);
      setLoading(false);
      return;
    }

    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canReadProjects]);

  const filteredProjects = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return projects.filter((project) => {
      if (statusFilter && project.status !== statusFilter) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return (
        project.name.toLowerCase().includes(normalized) ||
        (project.description ?? "").toLowerCase().includes(normalized) ||
        project.status.toLowerCase().includes(normalized) ||
        String(project.project_id).includes(normalized)
      );
    });
  }, [projects, search, statusFilter]);

  async function handleCreateProject() {
    if (!createForm.name.trim()) {
      setError(projectStrings.messages.requiredProjectName);
      return;
    }

    if (finishBeforeStart) {
      setError(projectStrings.messages.finishBeforeStart);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateProjectPayload = {
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
        status: createForm.status,
        started_at: normalizeDateTimeLocal(createForm.started_at),
        finished_at: createForm.has_finish_date
          ? normalizeDateTimeLocal(createForm.finished_at)
          : null,
      };

      const created = await createProject(payload);

      setCreateOpen(false);
      setCreateForm(createInitialFormState());
      await loadProjects();

      navigate(`/projects/${created.project_id}/manage?tab=overview`);
    } catch (err) {
      setError(
        extractProjectApiErrorMessage(
          err,
          projectStrings.messages.createProjectError,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCloseCreateDialog() {
    if (submitting) {
      return;
    }

    setCreateOpen(false);
    setCreateForm(createInitialFormState());
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2}>
        <PageHeader
          title={projectStrings.page.listTitle}
          subtitle={projectStrings.page.listSubtitle}
          actions={
            <Stack direction="row" spacing={1}>
              {canReadStats && (
                <Button
                  variant="outlined"
                  onClick={() => navigate("/projects/analytics")}
                >
                  Analítica de proyectos
                </Button>
              )}

              {canCreateProject && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateOpen(true)}
                >
                  {projectStrings.actions.createProject}
                </Button>
              )}
            </Stack>
          }
        />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label={projectStrings.fields.searchProjects}
            placeholder={projectStrings.fields.searchProjectsPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            fullWidth
          />

          <TextField
            select
            label={projectStrings.fields.status}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">{projectStrings.fields.allStatuses}</MenuItem>
            {PROJECT_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {loading && (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <CircularProgress size={24} />
            <Typography>{projectStrings.messages.loadingProjects}</Typography>
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
          <Paper>
            {filteredProjects.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography>
                  {search.trim() || statusFilter
                    ? projectStrings.empty.noProjectsWithFilters
                    : projectStrings.empty.noProjects}
                </Typography>
              </Box>
            ) : (
              <Stack
                divider={
                  <Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />
                }
              >
                {filteredProjects.map((project) => (
                  <Box
                    key={project.project_id}
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() =>
                      navigate(`/projects/${project.project_id}/manage?tab=overview`)
                    }
                  >
                    <Stack spacing={1}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        spacing={1}
                      >
                        <Typography variant="h6">{project.name}</Typography>

                        <Chip
                          label={project.status}
                          size="small"
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

                      <Typography variant="body2" color="text.secondary">
                        {project.description || projectStrings.empty.noDescription}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {projectStrings.labels.id}: {project.project_id}
                        {project.started_at
                          ? ` • ${projectStrings.labels.started}: ${formatProjectDate(project.started_at)}`
                          : ""}
                        {project.finished_at
                          ? ` • ${projectStrings.labels.finished}: ${formatProjectDate(project.finished_at)}`
                          : ""}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        )}
      </Stack>

      <Dialog
        open={createOpen}
        onClose={handleCloseCreateDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{projectStrings.dialogs.createProject}</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={projectStrings.fields.name}
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, name: event.target.value }))
              }
              fullWidth
              required
            />

            <TextField
              label={projectStrings.fields.description}
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              multiline
              minRows={4}
              fullWidth
            />

            <TextField
              select
              label={projectStrings.fields.status}
              value={createForm.status}
              onChange={(event) =>
                setCreateForm((prev) => ({
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
              label={projectStrings.fields.startedAt}
              type="date"
              value={createForm.started_at}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  started_at: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              helperText={projectStrings.messages.optional}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={createForm.has_finish_date}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      has_finish_date: event.target.checked,
                      finished_at: event.target.checked ? prev.finished_at : "",
                    }))
                  }
                />
              }
              label={projectStrings.fields.setFinishDate}
            />

            {createForm.has_finish_date && (
              <TextField
                label={projectStrings.fields.finishedAt}
                type="date"
                value={createForm.finished_at}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    finished_at: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            )}

            {finishBeforeStart && (
              <Alert severity="warning">
                {projectStrings.messages.finishBeforeStart}
              </Alert>
            )}

            {!createForm.has_finish_date && (
              <Typography variant="body2" color="text.secondary">
                {projectStrings.messages.projectWithoutFinishDate}
              </Typography>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseCreateDialog} disabled={submitting}>
            {projectStrings.actions.cancel}
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleCreateProject()}
            disabled={createDisabled}
          >
            {submitting
              ? projectStrings.actions.creating
              : projectStrings.actions.create}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}