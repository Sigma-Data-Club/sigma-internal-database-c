import { Alert, Box, CircularProgress, Paper, Stack, Tab, Tabs } from "@mui/material";

import ApplyToProjectDialog from "../dialogs/ApplyToProjectDialog";
import ChangeProjectRoleDialog from "../dialogs/ChangeProjectRoleDialog";
import ConfirmMemberRemoveDialog from "../dialogs/ConfirmMemberRemoveDialog";
import ConfirmProjectDeleteDialog from "../dialogs/ConfirmProjectDeleteDialog";
import DecideProjectApplicationDialog from "../dialogs/DecideProjectApplicationDialog";
import EditProjectDialog from "../dialogs/EditProjectDialog";

import ProjectApplicationsTab from "../components/ProjectApplicationsTab";
import ProjectHeader from "../components/ProjectHeader";
import ProjectMembersTab from "../components/ProjectMembersTab";
import ProjectOverviewCard from "../components/ProjectOverviewCard";

import { useProjectDetails } from "../hooks/useProjectDetails";
import { projectStrings } from "../utils/projectStrings";

export default function ProjectDetailsPage() {
  const vm = useProjectDetails();

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <ProjectHeader
          title={vm.project?.name ?? projectStrings.page.titleFallback}
          canApply={vm.canApply}
          canUpdate={vm.canUpdate}
          canDelete={vm.canDelete}
          showApply={!vm.activeMember && !vm.myPendingApplication}
          onBack={() => vm.navigate("/projects")}
          onApply={() => vm.setApplyOpen(true)}
          onEdit={() => vm.setEditOpen(true)}
          onDelete={() => vm.setDeleteProjectOpen(true)}
        />

        {vm.loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!vm.loading && vm.error && <Alert severity="error">{vm.error}</Alert>}

        {!vm.loading && !vm.error && vm.project && (
          <>
            <ProjectOverviewCard project={vm.project} stats={vm.stats} />

            <Paper sx={{ p: 2 }}>
              <Tabs value={vm.tab} onChange={(_, nextValue) => vm.setTab(nextValue)}>
                <Tab label={projectStrings.tabs.members} />
                <Tab label={projectStrings.tabs.applications} />
              </Tabs>
            </Paper>

            {vm.tab === 0 && (
              <ProjectMembersTab
                members={vm.members}
                canManage={vm.canManage}
                onChangeRole={vm.openChangeRoleDialog}
                onRemove={vm.openRemoveMemberDialog}
              />
            )}

            {vm.tab === 1 && (
              <ProjectApplicationsTab
                applications={vm.applications}
                canManage={vm.canManage}
                currentMemberId={vm.currentMemberId}
                onAccept={(application) =>
                  vm.openDecisionDialog(application, "accepted")
                }
                onReject={(application) =>
                  vm.openDecisionDialog(application, "rejected")
                }
                onWithdraw={(application) =>
                  void vm.withdrawApplication(application.application_id)
                }
              />
            )}
          </>
        )}
      </Stack>

      <EditProjectDialog
        open={vm.editOpen}
        busy={vm.busy}
        value={vm.editForm}
        statuses={vm.projectStatuses}
        onClose={() => vm.setEditOpen(false)}
        onChange={vm.setEditForm}
        onSubmit={() => void vm.submitProjectUpdate()}
      />

      <ApplyToProjectDialog
        open={vm.applyOpen}
        busy={vm.busy}
        value={vm.applyForm}
        onClose={() => vm.setApplyOpen(false)}
        onChange={vm.setApplyForm}
        onSubmit={() => void vm.submitApplication()}
      />

      <ChangeProjectRoleDialog
        open={vm.changeRoleOpen}
        busy={vm.busy}
        memberId={vm.selectedMember?.member_id ?? null}
        role={vm.selectedMember?.project_role ?? ""}
        onClose={() => {
          vm.setChangeRoleOpen(false);
          vm.setSelectedMember(null);
        }}
        onRoleChange={(value: string) => {
          if (!vm.selectedMember) {
            return;
          }

          vm.setSelectedMember({
            ...vm.selectedMember,
            project_role: value,
          });
        }}
        onSubmit={() => void vm.submitRoleChange()}
      />

      <ConfirmProjectDeleteDialog
        open={vm.deleteProjectOpen}
        busy={vm.busy}
        projectName={vm.project?.name ?? ""}
        onClose={() => vm.setDeleteProjectOpen(false)}
        onConfirm={() => void vm.confirmDeleteProject()}
      />

      <ConfirmMemberRemoveDialog
        open={vm.removeMemberOpen}
        busy={vm.busy}
        onClose={() => {
          vm.setRemoveMemberOpen(false);
          vm.setSelectedMember(null);
        }}
        onConfirm={() => void vm.confirmRemoveMember()}
      />

      <DecideProjectApplicationDialog
        open={vm.decideApplicationOpen}
        busy={vm.busy}
        applicationId={vm.selectedApplication?.application_id ?? null}
        mode={vm.decisionMode}
        managerNote={vm.managerNote}
        onClose={() => {
          vm.setDecideApplicationOpen(false);
          vm.setManagerNote("");
        }}
        onManagerNoteChange={vm.setManagerNote}
        onSubmit={() => void vm.submitDecision()}
      />
    </Box>
  );
}