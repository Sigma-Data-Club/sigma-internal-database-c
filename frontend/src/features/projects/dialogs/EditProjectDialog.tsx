import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import type { ProjectStatus } from "../../../types/project";
import { projectStrings } from "../utils/projectStrings";

type EditProjectForm = {
  name: string;
  description: string;
  status: ProjectStatus;
  started_at: string;
  finished_at: string;
};

type EditProjectDialogProps = {
  open: boolean;
  busy: boolean;
  value: EditProjectForm;
  statuses: ProjectStatus[];
  onClose: () => void;
  onChange: (value: EditProjectForm) => void;
  onSubmit: () => void;
};

export default function EditProjectDialog({
  open,
  busy,
  value,
  statuses,
  onClose,
  onChange,
  onSubmit,
}: EditProjectDialogProps) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{projectStrings.dialogs.editProject}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={projectStrings.fields.name}
            value={value.name}
            onChange={(event) =>
              onChange({ ...value, name: event.target.value })
            }
            fullWidth
          />

          <TextField
            label={projectStrings.fields.description}
            value={value.description}
            onChange={(event) =>
              onChange({ ...value, description: event.target.value })
            }
            multiline
            minRows={4}
            fullWidth
          />

          <TextField
            select
            label={projectStrings.fields.status}
            value={value.status}
            onChange={(event) =>
              onChange({
                ...value,
                status: event.target.value as ProjectStatus,
              })
            }
            fullWidth
          >
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={projectStrings.fields.startedAt}
            type="datetime-local"
            value={value.started_at}
            onChange={(event) =>
              onChange({ ...value, started_at: event.target.value })
            }
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label={projectStrings.fields.finishedAt}
            type="datetime-local"
            value={value.finished_at}
            onChange={(event) =>
              onChange({ ...value, finished_at: event.target.value })
            }
            InputLabelProps={{ shrink: true }}
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
          disabled={busy || !value.name.trim()}
        >
          {projectStrings.actions.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}