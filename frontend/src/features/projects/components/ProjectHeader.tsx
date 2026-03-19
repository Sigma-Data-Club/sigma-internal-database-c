import FolderIcon from "@mui/icons-material/Folder";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import { Button } from "@mui/material";
import PageHeader from "../../../components/common/PageHeader";
import { projectStrings } from "../utils/projectStrings";

type ProjectHeaderProps = {
  title: string;
  canApply: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  showApply: boolean;
  onBack: () => void;
  onApply: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ProjectHeader({
  title,
  canApply,
  canUpdate,
  canDelete,
  showApply,
  onBack,
  onApply,
  onEdit,
  onDelete,
}: ProjectHeaderProps) {
  return (
    <PageHeader
      title={title}
      subtitle={projectStrings.page.subtitle}
      actions={
        <>
          <Button variant="outlined" startIcon={<FolderIcon />} onClick={onBack}>
            {projectStrings.actions.back}
          </Button>

          {canApply && showApply && (
            <Button variant="contained" startIcon={<HowToRegIcon />} onClick={onApply}>
              {projectStrings.actions.apply}
            </Button>
          )}

          {canUpdate && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<EditIcon />}
              onClick={onEdit}
            >
              {projectStrings.actions.edit}
            </Button>
          )}

          {canDelete && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
            >
              {projectStrings.actions.delete}
            </Button>
          )}
        </>
      }
    />
  );
}