import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { projectStrings } from "../utils/projectStrings";

type ConfirmMemberRemoveDialogProps = {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmMemberRemoveDialog({
  open,
  busy,
  onClose,
  onConfirm,
}: ConfirmMemberRemoveDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title={projectStrings.dialogs.confirmRemoveMember}
      description={projectStrings.confirmations.removeMember}
      confirmText={projectStrings.actions.remove}
      cancelText={projectStrings.actions.cancel}
      confirmColor="error"
      loading={busy}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}