import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { projectStrings } from "../utils/projectStrings";

type ChangeProjectRoleDialogProps = {
  open: boolean;
  busy: boolean;
  memberId: number | null;
  role: string;
  onClose: () => void;
  onRoleChange: (value: string) => void;
  onSubmit: () => void;
};

export default function ChangeProjectRoleDialog({
  open,
  busy,
  memberId,
  role,
  onClose,
  onRoleChange,
  onSubmit,
}: ChangeProjectRoleDialogProps) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{projectStrings.dialogs.changeRole}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {memberId !== null && (
            <Typography color="text.secondary">
              {projectStrings.labels.member} #{memberId}
            </Typography>
          )}

          <TextField
            label={projectStrings.fields.projectRole}
            value={role}
            onChange={(event) => onRoleChange(event.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {projectStrings.actions.cancel}
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={busy || !role.trim()}
        >
          {projectStrings.actions.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}