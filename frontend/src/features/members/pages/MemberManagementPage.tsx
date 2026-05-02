import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  activateMember,
  addMemberRole,
  deactivateMember,
  getMember,
  getMemberEventsSummary,
  getMemberRoles,
  listMemberEvents,
  removeMemberRole,
  replaceMemberRoles,
  updateMember,
} from "../../../api/member";
import { hasPermission } from "../../../auth/permissions";
import { useAuth } from "../../../context/AuthContext";
import type { Event } from "../../../types/event";
import type { Member, MemberRole } from "../../../types/member";
import { memberStrings } from "../utils/memberStrings";

type MemberManagementTab = "overview" | "roles" | "events" | "summary";

type EditFormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  academic_program_id: string;
  study_year: string;
};

function getTabFromSearchParams(searchParams: URLSearchParams): MemberManagementTab {
  const tab = searchParams.get("tab");

  if (
    tab === "overview" ||
    tab === "roles" ||
    tab === "events" ||
    tab === "summary"
  ) {
    return tab;
  }

  return "overview";
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const detail = error.response?.data;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (
    detail &&
    typeof detail === "object" &&
    "detail" in detail &&
    typeof detail.detail === "string"
  ) {
    return detail.detail;
  }

  return fallback;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function normalizeEventsResponse(data: Event[] | { items?: Event[] } | unknown): Event[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object" && "items" in data) {
    const items = (data as { items?: Event[] }).items;
    return Array.isArray(items) ? items : [];
  }

  return [];
}

function normalizeRoles(roles: MemberRole[]): MemberRole[] {
  return roles.map((role) => ({
    ...role,
    role_name: role.role_name ?? role.name ?? role.code ?? `Role ${role.role_id}`,
  }));
}

function buildEditForm(member: Member): EditFormState {
  return {
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    phone: member.phone ?? "",
    academic_program_id:
      member.academic_program_id !== null
        ? String(member.academic_program_id)
        : "",
    study_year: member.study_year !== null ? String(member.study_year) : "",
  };
}

function SummaryValue({ value }: { value: unknown }) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return <Typography color="text.secondary">—</Typography>;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <Typography variant="h6">{String(value)}</Typography>;
  }

  if (Array.isArray(value)) {
    return (
      <Typography variant="body2" color="text.secondary">
        {value.length} item(s)
      </Typography>
    );
  }

  return (
    <Typography variant="body2" color="text.secondary">
      {JSON.stringify(value)}
    </Typography>
  );
}

export default function MemberManagementPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const [member, setMember] = useState<Member | null>(null);
  const [roles, setRoles] = useState<MemberRole[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);

  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);
  const [tabError, setTabError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  const [editForm, setEditForm] = useState<EditFormState>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    academic_program_id: "",
    study_year: "",
  });

  const [addRoleId, setAddRoleId] = useState("");
  const [replaceRoleIds, setReplaceRoleIds] = useState("");

  const activeTab = getTabFromSearchParams(searchParams);

  const canReadMemberDetails = hasPermission(user, "member.read");
  const canUpdateMember = hasPermission(user, "member.update");
  const canManageRoles =
    hasPermission(user, "member.role.update") ||
    hasPermission(user, "member.update") ||
    hasPermission(user, "member.manage");
  const canChangeActivation =
    hasPermission(user, "member.activate") ||
    hasPermission(user, "member.deactivate") ||
    hasPermission(user, "member.update") ||
    hasPermission(user, "member.manage");

  const summaryEntries = useMemo(() => {
    if (!summary) {
      return [];
    }

    return Object.entries(summary);
  }, [summary]);

  const loadBaseData = async () => {
    if (authLoading) {
      return;
    }

    if (!canReadMemberDetails) {
      setPageError(memberStrings.errors.noReadPermission);
      setLoading(false);
      return;
    }

    if (!memberId) {
      setPageError(memberStrings.errors.missingId);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError(null);

      const data = await getMember(memberId);
      setMember(data);
      setEditForm(buildEditForm(data));
    } catch (error) {
      setPageError(
        extractApiErrorMessage(error, memberStrings.errors.loadMemberFailed),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab: MemberManagementTab) => {
    if (!memberId) {
      return;
    }

    try {
      setTabLoading(true);
      setTabError(null);

      if (tab === "roles") {
        const data = await getMemberRoles(memberId);
        setRoles(normalizeRoles(data));
      }

      if (tab === "events") {
        const data = await listMemberEvents(memberId);
        setEvents(normalizeEventsResponse(data));
      }

      if (tab === "summary") {
        const data = await getMemberEventsSummary(memberId);
        setSummary((data ?? null) as Record<string, unknown> | null);
      }
    } catch (error) {
      if (tab === "roles") {
        setTabError(
          extractApiErrorMessage(error, memberStrings.errors.loadRolesFailed),
        );
      } else if (tab === "events") {
        setTabError(
          extractApiErrorMessage(error, memberStrings.errors.loadEventsFailed),
        );
      } else if (tab === "summary") {
        setTabError(
          extractApiErrorMessage(error, memberStrings.errors.loadSummaryFailed),
        );
      }
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    void loadBaseData();
  }, [memberId, authLoading, canReadMemberDetails]);

  useEffect(() => {
    if (!loading && !pageError) {
      void loadTabData(activeTab);
    }
  }, [activeTab, loading, pageError, memberId]);

  const handleTabChange = (_event: SyntheticEvent, newValue: MemberManagementTab) => {
    setSearchParams({ tab: newValue });
    setSuccessMessage(null);
  };

  const handleRefreshCurrentTab = async () => {
    await loadTabData(activeTab);
  };

  const handleOpenEdit = () => {
    if (!member) {
      return;
    }

    setEditForm(buildEditForm(member));
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!memberId) {
      return;
    }

    try {
      setActionLoading(true);
      setPageError(null);
      setSuccessMessage(null);

      const updated = await updateMember(memberId, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() ? editForm.phone.trim() : null,
        academic_program_id: editForm.academic_program_id.trim()
          ? Number(editForm.academic_program_id)
          : null,
        study_year: editForm.study_year.trim()
          ? Number(editForm.study_year)
          : null,
      });

      setMember(updated);
      setEditForm(buildEditForm(updated));
      setEditOpen(false);
      setSuccessMessage(memberStrings.success.updated);
    } catch (error) {
      setPageError(
        extractApiErrorMessage(error, memberStrings.errors.updateFailed),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!memberId) {
      return;
    }

    try {
      setActionLoading(true);
      setPageError(null);
      setSuccessMessage(null);

      await activateMember(memberId);

      if (member) {
        setMember({ ...member, is_active: true });
      }

      setActivateDialogOpen(false);
      setSuccessMessage(memberStrings.success.activated);
    } catch (error) {
      setPageError(
        extractApiErrorMessage(error, memberStrings.errors.activateFailed),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!memberId) {
      return;
    }

    try {
      setActionLoading(true);
      setPageError(null);
      setSuccessMessage(null);

      await deactivateMember(memberId);

      if (member) {
        setMember({ ...member, is_active: false });
      }

      setDeactivateDialogOpen(false);
      setSuccessMessage(memberStrings.success.deactivated);
    } catch (error) {
      setPageError(
        extractApiErrorMessage(error, memberStrings.errors.deactivateFailed),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!memberId) {
      return;
    }

    const normalized = addRoleId.trim();

    if (!normalized || Number.isNaN(Number(normalized))) {
      setTabError(memberStrings.errors.invalidRoleId);
      return;
    }

    try {
      setActionLoading(true);
      setTabError(null);
      setSuccessMessage(null);

      await addMemberRole(memberId, Number(normalized));
      const updatedRoles = await getMemberRoles(memberId);
      setRoles(normalizeRoles(updatedRoles));
      setAddRoleId("");
      setSuccessMessage(memberStrings.success.roleAdded);
    } catch (error) {
      setTabError(
        extractApiErrorMessage(error, memberStrings.errors.addRoleFailed),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveRole = async (roleId: number) => {
    if (!memberId) {
      return;
    }

    try {
      setActionLoading(true);
      setTabError(null);
      setSuccessMessage(null);

      await removeMemberRole(memberId, roleId);
      setRoles((previous) => previous.filter((role) => role.role_id !== roleId));
      setSuccessMessage(memberStrings.success.roleRemoved);
    } catch (error) {
      setTabError(
        extractApiErrorMessage(error, memberStrings.errors.removeRoleFailed),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplaceRoles = async () => {
    if (!memberId) {
      return;
    }

    const parsedIds = replaceRoleIds
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => Number(value))
      .filter((value) => !Number.isNaN(value));

    try {
      setActionLoading(true);
      setTabError(null);
      setSuccessMessage(null);

      await replaceMemberRoles(memberId, { role_ids: parsedIds });

      const updatedRoles = await getMemberRoles(memberId);
      setRoles(normalizeRoles(updatedRoles));
      setSuccessMessage(memberStrings.success.rolesReplaced);
    } catch (error) {
      setTabError(
        extractApiErrorMessage(error, memberStrings.errors.replaceRolesFailed),
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              {memberStrings.managementTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {memberStrings.managementSubtitle}
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/members")}
            >
              {memberStrings.backToMembers}
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => void handleRefreshCurrentTab()}
              disabled={tabLoading || loading}
            >
              Refresh tab
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && pageError && <Alert severity="error">{pageError}</Alert>}

        {!loading && !pageError && member && (
          <>
            {successMessage && <Alert severity="success">{successMessage}</Alert>}
            {tabError && <Alert severity="error">{tabError}</Alert>}

            <Paper sx={{ p: 2.5 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={2}
              >
                <Box>
                  <Typography variant="h5">
                    {member.first_name} {member.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.email}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label={member.is_active ? "Active" : "Inactive"}
                    color={member.is_active ? "success" : "default"}
                    variant={member.is_active ? "filled" : "outlined"}
                  />
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                flexWrap="wrap"
              >
                {canUpdateMember && (
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={handleOpenEdit}
                    disabled={actionLoading}
                  >
                    {memberStrings.overview.edit}
                  </Button>
                )}

                {canChangeActivation && member.is_active && (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<PersonOffIcon />}
                    onClick={() => setDeactivateDialogOpen(true)}
                    disabled={actionLoading}
                  >
                    {memberStrings.overview.deactivate}
                  </Button>
                )}

                {canChangeActivation && !member.is_active && (
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<PersonAddAlt1Icon />}
                    onClick={() => setActivateDialogOpen(true)}
                    disabled={actionLoading}
                  >
                    {memberStrings.overview.activate}
                  </Button>
                )}
              </Stack>
            </Paper>

            <Paper>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab value="overview" label={memberStrings.tabs.overview} />
                <Tab value="roles" label={memberStrings.tabs.roles} />
                <Tab value="events" label={memberStrings.tabs.events} />
                <Tab value="summary" label={memberStrings.tabs.summary} />
              </Tabs>
            </Paper>

            {activeTab === "overview" && (
              <Paper sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                  <Typography>
                    <strong>{memberStrings.overview.memberId}:</strong>{" "}
                    {member.member_id}
                  </Typography>
                  <Typography>
                    <strong>{memberStrings.overview.email}:</strong> {member.email}
                  </Typography>
                  <Typography>
                    <strong>{memberStrings.overview.phone}:</strong>{" "}
                    {member.phone || "—"}
                  </Typography>
                  <Typography>
                    <strong>{memberStrings.overview.academicProgramId}:</strong>{" "}
                    {member.academic_program_id ?? "—"}
                  </Typography>
                  <Typography>
                    <strong>{memberStrings.overview.studyYear}:</strong>{" "}
                    {member.study_year ?? "—"}
                  </Typography>
                  <Typography>
                    <strong>{memberStrings.overview.active}:</strong>{" "}
                    {member.is_active
                      ? memberStrings.overview.yes
                      : memberStrings.overview.no}
                  </Typography>
                </Stack>
              </Paper>
            )}

            {activeTab === "roles" && (
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6">
                      {memberStrings.roles.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {memberStrings.roles.helper}
                    </Typography>
                  </Box>

                  {canManageRoles && (
                    <>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1.5}
                        alignItems={{ xs: "stretch", md: "center" }}
                      >
                        <TextField
                          label={memberStrings.roles.roleId}
                          value={addRoleId}
                          onChange={(event) => setAddRoleId(event.target.value)}
                          size="small"
                          sx={{ maxWidth: 220 }}
                        />
                        <Button
                          variant="contained"
                          onClick={() => void handleAddRole()}
                          disabled={actionLoading}
                        >
                          {memberStrings.roles.addRole}
                        </Button>
                      </Stack>

                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1.5}
                        alignItems={{ xs: "stretch", md: "center" }}
                      >
                        <TextField
                          label={memberStrings.roles.roleIds}
                          placeholder={memberStrings.roles.roleIdsPlaceholder}
                          value={replaceRoleIds}
                          onChange={(event) =>
                            setReplaceRoleIds(event.target.value)
                          }
                          fullWidth
                        />
                        <Button
                          variant="outlined"
                          onClick={() => void handleReplaceRoles()}
                          disabled={actionLoading}
                        >
                          {memberStrings.roles.replaceRoles}
                        </Button>
                      </Stack>
                    </>
                  )}

                  <Divider />

                  <Typography variant="subtitle1">
                    {memberStrings.roles.currentRoles}
                  </Typography>

                  {tabLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : roles.length === 0 ? (
                    <Typography color="text.secondary">
                      {memberStrings.roles.empty}
                    </Typography>
                  ) : (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {roles.map((role) => (
                        <Chip
                          key={role.role_id}
                          label={`${role.role_name ?? `Role ${role.role_id}`} (#${role.role_id})`}
                          onDelete={
                            canManageRoles
                              ? () => void handleRemoveRole(role.role_id)
                              : undefined
                          }
                          deleteIcon={<DeleteOutlineIcon />}
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Paper>
            )}

            {activeTab === "events" && (
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">{memberStrings.events.title}</Typography>

                  {tabLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : events.length === 0 ? (
                    <Typography color="text.secondary">
                      {memberStrings.events.empty}
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {events.map((eventItem) => (
                        <Paper
                          key={eventItem.event_id}
                          variant="outlined"
                          sx={{ p: 2 }}
                        >
                          <Stack spacing={1}>
                            <Typography variant="subtitle1">
                              {eventItem.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>{memberStrings.events.start}:</strong>{" "}
                              {formatDateTime(eventItem.start_datetime)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>{memberStrings.events.end}:</strong>{" "}
                              {formatDateTime(eventItem.end_datetime)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>{memberStrings.events.speaker}:</strong>{" "}
                              {eventItem.speaker_name || "—"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>{memberStrings.events.topic}:</strong>{" "}
                              {eventItem.topic || "—"}
                            </Typography>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Paper>
            )}

            {activeTab === "summary" && (
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">{memberStrings.summary.title}</Typography>

                  {tabLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : !summary || summaryEntries.length === 0 ? (
                    <Typography color="text.secondary">
                      {memberStrings.summary.empty}
                    </Typography>
                  ) : (
                    <Stack
                      direction="row"
                      spacing={2}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {summaryEntries.map(([key, value]) => (
                        <Paper
                          key={key}
                          variant="outlined"
                          sx={{ p: 2, minWidth: 180 }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {key}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <SummaryValue value={value} />
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Paper>
            )}
          </>
        )}
      </Stack>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{memberStrings.overview.edit}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="First name"
              value={editForm.first_name}
              onChange={(event) =>
                setEditForm((previous) => ({
                  ...previous,
                  first_name: event.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="Last name"
              value={editForm.last_name}
              onChange={(event) =>
                setEditForm((previous) => ({
                  ...previous,
                  last_name: event.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="Email"
              value={editForm.email}
              onChange={(event) =>
                setEditForm((previous) => ({
                  ...previous,
                  email: event.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="Phone"
              value={editForm.phone}
              onChange={(event) =>
                setEditForm((previous) => ({
                  ...previous,
                  phone: event.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="Academic program ID"
              value={editForm.academic_program_id}
              onChange={(event) =>
                setEditForm((previous) => ({
                  ...previous,
                  academic_program_id: event.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="Study year"
              value={editForm.study_year}
              onChange={(event) =>
                setEditForm((previous) => ({
                  ...previous,
                  study_year: event.target.value,
                }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>
            {memberStrings.overview.cancel}
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveEdit()}
            disabled={actionLoading}
          >
            {memberStrings.overview.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={activateDialogOpen}
        onClose={() => setActivateDialogOpen(false)}
      >
        <DialogTitle>{memberStrings.dialogs.activateTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {memberStrings.dialogs.activateDescription}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivateDialogOpen(false)}>
            {memberStrings.dialogs.close}
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => void handleActivate()}
            disabled={actionLoading}
          >
            {memberStrings.dialogs.confirm}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
      >
        <DialogTitle>{memberStrings.dialogs.deactivateTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {memberStrings.dialogs.deactivateDescription}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateDialogOpen(false)}>
            {memberStrings.dialogs.close}
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => void handleDeactivate()}
            disabled={actionLoading}
          >
            {memberStrings.dialogs.confirm}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}