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
import type { CreateProjectPayload, Project, ProjectStatus } from "../types/project";

const PROJECT_STATUSES: ProjectStatus[] = [
  "planned",
  "active",
  "finished",
  "archived",
];

function hasPermission(user: unknown, permission: string): boolean {
  const permissions = Array.isArray((user as { permissions?: unknown[] } | null)?.permissions)
    ? ((user as { permissions?: string[] }).permissions ?? [])
    : [];

  return permissions.includes(permission) || permissions.includes("project.manage");
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProjectPayload>({
    name: "",
    description: "",
    status: "planned",
    started_at: null,
    finished_at: null,
  });

  const canCreate = hasPermission(user, "project.create");

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
          setError("Failed to load projects.");
        }
      } else {
        setError("Unexpected error.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProjects = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return projects.filter((project) => {
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
  }, [projects, search]);

  async function handleCreateProject() {
    try {
      setSubmitting(true);
      setError(null);

      await createProject({
        ...createForm,
        description: createForm.description?.trim() || null,
        started_at: createForm.started_at || null,
        finished_at: createForm.finished_at || null,
      });

      setCreateOpen(false);
      setCreateForm({
        name: "",
        description: "",
        status: "planned",
        started_at: null,
        finished_at: null,
      });

      await loadProjects();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          String(err.response?.data?.detail?.message ?? "Failed to create project."),
        );
      } else {
        setError("Failed to create project.");
      }
    } finally {
      setSubmitting(false);
    }
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

          {canCreate && (
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
                        <Typography variant="h6">
                          {project.name}
                        </Typography>

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
                        {project.started_at ? ` • Start: ${project.started_at}` : ""}
                        {project.finished_at ? ` • Finish: ${project.finished_at}` : ""}
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
        onClose={() => setCreateOpen(false)}
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
            />

            <TextField
              label="Description"
              value={createForm.description ?? ""}
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
              label="Start date"
              type="date"
              value={createForm.started_at ?? ""}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  started_at: event.target.value || null,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Finish date"
              type="date"
              value={createForm.finished_at ?? ""}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  finished_at: event.target.value || null,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void handleCreateProject()}
            disabled={submitting || !createForm.name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}