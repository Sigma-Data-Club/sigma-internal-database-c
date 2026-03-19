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

import { createProject, listProjects } from "../api/projects";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../auth/permissions";
import type { CreateProjectPayload, Project, ProjectStatus } from "../types/project";

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

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) {
    return fallback;
  }

  const detail = err.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => {
        const path = Array.isArray(item?.loc) ? item.loc.join(".") : "field";
        const message =
          typeof item?.msg === "string" && item.msg.trim()
            ? item.msg
            : "Invalid value";
        return `${path}: ${message}`;
      })
      .join(" | ");
  }

  const message = err.response?.data?.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return fallback;
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

  const finishBeforeStart = isFinishBeforeStart(
    createForm.started_at,
    createForm.finished_at,
    createForm.has_finish_date,
  );

  const createDisabled =
    submitting ||
    !createForm.name.trim() ||
    finishBeforeStart;

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
          setError("Session expired. Please sign in again.");
        } else if (status === 403) {
          setError("You do not have permission to view projects.");
        } else if (status === 404) {
          setError("Projects endpoint was not found.");
        } else {
          setError(extractApiErrorMessage(err, "Failed to load projects."));
        }
      } else {
        setError("Unexpected error.");
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
      setError("You do not have permission to view projects.");
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
      setError("Project name is required.");
      return;
    }

    if (finishBeforeStart) {
      setError("Finish date cannot be earlier than start date.");
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

      navigate(`/projects/${created.project_id}`);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to create project."));
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
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Projects
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browse projects, open details, apply, and manage them.
            </Typography>
          </Box>

          {canCreateProject && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
            >
              Create project
            </Button>
          )}
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Search projects"
            placeholder="Search by name, description, status or ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            fullWidth
          />

          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All</MenuItem>
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
            <Typography>Loading projects...</Typography>
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
          <Paper>
            {filteredProjects.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography>
                  {search.trim() || statusFilter
                    ? "No projects match your filters."
                    : "No projects found."}
                </Typography>
              </Box>
            ) : (
              <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
                {filteredProjects.map((project) => (
                  <Box
                    key={project.project_id}
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() => navigate(`/projects/${project.project_id}`)}
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
                        {project.description || "No description"}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        ID: {project.project_id}
                        {project.started_at
                          ? ` • Start: ${formatDateTime(project.started_at)}`
                          : ""}
                        {project.finished_at
                          ? ` • Finish: ${formatDateTime(project.finished_at)}`
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
        <DialogTitle>Create project</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Name"
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, name: event.target.value }))
              }
              fullWidth
              required
            />

            <TextField
              label="Description"
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
              label="Status"
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
              label="Started at"
              type="datetime-local"
              value={createForm.started_at}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  started_at: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              helperText="Optional"
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
              label="Set finish date"
            />

            {createForm.has_finish_date && (
              <TextField
                label="Finished at"
                type="datetime-local"
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
                Finish date cannot be earlier than start date.
              </Alert>
            )}

            {!createForm.has_finish_date && (
              <Typography variant="body2" color="text.secondary">
                This project will be created without an end date.
              </Typography>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseCreateDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleCreateProject()}
            disabled={createDisabled}
          >
            {submitting ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}