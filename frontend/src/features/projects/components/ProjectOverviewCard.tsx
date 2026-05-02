import { Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import type { Project, ProjectStats } from "../../../types/project";
import { formatProjectDate } from "../utils/projectFormatters";
import { projectStrings } from "../utils/projectStrings";

type ProjectOverviewCardProps = {
  project: Project;
  stats: ProjectStats | null;
};

export default function ProjectOverviewCard({
  project,
  stats,
}: ProjectOverviewCardProps) {
  return (
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
          {project.description || projectStrings.empty.noDescription}
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <Typography>
            <strong>{projectStrings.labels.started}:</strong>{" "}
            {formatProjectDate(project.started_at)}
          </Typography>
          <Typography>
            <strong>{projectStrings.labels.finished}:</strong>{" "}
            {formatProjectDate(project.finished_at)}
          </Typography>
        </Stack>

        {stats && (
          <>
            <Divider />
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Typography>
                <strong>{projectStrings.stats.membersTotal}:</strong>{" "}
                {stats.members_total}
              </Typography>
              <Typography>
                <strong>{projectStrings.stats.membersActive}:</strong>{" "}
                {stats.members_active}
              </Typography>
              <Typography>
                <strong>{projectStrings.stats.pendingApplications}:</strong>{" "}
                {stats.applications_pending}
              </Typography>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Typography>
                <strong>{projectStrings.stats.income}:</strong>{" "}
                {stats.finance_income_total ?? "—"}
              </Typography>
              <Typography>
                <strong>{projectStrings.stats.expenses}:</strong>{" "}
                {stats.finance_expense_total ?? "—"}
              </Typography>
              <Typography>
                <strong>{projectStrings.stats.balance}:</strong>{" "}
                {stats.finance_balance ?? "—"}
              </Typography>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}