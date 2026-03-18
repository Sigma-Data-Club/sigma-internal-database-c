import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { listProjects } from "../api/projects";
import type { Project } from "../types/project";

export default function ProjectsPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await listProjects();
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
    };

    void loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return projects;
    }

    return projects.filter((project) => {
      const title = project.title.toLowerCase();
      const summary = (project.summary ?? "").toLowerCase();
      const status = project.status.toLowerCase();

      return (
        title.includes(normalized) ||
        summary.includes(normalized) ||
        status.includes(normalized) ||
        String(project.project_id).includes(normalized)
      );
    });
  }, [projects, search]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse projects and open detailed pages.
          </Typography>
        </Box>

        <TextField
          label="Search projects"
          placeholder="Search by title, summary, status or ID"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
        />

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
                  {search.trim()
                    ? "No projects match your search."
                    : "No projects found."}
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredProjects.map((project) => (
                  <ListItemButton
                    key={project.project_id}
                    divider
                    onClick={() => navigate(`/projects/${project.project_id}`)}
                  >
                    <ListItemText
                      primary={project.title}
                      secondary={
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mt: 0.5, flexWrap: "wrap" }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {project.summary || "No summary"}
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
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        )}
      </Stack>
    </Box>
  );
}