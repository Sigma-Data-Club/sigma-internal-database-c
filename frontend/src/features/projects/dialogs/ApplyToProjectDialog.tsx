import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { projectStrings } from "../utils/projectStrings";

type ApplyProjectForm = {
  desired_role: string;
  application_text: string;
};

type ApplyToProjectDialogProps = {
  open: boolean;
  busy: boolean;
  value: ApplyProjectForm;
  onClose: () => void;
  onChange: (value: ApplyProjectForm) => void;
  onSubmit: () => void;
};

export default function ApplyToProjectDialog({
  open,
  busy,
  value,
  onClose,
  onChange,
  onSubmit,
}: ApplyToProjectDialogProps) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{projectStrings.dialogs.applyToProject}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={projectStrings.fields.desiredRole}
            value={value.desired_role}
            onChange={(event) =>
              onChange({ ...value, desired_role: event.target.value })
            }
            fullWidth
          />

          <TextField
            label={projectStrings.fields.applicationText}
            value={value.application_text}
            onChange={(event) =>
              onChange({ ...value, application_text: event.target.value })
            }
            multiline
            minRows={4}
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
          disabled={
            busy ||
            !value.desired_role.trim() ||
            !value.application_text.trim()
          }
        >
          {projectStrings.actions.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}