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
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EventIcon from "@mui/icons-material/Event";
import GroupIcon from "@mui/icons-material/Group";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import SendIcon from "@mui/icons-material/Send";
import { useNavigate, useParams } from "react-router-dom";

import {
  applyToEvent,
  deleteEvent,
  getEvent,
  getEventStats,
  getMyEventApplication,
  submitMyEventFeedback,
} from "../api/events";
import { useAuth } from "../context/AuthContext";
import { hasAnyPermission, hasPermission } from "../auth/permissions";
import type {
  AttendanceMode,
  Event,
  EventApplication,
  EventStats,
} from "../types/event";

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getEventStatus(event: Event): "Upcoming" | "Ongoing" | "Past" {
  const now = new Date();
  const start = new Date(event.start_datetime);
  const end = event.end_datetime ? new Date(event.end_datetime) : null;

  if (start > now) {
    return "Upcoming";
  }

  if (end && end < now) {
    return "Past";
  }

  return "Ongoing";
}

function hasEventEnded(event: Event): boolean {
  if (!event.end_datetime) {
    return new Date(event.start_datetime) < new Date();
  }

  return new Date(event.end_datetime) < new Date();
}

function canSubmitFeedback(event: Event, application: EventApplication | null) {
  if (!application) {
    return false;
  }

  const hasAlreadySubmitted = application.feedback_submitted_at !== null;
  if (hasAlreadySubmitted) {
    return false;
  }

  return application.attendance_status === "attended" || hasEventEnded(event);
}

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
  const canDecideApplications = hasPermission(user, "event.decide");
  const canManageAttendance = hasAnyPermission(user, ["event.attendance", "event.decide"]);
  const canReadEventStats = hasPermission(user, "event.stats.read");

  useEffect(() => {
    async function loadEventPage() {
      if (authLoading) {
        return;
      }

      if (!canReadEvents) {
        setError("You do not have permission to view events.");
        setLoading(false);
        return;
      }

      if (!eventId) {
        setError("Event ID is missing.");
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
            setApplicationError("Failed to load your application status.");
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
              setStatsError("Failed to load event statistics.");
            }
          } finally {
            setStatsLoading(false);
          }
        } else {
          setStats(null);
        }
      } catch {
        setError("Failed to load event details.");
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

    return getEventStatus(eventData);
  }, [eventData]);

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
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        const message =
          typeof detail === "string"
            ? detail
            : detail?.message ?? "Failed to submit application.";

        setApplicationError(message);
      } else {
        setApplicationError("Failed to submit application.");
      }
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
      setApplicationError("Rating must be an integer from 1 to 5.");
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
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        const message =
          typeof detail === "string"
            ? detail
            : detail?.message ?? "Failed to submit feedback.";

        setApplicationError(message);
      } else {
        setApplicationError("Failed to submit feedback.");
      }
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
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        const message =
          typeof detail === "string"
            ? detail
            : detail?.message ?? "Failed to delete event.";

        setError(message);
      } else {
        setError("Failed to delete event.");
      }
    } finally {
      setDeleteSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  const showAttendanceLink = eventData ? hasEventEnded(eventData) : false;

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
              {eventData?.title ?? "Event details"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Detailed event view
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<EventIcon />}
            onClick={() => navigate("/events")}
          >
            Back to events
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
                  <Chip label={eventStatus ?? "—"} />
                </Stack>

                <Typography color="text.secondary">
                  {eventData.topic || "No topic"}
                </Typography>

                <Stack spacing={0.5}>
                  <Typography>
                    <strong>ID:</strong> {eventData.event_id}
                  </Typography>
                  <Typography>
                    <strong>Start:</strong> {formatDateTime(eventData.start_datetime)}
                  </Typography>
                  <Typography>
                    <strong>End:</strong> {formatDateTime(eventData.end_datetime)}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {eventStatus ?? "—"}
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
                        Edit event
                      </Button>
                    )}

                    {canDeleteEvent && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        Delete event
                      </Button>
                    )}
                  </Stack>
                )}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">My participation</Typography>

                {applicationLoading && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography>Loading application...</Typography>
                  </Box>
                )}

                {!applicationLoading && applicationError && (
                  <Alert severity="error">{applicationError}</Alert>
                )}

                {!applicationLoading && !myApplication && canApplyToEvent && (
                  <Stack spacing={2}>
                    <Typography color="text.secondary">
                      You have not applied to this event yet.
                    </Typography>

                    <TextField
                      select
                      label="Attendance mode"
                      value={applyMode}
                      onChange={(event) =>
                        setApplyMode(event.target.value as AttendanceMode)
                      }
                      sx={{ maxWidth: 280 }}
                    >
                      <option value="in_person">in_person</option>
                      <option value="online">online</option>
                    </TextField>

                    <Box>
                      <Button
                        variant="contained"
                        startIcon={<SendIcon />}
                        onClick={() => void handleApply()}
                        disabled={applySubmitting}
                      >
                        {applySubmitting ? "Submitting..." : "Apply"}
                      </Button>
                    </Box>
                  </Stack>
                )}

                {!applicationLoading && myApplication && (
                  <Stack spacing={1.5}>
                    <Typography>
                      <strong>Decision:</strong> {myApplication.decision_status}
                    </Typography>
                    <Typography>
                      <strong>Attendance status:</strong> {myApplication.attendance_status}
                    </Typography>
                    <Typography>
                      <strong>Attendance mode:</strong> {myApplication.attendance_mode ?? "—"}
                    </Typography>
                    <Typography>
                      <strong>Applied at:</strong> {formatDateTime(myApplication.applied_at)}
                    </Typography>

                    {myApplication.feedback_submitted_at && (
                      <Typography>
                        <strong>Feedback submitted:</strong>{" "}
                        {formatDateTime(myApplication.feedback_submitted_at)}
                      </Typography>
                    )}

                    {canSubmitFeedback(eventData, myApplication) && (
                      <>
                        <Divider />
                        <Typography variant="subtitle1">Submit feedback</Typography>

                        <TextField
                          label="Rating (1-5)"
                          type="number"
                          value={feedbackRating}
                          onChange={(event) => setFeedbackRating(event.target.value)}
                          inputProps={{ min: 1, max: 5 }}
                          sx={{ maxWidth: 200 }}
                        />

                        <TextField
                          label="Comment"
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
                            {feedbackSubmitting ? "Submitting..." : "Submit feedback"}
                          </Button>
                        </Box>
                      </>
                    )}
                  </Stack>
                )}
              </Stack>
            </Paper>

            {(canDecideApplications || canManageAttendance || canReadEventStats) && (
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Management</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use these tools for applications, attendance, and analytics.
                  </Typography>

                  {statsError && <Alert severity="error">{statsError}</Alert>}

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    flexWrap="wrap"
                  >
                    {canDecideApplications && (
                      <Button
                        variant="outlined"
                        startIcon={<GroupIcon />}
                        onClick={() => navigate(`/events/${eventData.event_id}/applications`)}
                      >
                        Applications
                      </Button>
                    )}

                    {canManageAttendance &&
                      (showAttendanceLink ? (
                        <Button
                          variant="outlined"
                          startIcon={<HowToRegIcon />}
                          onClick={() => navigate(`/events/${eventData.event_id}/attendance`)}
                        >
                          Attendance
                        </Button>
                      ) : (
                        <Button variant="outlined" startIcon={<HowToRegIcon />} disabled>
                          Attendance available after event end
                        </Button>
                      ))}

                    {canReadEventStats && (
                      <Button
                        variant="outlined"
                        startIcon={<AssessmentIcon />}
                        onClick={() => navigate(`/events/${eventData.event_id}/stats`)}
                      >
                        Stats
                      </Button>
                    )}
                  </Stack>

                  {canReadEventStats && statsLoading && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <CircularProgress size={20} />
                      <Typography>Loading statistics...</Typography>
                    </Box>
                  )}

                  {canReadEventStats && stats && (
                    <Stack spacing={0.75}>
                      <Typography variant="subtitle2">Quick stats</Typography>
                      <Typography>Total applications: {stats.total_applications}</Typography>
                      <Typography>Accepted: {stats.accepted}</Typography>
                      <Typography>Pending: {stats.pending}</Typography>
                      <Typography>Attended: {stats.attended}</Typography>
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
        <DialogTitle>Delete event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this event? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => void handleDelete()}
            disabled={deleteSubmitting}
          >
            {deleteSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}