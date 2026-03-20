import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";

import { getProjectStats, listProjects } from "../../../api/projects";
import { useAuth } from "../../../context/AuthContext";
import { hasPermission } from "../../../auth/permissions";
import type { Project, ProjectStats, ProjectStatus } from "../../../types/project";
import { extractProjectApiErrorMessage } from "../utils/projectErrors";

type ProjectWithStats = {
  project: Project;
  stats: ProjectStats | null;
};

const PROJECT_STATUSES: Array<{ value: "" | ProjectStatus; label: string }> = [
  { value: "", label: "Todos los estados" },
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "finished", label: "Finished" },
  { value: "archived", label: "Archived" },
];

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, minWidth: 190 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 1 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function ProjectAnalyticsPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [rows, setRows] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ProjectStatus>("");
  const [topLimit, setTopLimit] = useState("10");

  const canReadProjects = hasPermission(user, "project.read");
  const canReadStats = hasPermission(user, "project.stats.read");

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const projectsResponse = await listProjects({
        limit: 100,
        offset: 0,
      });

      const projects = projectsResponse.items;

      const statsResults = await Promise.all(
        projects.map(async (project) => {
          try {
            const stats = await getProjectStats(project.project_id);
            return {
              project,
              stats,
            };
          } catch {
            return {
              project,
              stats: null,
            };
          }
        }),
      );

      setRows(statsResults);
    } catch (err) {
      setError(
        extractProjectApiErrorMessage(
          err,
          "No se pudo cargar la analítica de proyectos.",
        ),
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

    if (!canReadProjects || !canReadStats) {
      setError("No tienes permisos para ver la analítica de proyectos.");
      setLoading(false);
      return;
    }

    void loadData();
  }, [authLoading, canReadProjects, canReadStats]);

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return rows.filter(({ project }) => {
      if (statusFilter && project.status !== statusFilter) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return (
        project.name.toLowerCase().includes(normalized) ||
        (project.description ?? "").toLowerCase().includes(normalized) ||
        String(project.project_id).includes(normalized) ||
        project.status.toLowerCase().includes(normalized)
      );
    });
  }, [rows, search, statusFilter]);

  const aggregated = useMemo(() => {
    const totalProjects = filteredRows.length;
    const planned = filteredRows.filter((row) => row.project.status === "planned").length;
    const active = filteredRows.filter((row) => row.project.status === "active").length;
    const finished = filteredRows.filter((row) => row.project.status === "finished").length;
    const archived = filteredRows.filter((row) => row.project.status === "archived").length;

    const totalMembers = filteredRows.reduce(
      (sum, row) => sum + (row.stats?.members_total ?? 0),
      0,
    );
    const activeMembers = filteredRows.reduce(
      (sum, row) => sum + (row.stats?.members_active ?? 0),
      0,
    );
    const pendingApplications = filteredRows.reduce(
      (sum, row) => sum + (row.stats?.applications_pending ?? 0),
      0,
    );
    const totalIncome = filteredRows.reduce(
      (sum, row) => sum + (row.stats?.finance_income_total ?? 0),
      0,
    );
    const totalExpense = filteredRows.reduce(
      (sum, row) => sum + (row.stats?.finance_expense_total ?? 0),
      0,
    );
    const totalBalance = filteredRows.reduce(
      (sum, row) => sum + (row.stats?.finance_balance ?? 0),
      0,
    );

    return {
      totalProjects,
      planned,
      active,
      finished,
      archived,
      totalMembers,
      activeMembers,
      pendingApplications,
      totalIncome,
      totalExpense,
      totalBalance,
    };
  }, [filteredRows]);

  const featuredProjects = useMemo(() => {
    const parsedTop = Number(topLimit);
    const limit =
      Number.isInteger(parsedTop) && parsedTop > 0 ? parsedTop : 10;

    return [...filteredRows]
      .sort(
        (a, b) =>
          (b.stats?.members_active ?? 0) - (a.stats?.members_active ?? 0),
      )
      .slice(0, limit);
  }, [filteredRows, topLimit]);

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
              Analítica de proyectos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resumen global de proyectos, miembros, solicitudes y finanzas.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/projects")}
            >
              Volver a proyectos
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => void loadData(true)}
              disabled={refreshing}
            >
              Actualizar
            </Button>
          </Stack>
        </Stack>

        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Buscar proyecto"
              placeholder="Nombre, descripción, ID o estado"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              fullWidth
            />

            <TextField
              select
              label="Estado"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "" | ProjectStatus)
              }
              sx={{ minWidth: 220 }}
            >
              {PROJECT_STATUSES.map((status) => (
                <MenuItem key={status.label} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Top proyectos"
              type="number"
              value={topLimit}
              onChange={(event) => setTopLimit(event.target.value)}
              inputProps={{ min: 1 }}
              sx={{ minWidth: 160 }}
            />
          </Stack>
        </Paper>

        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Cargando analítica de proyectos...</Typography>
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
          <>
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
              <StatCard label="Proyectos totales" value={aggregated.totalProjects} />
              <StatCard label="Planned" value={aggregated.planned} />
              <StatCard label="Active" value={aggregated.active} />
              <StatCard label="Finished" value={aggregated.finished} />
              <StatCard label="Archived" value={aggregated.archived} />
              <StatCard label="Miembros totales" value={aggregated.totalMembers} />
              <StatCard label="Miembros activos" value={aggregated.activeMembers} />
              <StatCard
                label="Solicitudes pendientes"
                value={aggregated.pendingApplications}
              />
              <StatCard
                label="Ingresos totales"
                value={aggregated.totalIncome}
              />
              <StatCard
                label="Gastos totales"
                value={aggregated.totalExpense}
              />
              <StatCard
                label="Balance total"
                value={aggregated.totalBalance}
              />
            </Stack>

            <Paper sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Typography variant="h6">Proyectos destacados</Typography>

                {featuredProjects.length === 0 ? (
                  <Typography color="text.secondary">
                    No hay datos para mostrar.
                  </Typography>
                ) : (
                  featuredProjects.map(({ project, stats }) => (
                    <Paper
                      key={project.project_id}
                      variant="outlined"
                      sx={{ p: 2 }}
                    >
                      <Stack spacing={0.75}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Typography variant="subtitle1" fontWeight={600}>
                            {project.name}
                          </Typography>

                          <Button
                            size="small"
                            onClick={() =>
                              navigate(
                                `/projects/${project.project_id}/manage?tab=overview`,
                              )
                            }
                          >
                            Ver proyecto
                          </Button>
                        </Stack>

                        <Typography variant="body2" color="text.secondary">
                          ID: {project.project_id} · Estado: {project.status}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Miembros totales: {stats?.members_total ?? 0} · Miembros activos:{" "}
                          {stats?.members_active ?? 0} · Solicitudes pendientes:{" "}
                          {stats?.applications_pending ?? 0}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Ingresos: {stats?.finance_income_total ?? 0} · Gastos:{" "}
                          {stats?.finance_expense_total ?? 0} · Balance:{" "}
                          {stats?.finance_balance ?? 0}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            </Paper>
          </>
        )}
      </Stack>
    </Box>
  );
}