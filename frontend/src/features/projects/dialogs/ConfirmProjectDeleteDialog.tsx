import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { projectStrings } from "../utils/projectStrings";

type ConfirmProjectDeleteDialogProps = {
  open: boolean;
  busy: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmProjectDeleteDialog({
  open,
  busy,
  projectName,
  onClose,
  onConfirm,
}: ConfirmProjectDeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title={projectStrings.dialogs.confirmDeleteProject}
      description={projectStrings.confirmations.deleteProject(projectName)}
      confirmText={projectStrings.actions.delete}
      cancelText={projectStrings.actions.cancel}
      confirmColor="error"
      loading={busy}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}