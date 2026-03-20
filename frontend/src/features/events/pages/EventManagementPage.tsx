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
import SendIcon from "@mui/icons-material/Send";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  applyToEvent,
  decideEventApplication,
  deleteEvent,
  getEvent,
  getEventStats,
  getMyEventApplication,
  listEventApplications,
  submitMyEventFeedback,
  updateEventAttendance,
} from "../../../api/events";
import { useAuth } from "../../../context/AuthContext";
import { hasAnyPermission, hasPermission } from "../../../auth/permissions";
import type {
  AttendanceMode,
  DecisionStatus,
  Event,
  EventApplication,
  EventStats,
} from "../../../types/event";
import { eventStrings } from "../utils/eventStrings";
import { extractEventApiErrorMessage } from "../utils/eventErrors";
import {
  canManageAttendance,
  canSubmitFeedback,
  filterApplicationsBySearch,
  formatEventDateTime,
  getAttendanceModeLabel,
  getAttendanceStatusLabel,
  getDecisionStatusLabel,
  getEventPhase,
  getEventPhaseChipColor,
  getEventPhaseLabel,
  getEventStatusLabel,
  getEventTimeStatus,
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
  const [myApplication, setMyApplication] = useState<EventApplication | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  const [busyMemberId, setBusyMemberId] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>("newest");
  const [topN, setTopN] = useState("5");

  const [applyMode, setApplyMode] = useState<AttendanceMode>("in_person");
  const [applySubmitting, setApplySubmitting] = useState(false);

  const [feedbackRating, setFeedbackRating] = useState("5");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

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

  const canSeeApplicationsTab = canDecideApplications || canHandleAttendance;
  const canSeeAttendanceTab = canHandleAttendance;
  const canSeeStatsTab = canReadEventStats;

  const requestedTab = getManagementTabFromSearchParams(searchParams);

  const currentTab: EventManagementTab =
    requestedTab === "applications" && !canSeeApplicationsTab
      ? "overview"
      : requestedTab === "attendance" && !canSeeAttendanceTab
        ? "overview"
        : requestedTab === "stats" && !canSeeStatsTab
          ? "overview"
          : requestedTab;

  useEffect(() => {
    if (requestedTab !== currentTab) {
      setSearchParams({ tab: currentTab }, { replace: true });
    }
  }, [requestedTab, currentTab, setSearchParams]);

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
      setApplicationError(null);

      const eventPromise = getEvent(eventId);
      const appsPromise = canSeeApplicationsTab
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

      try {
        setApplicationLoading(true);
        const myApplicationResult = await getMyEventApplication(eventId);
        setMyApplication(myApplicationResult);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setMyApplication(null);
        } else {
          setApplicationError(
            eventStrings.messages.failedToLoadApplicationStatus,
          );
        }
      } finally {
        setApplicationLoading(false);
      }
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

    if (!eventId) {
      setError(eventStrings.messages.missingEventId);
      setLoading(false);
      return;
    }

    void loadData();
  }, [
    authLoading,
    canReadEvents,
    canSeeApplicationsTab,
    canReadEventStats,
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

  const acceptedApplications = useMemo(() => {
    return filteredApplications.filter(
      (item) => item.decision_status === "accepted",
    );
  }, [filteredApplications]);

  const topNNumber = Number(topN);
  const topNPending =
    Number.isInteger(topNNumber) && topNNumber > 0
      ? pendingApplications.slice(0, topNNumber)
      : [];

  const attendanceEnabledForEvent = eventData ? canManageAttendance(eventData) : false;

  const eventStatus = useMemo(() => {
    if (!eventData) {
      return null;
    }

    return getEventTimeStatus(eventData);
  }, [eventData]);

  const canStillApply = eventStatus === "upcoming" || eventStatus === "ongoing";

  const handleTabChange = (_: SyntheticEvent, value: EventManagementTab) => {
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

      if (myApplication?.member_id === memberId) {
        setMyApplication(updated);
      }
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

      if (myApplication?.member_id === memberId) {
        setMyApplication(updated);
      }
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

        if (myApplication?.member_id === item.member_id) {
          setMyApplication(updated);
        }
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

  const handleApply = async () => {
    if (!eventId || !canStillApply) {
      return;
    }

    try {
      setApplySubmitting(true);
      setApplicationError(null);

      const updated = await applyToEvent(eventId, {
        attendance_mode: applyMode,
      });

      setMyApplication(updated);
    } catch (err) {
      setApplicationError(
        extractEventApiErrorMessage(
          err,
          eventStrings.messages.failedToSubmitApplication,
        ),
      );
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!eventId || !eventData) {
      return;
    }

    const rating = Number(feedbackRating);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setApplicationError(eventStrings.messages.invalidFeedbackRating);
      return;
    }

    try {
      setFeedbackSubmitting(true);
      setApplicationError(null);

      const updated = await submitMyEventFeedback(eventId, {
        rating,
        comment: feedbackComment.trim() || null,
      });

      setMyApplication(updated);
    } catch (err) {
      setApplicationError(
        extractEventApiErrorMessage(
          err,
          eventStrings.messages.failedToSubmitFeedback,
        ),
      );
    } finally {
      setFeedbackSubmitting(false);
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
              onClick={() => navigate("/events")}
            >
              {eventStrings.actions.backToEvents}
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
                {canSeeApplicationsTab && (
                  <Tab value="applications" label={eventStrings.tabs.applications} />
                )}
                {canSeeAttendanceTab && (
                  <Tab value="attendance" label={eventStrings.tabs.attendance} />
                )}
                {canSeeStatsTab && (
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
                        <strong>{eventStrings.labels.status}:</strong>{" "}
                        {eventStatus ? getEventStatusLabel(eventStatus) : "—"}
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
                        sx={{ pt: 1 }}
                      >
                        {canUpdateEvent && (
                          <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() =>
                              navigate(`/events/${eventData.event_id}/edit`)
                            }
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

                <Paper sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Typography variant="h6">
                      {eventStrings.sections.myParticipation}
                    </Typography>

                    {applicationLoading && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <CircularProgress size={20} />
                        <Typography>
                          {eventStrings.messages.loadingApplication}
                        </Typography>
                      </Box>
                    )}

                    {!applicationLoading && applicationError && (
                      <Alert severity="error">{applicationError}</Alert>
                    )}

                    {!applicationLoading && !myApplication && canStillApply && (
                      <Stack spacing={2}>
                        <Typography color="text.secondary">
                          {eventStrings.empty.noApplication}
                        </Typography>

                        <TextField
                          select
                          label={eventStrings.labels.attendanceMode}
                          value={applyMode}
                          onChange={(event) =>
                            setApplyMode(event.target.value as AttendanceMode)
                          }
                          sx={{ maxWidth: 280 }}
                        >
                          <MenuItem value="in_person">
                            {eventStrings.statuses.inPerson}
                          </MenuItem>
                          <MenuItem value="online">
                            {eventStrings.statuses.online}
                          </MenuItem>
                        </TextField>

                        <Box>
                          <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={() => void handleApply()}
                            disabled={applySubmitting}
                          >
                            {applySubmitting
                              ? eventStrings.actions.submitting
                              : eventStrings.actions.apply}
                          </Button>
                        </Box>
                      </Stack>
                    )}

                    {!applicationLoading && !myApplication && !canStillApply && (
                      <Alert severity="info">
                        {eventStrings.messages.attendanceAvailableAfterEnd}
                      </Alert>
                    )}

                    {!applicationLoading && myApplication && (
                      <Stack spacing={1.5}>
                        <Typography>
                          <strong>{eventStrings.labels.decision}:</strong>{" "}
                          {getDecisionStatusLabel(myApplication.decision_status)}
                        </Typography>
                        <Typography>
                          <strong>{eventStrings.labels.attendanceStatus}:</strong>{" "}
                          {getAttendanceStatusLabel(myApplication.attendance_status)}
                        </Typography>
                        <Typography>
                          <strong>{eventStrings.labels.attendanceMode}:</strong>{" "}
                          {getAttendanceModeLabel(myApplication.attendance_mode)}
                        </Typography>
                        <Typography>
                          <strong>{eventStrings.labels.appliedAt}:</strong>{" "}
                          {formatEventDateTime(myApplication.applied_at)}
                        </Typography>

                        {myApplication.feedback_submitted_at && (
                          <Typography>
                            <strong>{eventStrings.labels.feedbackSubmitted}:</strong>{" "}
                            {formatEventDateTime(myApplication.feedback_submitted_at)}
                          </Typography>
                        )}

                        {canSubmitFeedback(eventData, myApplication) && (
                          <>
                            <Divider />
                            <Typography variant="subtitle1">
                              {eventStrings.sections.submitFeedback}
                            </Typography>

                            <TextField
                              label={eventStrings.labels.rating}
                              type="number"
                              value={feedbackRating}
                              onChange={(event) => setFeedbackRating(event.target.value)}
                              inputProps={{ min: 1, max: 5 }}
                              sx={{ maxWidth: 200 }}
                            />

                            <TextField
                              label={eventStrings.labels.comment}
                              value={feedbackComment}
                              onChange={(event) => setFeedbackComment(event.target.value)}
                              multiline
                              minRows={3}
                              fullWidth
                            />

                            <Box>
                              <Button
                                variant="contained"
                                startIcon={<SendIcon />}
                                onClick={() => void handleSubmitFeedback()}
                                disabled={feedbackSubmitting}
                              >
                                {feedbackSubmitting
                                  ? eventStrings.actions.submitting
                                  : eventStrings.actions.submitFeedback}
                              </Button>
                            </Box>
                          </>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </Paper>

                {canReadEventStats && (
                  <Paper sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Typography variant="h6">
                        {eventStrings.sections.quickStats}
                      </Typography>

                      {stats ? (
                        <Stack
                          direction="row"
                          spacing={2}
                          useFlexGap
                          flexWrap="wrap"
                        >
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
                      ) : (
                        <Typography color="text.secondary">
                          {eventStrings.empty.noData}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            )}

            {currentTab === "applications" && canSeeApplicationsTab && (
              <Stack spacing={3}>
                <Paper sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Typography variant="h6">
                      {eventStrings.sections.applicationsManagement}
                    </Typography>

                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1.5}
                    >
                      <TextField
                        label={eventStrings.filters.searchApplications}
                        placeholder={
                          eventStrings.filters.searchApplicationsPlaceholder
                        }
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
                        sx={{ minWidth: 220 }}
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
                  </Stack>
                </Paper>

                {canDecideApplications && pendingApplications.length > 0 && (
                  <Paper sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Typography variant="h6">
                        {eventStrings.actions.approveTopPending}
                      </Typography>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <TextField
                          label={eventStrings.filters.topN}
                          type="number"
                          value={topN}
                          onChange={(event) => setTopN(event.target.value)}
                          inputProps={{ min: 1 }}
                          sx={{ maxWidth: 160 }}
                        />

                        <Button
                          variant="contained"
                          onClick={() => void handleApproveMany(topNPending)}
                          disabled={bulkBusy || topNPending.length === 0}
                        >
                          {bulkBusy
                            ? eventStrings.actions.submitting
                            : eventStrings.actions.approveTopPending}
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                )}

                <Paper sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    {filteredApplications.length === 0 ? (
                      <Typography color="text.secondary">
                        {eventStrings.empty.noApplications}
                      </Typography>
                    ) : (
                      filteredApplications.map((application) => (
                        <Paper
                          key={application.member_id}
                          variant="outlined"
                          sx={{ p: 2 }}
                        >
                          <Stack spacing={1.5}>
                            <Stack
                              direction={{ xs: "column", md: "row" }}
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Box>
                                <Typography fontWeight={600}>
                                  {eventStrings.labels.memberId}: {application.member_id}
                                </Typography>
                              </Box>

                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                              >
                                <Chip
                                  label={getDecisionStatusLabel(
                                    application.decision_status,
                                  )}
                                />
                                <Chip
                                  label={getAttendanceStatusLabel(
                                    application.attendance_status,
                                  )}
                                />
                              </Stack>
                            </Stack>

                            <Typography variant="body2">
                              <strong>{eventStrings.labels.attendanceMode}:</strong>{" "}
                              {getAttendanceModeLabel(application.attendance_mode)}
                            </Typography>

                            <Typography variant="body2">
                              <strong>{eventStrings.labels.appliedAt}:</strong>{" "}
                              {formatEventDateTime(application.applied_at)}
                            </Typography>

                            {application.feedback_submitted_at && (
                              <Typography variant="body2">
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
                                sx={{ maxWidth: 260 }}
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
                      ))
                    )}
                  </Stack>
                </Paper>
              </Stack>
            )}

            {currentTab === "attendance" && canSeeAttendanceTab && (
              <Stack spacing={3}>
                <Paper sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Typography variant="h6">
                      {eventStrings.sections.attendanceManagement}
                    </Typography>

                    {!attendanceEnabledForEvent && (
                      <Alert severity="info">
                        {eventStrings.messages.attendanceAvailableOneHourBeforeStart}
                      </Alert>
                    )}

                    {acceptedApplications.length === 0 ? (
                      <Typography color="text.secondary">
                        {eventStrings.empty.noApplications}
                      </Typography>
                    ) : (
                      acceptedApplications.map((application) => (
                        <Paper
                          key={application.member_id}
                          variant="outlined"
                          sx={{ p: 2 }}
                        >
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            spacing={2}
                          >
                            <Box>
                              <Typography fontWeight={600}>
                                {eventStrings.labels.memberId}: {application.member_id}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {eventStrings.labels.attendanceMode}:{" "}
                                {getAttendanceModeLabel(application.attendance_mode)}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {eventStrings.labels.attendanceStatus}:{" "}
                                {getAttendanceStatusLabel(
                                  application.attendance_status,
                                )}
                              </Typography>
                            </Box>

                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                            >
                              <Button
                                variant="contained"
                                disabled={
                                  busyMemberId === application.member_id ||
                                  !attendanceEnabledForEvent
                                }
                                onClick={() =>
                                  void handleAttendance(
                                    application.member_id,
                                    "attended",
                                  )
                                }
                              >
                                {eventStrings.actions.markAttended}
                              </Button>

                              <Button
                                variant="outlined"
                                color="warning"
                                disabled={
                                  busyMemberId === application.member_id ||
                                  !attendanceEnabledForEvent
                                }
                                onClick={() =>
                                  void handleAttendance(
                                    application.member_id,
                                    "no_show",
                                  )
                                }
                              >
                                {eventStrings.actions.markNoShow}
                              </Button>
                            </Stack>
                          </Stack>
                        </Paper>
                      ))
                    )}
                  </Stack>
                </Paper>
              </Stack>
            )}

            {currentTab === "stats" && canSeeStatsTab && (
              <Stack spacing={3}>
                <Paper sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Typography variant="h6">
                      {eventStrings.tabs.stats}
                    </Typography>

                    {!stats ? (
                      <Typography color="text.secondary">
                        {eventStrings.empty.noData}
                      </Typography>
                    ) : (
                      <Stack
                        direction="row"
                        spacing={2}
                        useFlexGap
                        flexWrap="wrap"
                      >
                        <StatCard
                          label={eventStrings.labels.totalApplications}
                          value={stats.total_applications}
                        />
                        <StatCard
                          label={eventStrings.labels.accepted}
                          value={stats.accepted}
                        />
                        <StatCard
                          label={eventStrings.labels.rejected}
                          value={stats.rejected}
                        />
                        <StatCard
                          label={eventStrings.labels.waitlisted}
                          value={stats.waitlisted}
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
                </Paper>
              </Stack>
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