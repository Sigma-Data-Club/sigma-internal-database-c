import { useEffect, useMemo, useState } from "react";
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
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EventIcon from "@mui/icons-material/Event";
import SendIcon from "@mui/icons-material/Send";
import { useNavigate, useParams } from "react-router-dom";

import {
  applyToEvent,
  deleteEvent,
  getEvent,
  getEventStats,
  getMyEventApplication,
  submitMyEventFeedback,
} from "../../../api/events";
import { useAuth } from "../../../context/AuthContext";
import { hasAnyPermission, hasPermission } from "../../../auth/permissions";
import type {
  AttendanceMode,
  Event,
  EventApplication,
  EventStats,
} from "../../../types/event";
import { eventStrings } from "../utils/eventStrings";
import { extractEventApiErrorMessage } from "../utils/eventErrors";
import {
  canManageAttendance,
  canSubmitFeedback,
  formatEventDateTime,
  getAttendanceModeLabel,
  getAttendanceStatusLabel,
  getDecisionStatusLabel,
  getEventStatusLabel,
  getEventTimeStatus,
  getStatusChipColor,
} from "../utils/eventHelpers";

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [eventData, setEventData] = useState<Event | null>(null);
  const [myApplication, setMyApplication] = useState<EventApplication | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [applyMode, setApplyMode] = useState<AttendanceMode>("in_person");
  const [applySubmitting, setApplySubmitting] = useState(false);

  const [feedbackRating, setFeedbackRating] = useState("5");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const canReadEvents = hasPermission(user, "event.read");
  const canApplyToEvent = hasPermission(user, "event.read");
  const canUpdateEvent = hasPermission(user, "event.update");
  const canDeleteEvent = hasPermission(user, "event.delete");
  const canOpenManagement = hasAnyPermission(user, [
    "event.update",
    "event.delete",
    "event.decide",
    "event.attendance",
    "event.stats.read",
  ]);
  const canReadEventStats = hasPermission(user, "event.stats.read");

  useEffect(() => {
    async function loadEventPage() {
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

      try {
        setLoading(true);
        setError(null);
        setApplicationError(null);
        setStatsError(null);

        const event = await getEvent(eventId);
        setEventData(event);

        try {
          setApplicationLoading(true);
          const application = await getMyEventApplication(eventId);
          setMyApplication(application);
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

        if (canReadEventStats) {
          try {
            setStatsLoading(true);
            const statsResult = await getEventStats(eventId);
            setStats(statsResult);
          } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 403) {
              setStats(null);
            } else {
              setStatsError(eventStrings.messages.failedToLoadEventStats);
            }
          } finally {
            setStatsLoading(false);
          }
        } else {
          setStats(null);
        }
      } catch (err) {
        setError(
          extractEventApiErrorMessage(
            err,
            eventStrings.messages.failedToLoadEventDetails,
          ),
        );
      } finally {
        setLoading(false);
      }
    }

    void loadEventPage();
  }, [eventId, authLoading, canReadEvents, canReadEventStats]);

  const eventStatus = useMemo(() => {
    if (!eventData) {
      return null;
    }

    return getEventTimeStatus(eventData);
  }, [eventData]);

  const attendanceAvailable = eventData ? canManageAttendance(eventData) : false;

  const handleApply = async () => {
    if (!eventId) {
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
      setError(null);

      await deleteEvent(eventId);
      navigate("/events");
    } catch (err) {
      setError(
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
              {eventData?.title ?? eventStrings.page.detailsTitleFallback}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {eventStrings.page.detailsSubtitle}
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<EventIcon />}
            onClick={() => navigate("/events")}
          >
            {eventStrings.actions.backToEvents}
          </Button>
        </Stack>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && eventData && (
          <>
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                >
                  <Typography variant="h5">{eventData.title}</Typography>
                  <Chip
                    label={eventStatus ? getEventStatusLabel(eventStatus) : "—"}
                    color={eventStatus ? getStatusChipColor(eventStatus) : "default"}
                  />
                </Stack>

                <Typography color="text.secondary">
                  {eventData.topic || eventStrings.empty.noTopic}
                </Typography>

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
                    {eventData.topic || "—"}
                  </Typography>
                </Stack>

                {(canUpdateEvent || canDeleteEvent) && (
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.5}
                    sx={{ pt: 1 }}
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

            {canOpenManagement && (
              <Paper sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {eventStrings.sections.management}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {eventStrings.messages.managementDescription}
                  </Typography>

                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.25}
                    useFlexGap
                    flexWrap="wrap"
                  >
                    <Button
                      variant="contained"
                      onClick={() =>
                        navigate(`/events/${eventData.event_id}/manage?tab=overview`)
                      }
                    >
                      {eventStrings.tabs.overview}
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() =>
                        navigate(
                          `/events/${eventData.event_id}/manage?tab=applications`,
                        )
                      }
                    >
                      {eventStrings.actions.applications}
                    </Button>

                    <Button
                      variant="outlined"
                      disabled={!attendanceAvailable}
                      onClick={() =>
                        navigate(`/events/${eventData.event_id}/manage?tab=attendance`)
                      }
                    >
                      {eventStrings.actions.attendance}
                    </Button>

                    {canReadEventStats && (
                      <Button
                        variant="outlined"
                        onClick={() =>
                          navigate(`/events/${eventData.event_id}/manage?tab=stats`)
                        }
                      >
                        {eventStrings.actions.stats}
                      </Button>
                    )}
                  </Stack>

                  {!attendanceAvailable && (
                    <Typography variant="caption" color="text.secondary">
                      {eventStrings.messages.attendanceAvailableOneHourBeforeStart}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            )}

            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">
                  {eventStrings.sections.myParticipation}
                </Typography>

                {applicationLoading && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography>{eventStrings.messages.loadingApplication}</Typography>
                  </Box>
                )}

                {!applicationLoading && applicationError && (
                  <Alert severity="error">{applicationError}</Alert>
                )}

                {!applicationLoading && !myApplication && canApplyToEvent && (
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

                  {statsError && <Alert severity="error">{statsError}</Alert>}

                  {statsLoading && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <CircularProgress size={20} />
                      <Typography>{eventStrings.messages.loadingStatistics}</Typography>
                    </Box>
                  )}

                  {!statsLoading && !statsError && stats && (
                    <Stack spacing={0.75}>
                      <Typography>
                        {eventStrings.labels.totalApplications}: {stats.total_applications}
                      </Typography>
                      <Typography>
                        {eventStrings.labels.accepted}: {stats.accepted}
                      </Typography>
                      <Typography>
                        {eventStrings.labels.pending}: {stats.pending}
                      </Typography>
                      <Typography>
                        {eventStrings.labels.attended}: {stats.attended}
                      </Typography>
                    </Stack>
                  )}
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