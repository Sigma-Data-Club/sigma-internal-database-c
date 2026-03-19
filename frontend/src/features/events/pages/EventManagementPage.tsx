import { useEffect, useMemo, useState } from "react";
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
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  decideEventApplication,
  deleteEvent,
  getEvent,
  getEventStats,
  listEventApplications,
  updateEventAttendance,
} from "../../../api/events";
import { useAuth } from "../../../context/AuthContext";
import { hasAnyPermission, hasPermission } from "../../../auth/permissions";
import type {
  DecisionStatus,
  Event,
  EventApplication,
  EventStats,
} from "../../../types/event";
import { eventStrings } from "../utils/eventStrings";
import { extractEventApiErrorMessage } from "../utils/eventErrors";
import {
  canManageAttendance,
  canManageAttendanceForApplication,
  filterApplicationsBySearch,
  formatEventDateTime,
  getAttendanceModeLabel,
  getAttendanceStatusLabel,
  getDecisionStatusLabel,
  getEventPhase,
  getEventPhaseChipColor,
  getEventPhaseLabel,
  getManagementTabFromSearchParams,
  sortApplicationsByAppliedAt,
  type EventManagementTab,
} from "../utils/eventHelpers";

type SortDirection = "newest" | "oldest";

const decisionOptions: DecisionStatus[] = [
  "pending",
  "accepted",
  "rejected",
  "waitlisted",
  "cancelled",
];

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, minWidth: 180 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ mt: 1 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function EventManagementPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user, isLoading: authLoading } = useAuth();

  const [eventData, setEventData] = useState<Event | null>(null);
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [busyMemberId, setBusyMemberId] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>("newest");
  const [topN, setTopN] = useState("5");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const canReadEvents = hasPermission(user, "event.read");
  const canUpdateEvent = hasPermission(user, "event.update");
  const canDeleteEvent = hasPermission(user, "event.delete");
  const canDecideApplications = hasPermission(user, "event.decide");
  const canHandleAttendance = hasAnyPermission(user, [
    "event.attendance",
    "event.decide",
  ]);
  const canReadEventStats = hasPermission(user, "event.stats.read");

  const canAccessManagement =
    canUpdateEvent ||
    canDeleteEvent ||
    canDecideApplications ||
    canHandleAttendance ||
    canReadEventStats;

  const currentTab = getManagementTabFromSearchParams(searchParams);

  async function loadData(showRefresh = false) {
    if (!eventId) {
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);
      setActionError(null);

      const eventPromise = getEvent(eventId);
      const appsPromise =
        canDecideApplications || canHandleAttendance
          ? listEventApplications(eventId)
          : Promise.resolve(null);
      const statsPromise = canReadEventStats
        ? getEventStats(eventId)
        : Promise.resolve(null);

      const [eventResult, appsResult, statsResult] = await Promise.all([
        eventPromise,
        appsPromise,
        statsPromise,
      ]);

      setEventData(eventResult);
      setApplications(appsResult?.items ?? []);
      setStats(statsResult);
    } catch (err) {
      setError(
        extractEventApiErrorMessage(
          err,
          eventStrings.messages.failedToLoadManagement,
        ),
      );
    } finally {
      if (showRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!canReadEvents) {
      setError(eventStrings.messages.noEventsPermission);
      setLoading(false);
      return;
    }

    if (!canAccessManagement) {
      setError(eventStrings.messages.noManagementPermission);
      setLoading(false);
      return;
    }

    if (!eventId) {
      setError(eventStrings.messages.missingEventId);
      setLoading(false);
      return;
    }

    void loadData();
  }, [
    authLoading,
    canReadEvents,
    canAccessManagement,
    canReadEventStats,
    canDecideApplications,
    canHandleAttendance,
    eventId,
  ]);

  const filteredApplications = useMemo(() => {
    let result = filterApplicationsBySearch(applications, search);

    if (onlyPending) {
      result = result.filter((item) => item.decision_status === "pending");
    }

    return sortApplicationsByAppliedAt(result, sortDirection);
  }, [applications, search, onlyPending, sortDirection]);

  const pendingApplications = useMemo(() => {
    return filteredApplications.filter((item) => item.decision_status === "pending");
  }, [filteredApplications]);

  const topNNumber = Number(topN);
  const topNPending =
    Number.isInteger(topNNumber) && topNNumber > 0
      ? pendingApplications.slice(0, topNNumber)
      : [];

  const attendanceEnabledForEvent = eventData ? canManageAttendance(eventData) : false;

  const handleTabChange = (_: React.SyntheticEvent, value: EventManagementTab) => {
    setSearchParams({ tab: value });
  };

  const handleDecision = async (
    memberId: number,
    decisionStatus: DecisionStatus,
  ) => {
    if (!eventId) {
      return;
    }

    try {
      setBusyMemberId(memberId);
      setActionError(null);

      const updated = await decideEventApplication(eventId, memberId, {
        decision_status: decisionStatus,
      });

      setApplications((current) =>
        current.map((item) => (item.member_id === memberId ? updated : item)),
      );
    } catch (err) {
      setActionError(
        extractEventApiErrorMessage(
          err,
          eventStrings.messages.failedToUpdateDecision,
        ),
      );
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleAttendance = async (
    memberId: number,
    attendanceStatus: "attended" | "no_show",
  ) => {
    if (!eventId) {
      return;
    }

    try {
      setBusyMemberId(memberId);
      setActionError(null);

      const updated = await updateEventAttendance(eventId, memberId, {
        attendance_status: attendanceStatus,
      });

      setApplications((current) =>
        current.map((item) => (item.member_id === memberId ? updated : item)),
      );
    } catch (err) {
      setActionError(
        extractEventApiErrorMessage(
          err,
          eventStrings.messages.failedToUpdateAttendance,
        ),
      );
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleApproveMany = async (items: EventApplication[]) => {
    if (!eventId || items.length === 0) {
      return;
    }

    try {
      setBulkBusy(true);
      setActionError(null);

      for (const item of items) {
        const updated = await decideEventApplication(eventId, item.member_id, {
          decision_status: "accepted",
        });

        setApplications((current) =>
          current.map((row) =>
            row.member_id === item.member_id ? updated : row,
          ),
        );
      }
    } catch (err) {
      setActionError(
        extractEventApiErrorMessage(
          err,
          eventStrings.messages.failedToUpdateDecision,
        ),
      );
    } finally {
      setBulkBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!eventId) {
      return;
    }

    try {
      setDeleteSubmitting(true);
      setActionError(null);

      await deleteEvent(eventId);
      navigate("/events");
    } catch (err) {
      setActionError(
        extractEventApiErrorMessage(
          err,
          eventStrings.messages.failedToDeleteEvent,
        ),
      );
    } finally {
      setDeleteSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              {eventData?.title ?? eventStrings.page.managementTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {eventStrings.page.managementSubtitle}
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/events/${eventId}`)}
            >
              {eventStrings.actions.backToEvent}
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => void loadData(true)}
              disabled={refreshing}
            >
              {eventStrings.actions.refresh}
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}
        {!loading && actionError && <Alert severity="error">{actionError}</Alert>}

        {!loading && !error && eventData && (
          <>
            <Paper sx={{ p: 2 }}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                variant="scrollable"
                allowScrollButtonsMobile
              >
                <Tab value="overview" label={eventStrings.tabs.overview} />
                {(canDecideApplications || canHandleAttendance) && (
                  <Tab value="applications" label={eventStrings.tabs.applications} />
                )}
                {canHandleAttendance && (
                  <Tab value="attendance" label={eventStrings.tabs.attendance} />
                )}
                {canReadEventStats && (
                  <Tab value="stats" label={eventStrings.tabs.stats} />
                )}
              </Tabs>
            </Paper>

            {currentTab === "overview" && (
              <Stack spacing={3}>
                <Paper sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      spacing={1}
                    >
                      <Typography variant="h6">
                        {eventStrings.sections.adminOverview}
                      </Typography>
                      <Chip
                        label={getEventPhaseLabel(getEventPhase(eventData))}
                        color={getEventPhaseChipColor(getEventPhase(eventData))}
                      />
                    </Stack>

                    <Stack spacing={0.5}>
                      <Typography>
                        <strong>{eventStrings.labels.id}:</strong> {eventData.event_id}
                      </Typography>
                      <Typography>
                        <strong>{eventStrings.labels.start}:</strong>{" "}
                        {formatEventDateTime(eventData.start_datetime)}
                      </Typography>
                      <Typography>
                        <strong>{eventStrings.labels.end}:</strong>{" "}
                        {formatEventDateTime(eventData.end_datetime)}
                      </Typography>
                      <Typography>
                        <strong>{eventStrings.labels.speaker}:</strong>{" "}
                        {eventData.speaker_name || "—"}
                      </Typography>
                      <Typography>
                        <strong>{eventStrings.labels.topic}:</strong>{" "}
                        {eventData.topic || eventStrings.empty.noTopic}
                      </Typography>
                    </Stack>

                    {(canUpdateEvent || canDeleteEvent) && (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                      >
                        {canUpdateEvent && (
                          <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/events/${eventData.event_id}/edit`)}
                          >
                            {eventStrings.actions.editEvent}
                          </Button>
                        )}

                        {canDeleteEvent && (
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setDeleteDialogOpen(true)}
                          >
                            {eventStrings.actions.deleteEvent}
                          </Button>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </Paper>

                {canReadEventStats && stats && (
                  <Stack direction="row" flexWrap="wrap" gap={2}>
                    <StatCard
                      label={eventStrings.labels.totalApplications}
                      value={stats.total_applications}
                    />
                    <StatCard
                      label={eventStrings.labels.accepted}
                      value={stats.accepted}
                    />
                    <StatCard
                      label={eventStrings.labels.pending}
                      value={stats.pending}
                    />
                    <StatCard
                      label={eventStrings.labels.attended}
                      value={stats.attended}
                    />
                    <StatCard
                      label={eventStrings.labels.noShow}
                      value={stats.no_show}
                    />
                  </Stack>
                )}
              </Stack>
            )}

            {currentTab === "applications" &&
              (canDecideApplications || canHandleAttendance) && (
                <Stack spacing={3}>
                  <Paper sx={{ p: 3 }}>
                    <Stack
                      direction={{ xs: "column", lg: "row" }}
                      spacing={2}
                      alignItems={{ xs: "stretch", lg: "center" }}
                    >
                      <TextField
                        label={eventStrings.filters.searchApplications}
                        placeholder={eventStrings.filters.searchApplicationsPlaceholder}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        fullWidth
                      />

                      <TextField
                        select
                        label={eventStrings.labels.orderByApplicationTime}
                        value={sortDirection}
                        onChange={(event) =>
                          setSortDirection(event.target.value as SortDirection)
                        }
                        sx={{ minWidth: 240 }}
                      >
                        <MenuItem value="newest">
                          {eventStrings.filters.orderNewest}
                        </MenuItem>
                        <MenuItem value="oldest">
                          {eventStrings.filters.orderOldest}
                        </MenuItem>
                      </TextField>

                      <Button
                        variant={onlyPending ? "contained" : "outlined"}
                        onClick={() => setOnlyPending((current) => !current)}
                      >
                        {eventStrings.filters.onlyPending}
                      </Button>
                    </Stack>

                    {canDecideApplications && (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{ mt: 2 }}
                      >
                        <Button
                          variant="outlined"
                          onClick={() => void handleApproveMany(pendingApplications)}
                          disabled={bulkBusy || pendingApplications.length === 0}
                        >
                          {bulkBusy
                            ? eventStrings.actions.submitting
                            : eventStrings.actions.approveAllPending}
                        </Button>

                        <TextField
                          label={eventStrings.filters.topN}
                          type="number"
                          value={topN}
                          onChange={(event) => setTopN(event.target.value)}
                          inputProps={{ min: 1 }}
                          sx={{ width: 120 }}
                        />

                        <Button
                          variant="outlined"
                          onClick={() => void handleApproveMany(topNPending)}
                          disabled={bulkBusy || topNPending.length === 0}
                        >
                          {eventStrings.actions.approveTopPending}
                        </Button>
                      </Stack>
                    )}
                  </Paper>

                  {filteredApplications.length === 0 ? (
                    <Paper sx={{ p: 3 }}>
                      <Typography>{eventStrings.empty.noApplications}</Typography>
                    </Paper>
                  ) : (
                    <Stack spacing={2}>
                      {filteredApplications.map((application) => (
                        <Paper key={application.member_id} sx={{ p: 3 }}>
                          <Stack spacing={1.5}>
                            <Typography variant="h6">
                              {eventStrings.labels.memberId}: {application.member_id}
                            </Typography>

                            <Typography>
                              <strong>{eventStrings.labels.appliedAt}:</strong>{" "}
                              {formatEventDateTime(application.applied_at)}
                            </Typography>

                            <Typography>
                              <strong>{eventStrings.labels.decision}:</strong>{" "}
                              {getDecisionStatusLabel(application.decision_status)}
                            </Typography>

                            <Typography>
                              <strong>{eventStrings.labels.attendanceStatus}:</strong>{" "}
                              {getAttendanceStatusLabel(application.attendance_status)}
                            </Typography>

                            <Typography>
                              <strong>{eventStrings.labels.attendanceMode}:</strong>{" "}
                              {getAttendanceModeLabel(application.attendance_mode)}
                            </Typography>

                            {application.feedback_submitted_at && (
                              <Typography>
                                <strong>{eventStrings.labels.feedbackSubmitted}:</strong>{" "}
                                {formatEventDateTime(application.feedback_submitted_at)}
                              </Typography>
                            )}

                            {canDecideApplications && (
                              <TextField
                                select
                                label={eventStrings.labels.updateDecision}
                                value={application.decision_status}
                                onChange={(event) =>
                                  void handleDecision(
                                    application.member_id,
                                    event.target.value as DecisionStatus,
                                  )
                                }
                                disabled={busyMemberId === application.member_id}
                                sx={{ maxWidth: 280 }}
                              >
                                {decisionOptions.map((option) => (
                                  <MenuItem key={option} value={option}>
                                    {getDecisionStatusLabel(option)}
                                  </MenuItem>
                                ))}
                              </TextField>
                            )}
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Stack>
              )}

            {currentTab === "attendance" && canHandleAttendance && (
              <Stack spacing={3}>
                {!attendanceEnabledForEvent && (
                  <Alert severity="info">
                    {eventStrings.messages.attendanceAvailableOneHourBeforeStart}
                  </Alert>
                )}

                {filteredApplications.length === 0 ? (
                  <Paper sx={{ p: 3 }}>
                    <Typography>{eventStrings.empty.noApplications}</Typography>
                  </Paper>
                ) : (
                  <Stack spacing={2}>
                    {filteredApplications.map((application) => {
                      const canChangeAttendance =
                        eventData &&
                        attendanceEnabledForEvent &&
                        canManageAttendanceForApplication(eventData, application);

                      return (
                        <Paper key={application.member_id} sx={{ p: 3 }}>
                          <Stack spacing={1.5}>
                            <Typography variant="h6">
                              {eventStrings.labels.memberId}: {application.member_id}
                            </Typography>

                            <Typography>
                              <strong>{eventStrings.labels.decision}:</strong>{" "}
                              {getDecisionStatusLabel(application.decision_status)}
                            </Typography>

                            <Typography>
                              <strong>{eventStrings.labels.attendanceStatus}:</strong>{" "}
                              {getAttendanceStatusLabel(application.attendance_status)}
                            </Typography>

                            <Typography>
                              <strong>{eventStrings.labels.attendanceMode}:</strong>{" "}
                              {getAttendanceModeLabel(application.attendance_mode)}
                            </Typography>

                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                            >
                              <Button
                                variant="outlined"
                                onClick={() =>
                                  void handleAttendance(
                                    application.member_id,
                                    "attended",
                                  )
                                }
                                disabled={
                                  !canChangeAttendance ||
                                  busyMemberId === application.member_id
                                }
                              >
                                {eventStrings.actions.markAttended}
                              </Button>

                              <Button
                                variant="outlined"
                                onClick={() =>
                                  void handleAttendance(
                                    application.member_id,
                                    "no_show",
                                  )
                                }
                                disabled={
                                  !canChangeAttendance ||
                                  busyMemberId === application.member_id
                                }
                              >
                                {eventStrings.actions.markNoShow}
                              </Button>
                            </Stack>

                            {!attendanceEnabledForEvent && (
                              <Typography variant="body2" color="text.secondary">
                                {eventStrings.messages.attendanceAvailableOneHourBeforeStart}
                              </Typography>
                            )}

                            {attendanceEnabledForEvent &&
                              application.decision_status !== "accepted" && (
                                <Typography variant="body2" color="text.secondary">
                                  {eventStrings.messages.attendanceOnlyForAccepted}
                                </Typography>
                              )}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
              </Stack>
            )}

            {currentTab === "stats" && canReadEventStats && stats && (
              <Paper sx={{ p: 3 }}>
                <Stack spacing={1.25}>
                  <Typography variant="h6">Applications</Typography>
                  <Typography>
                    <strong>Total:</strong> {stats.total_applications}
                  </Typography>
                  <Typography>
                    <strong>Accepted:</strong> {stats.accepted}
                  </Typography>
                  <Typography>
                    <strong>Rejected:</strong> {stats.rejected}
                  </Typography>
                  <Typography>
                    <strong>Pending:</strong> {stats.pending}
                  </Typography>
                  <Typography>
                    <strong>Waitlisted:</strong> {stats.waitlisted}
                  </Typography>
                  <Typography>
                    <strong>Cancelled:</strong> {stats.cancelled}
                  </Typography>

                  <Box sx={{ pt: 1 }} />

                  <Typography variant="h6">Attendance</Typography>
                  <Typography>
                    <strong>Attended:</strong> {stats.attended}
                  </Typography>
                  <Typography>
                    <strong>No show:</strong> {stats.no_show}
                  </Typography>
                  <Typography>
                    <strong>Unknown:</strong> {stats.unknown_attendance}
                  </Typography>
                </Stack>
              </Paper>
            )}
          </>
        )}
      </Stack>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{eventStrings.dialogs.deleteTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {eventStrings.dialogs.deleteDescription}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteSubmitting}
          >
            {eventStrings.actions.cancel}
          </Button>
          <Button
            color="error"
            onClick={() => void handleDelete()}
            disabled={deleteSubmitting}
          >
            {deleteSubmitting
              ? eventStrings.actions.deleting
              : eventStrings.actions.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}