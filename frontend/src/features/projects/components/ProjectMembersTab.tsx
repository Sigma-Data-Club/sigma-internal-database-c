import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { ProjectMember } from "../../../types/project";
import { formatProjectDate } from "../utils/projectFormatters";
import { projectStrings } from "../utils/projectStrings";

type ProjectMembersTabProps = {
  members: ProjectMember[];
  canManage: boolean;
  onChangeRole: (member: ProjectMember) => void;
  onRemove: (member: ProjectMember) => void;
};

export default function ProjectMembersTab({
  members,
  canManage,
  onChangeRole,
  onRemove,
}: ProjectMembersTabProps) {
  if (members.length === 0) {
    return (
      <Typography color="text.secondary">
        {projectStrings.empty.noMembers}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {members.map((member) => (
        <Paper
          key={`${member.project_id}-${member.member_id}`}
          variant="outlined"
          sx={{ p: 2 }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Box>
              <Typography variant="subtitle1">
                {projectStrings.labels.member} #{member.member_id}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {projectStrings.labels.role}: {member.project_role}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {projectStrings.labels.joined}: {formatProjectDate(member.joined_at)}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {projectStrings.labels.left}: {formatProjectDate(member.left_at)}
              </Typography>
            </Box>

            {canManage && (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onChangeRole(member)}
                >
                  {projectStrings.actions.changeRole}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => onRemove(member)}
                >
                  {projectStrings.actions.remove}
                </Button>
              </Stack>
            )}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}