import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type {
  ProjectApplication,
  ProjectApplicationStatus,
} from "../../../types/project";
import { formatProjectDate } from "../utils/projectFormatters";
import { projectStrings } from "../utils/projectStrings";

type ProjectApplicationsTabProps = {
  applications: ProjectApplication[];
  canManage: boolean;
  currentMemberId: number | null;
  onAccept: (application: ProjectApplication) => void;
  onReject: (application: ProjectApplication) => void;
  onWithdraw: (application: ProjectApplication) => void;
};

export default function ProjectApplicationsTab({
  applications,
  canManage,
  currentMemberId,
  onAccept,
  onReject,
  onWithdraw,
}: ProjectApplicationsTabProps) {
  if (!canManage && applications.length === 0) {
    return (
      <Typography color="text.secondary">
        {projectStrings.empty.managerOnlyApplications}
      </Typography>
    );
  }

  if (applications.length === 0) {
    return (
      <Typography color="text.secondary">
        {projectStrings.empty.noApplications}
      </Typography>
    );
  }

  function getChipColor(status: ProjectApplicationStatus) {
    if (status === "accepted") return "success";
    if (status === "rejected") return "error";
    if (status === "withdrawn") return "default";
    return "info";
  }

  return (
    <Stack spacing={1.5}>
      {applications.map((application) => (
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
              <Stack spacing={0.5}>
                <Typography variant="subtitle1">
                  Solicitud #{application.application_id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {projectStrings.labels.member} #{application.member_id}
                </Typography>
              </Stack>

              <Chip
                label={application.status}
                color={getChipColor(application.status)}
                size="small"
              />
            </Stack>

            <Typography variant="body2">
              <strong>{projectStrings.fields.desiredRole}:</strong>{" "}
              {application.desired_role}
            </Typography>

            <Typography variant="body2">
              <strong>{projectStrings.labels.applicationText}:</strong>{" "}
              {application.application_text || "—"}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {projectStrings.labels.applied}:{" "}
              {formatProjectDate(application.created_at)}
            </Typography>

            {application.manager_note && (
              <Typography variant="body2">
                <strong>{projectStrings.labels.managerNote}:</strong>{" "}
                {application.manager_note}
              </Typography>
            )}

            {canManage && application.status === "pending" && (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => onAccept(application)}
                >
                  {projectStrings.actions.accept}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => onReject(application)}
                >
                  {projectStrings.actions.reject}
                </Button>
              </Stack>
            )}

            {!canManage &&
              currentMemberId === application.member_id &&
              application.status === "pending" && (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    onClick={() => onWithdraw(application)}
                  >
                    {projectStrings.actions.withdraw}
                  </Button>
                </Stack>
              )}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}