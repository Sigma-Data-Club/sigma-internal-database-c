import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import { useNavigate, useParams } from "react-router-dom";

import { getProject } from "../api/projects";
import type { Project } from "../types/project";

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProject() {
      if (!projectId) {
        setError("Project ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getProject(projectId);
        setProject(data);
      } catch {
        setError("Failed to load project details.");
      } finally {
        setLoading(false);
      }
    }

    void loadProject();
  }, [projectId]);

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
              {project?.title ?? "Project details"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Detailed project view
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<FolderIcon />}
            onClick={() => navigate("/projects")}
          >
            Back to projects
          </Button>
        </Stack>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && project && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Typography>
                <strong>ID:</strong> {project.project_id}
              </Typography>
              <Typography>
                <strong>Title:</strong> {project.title}
              </Typography>
              <Typography>
                <strong>Summary:</strong> {project.summary ?? "—"}
              </Typography>
              <Box>
                <strong>Status:</strong>{" "}
                <Chip label={project.status} size="small" />
              </Box>
              <Typography>
                <strong>Active:</strong> {project.is_active ? "Yes" : "No"}
              </Typography>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}