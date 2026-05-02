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
import type { ProjectApplicationStatus } from "../../../types/project";
import { projectStrings } from "../utils/projectStrings";

type DecideProjectApplicationDialogProps = {
  open: boolean;
  busy: boolean;
  applicationId: number | null;
  mode: Extract<ProjectApplicationStatus, "accepted" | "rejected">;
  managerNote: string;
  onClose: () => void;
  onManagerNoteChange: (value: string) => void;
  onSubmit: () => void;
};

export default function DecideProjectApplicationDialog({
  open,
  busy,
  applicationId,
  mode,
  managerNote,
  onClose,
  onManagerNoteChange,
  onSubmit,
}: DecideProjectApplicationDialogProps) {
  const actionText =
    mode === "accepted"
      ? projectStrings.actions.accept
      : projectStrings.actions.reject;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{projectStrings.dialogs.reviewApplication}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {applicationId !== null && (
            <Typography color="text.secondary">
              Solicitud #{applicationId}
            </Typography>
          )}

          <TextField
            label={projectStrings.fields.managerNote}
            value={managerNote}
            onChange={(event) => onManagerNoteChange(event.target.value)}
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
        <Button variant="contained" onClick={onSubmit} disabled={busy}>
          {actionText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}