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
import FactCheckIcon from "@mui/icons-material/FactCheck";
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

  const [eventData, setEventData] = useState<Event | null>(null);
  const [myApplication, setMyApplication] = useState<EventApplication | null>(
    null,
  );
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

  useEffect(() => {
    async function loadEventPage() {
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
      } catch {
        setError("Failed to load event details.");
      } finally {
        setLoading(false);
      }
    }

    void loadEventPage();
  }, [eventId]);

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
          <Stack spacing={3}>
            <Paper sx={{ p: 3 }}>
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ flexWrap: "wrap" }}
                >
                  <Typography variant="h5">{eventData.title}</Typography>
                  {eventStatus && <Chip label={eventStatus} color="primary" />}
                </Stack>

                <Divider />

                <Typography>
                  <strong>ID:</strong> {eventData.event_id}
                </Typography>
                <Typography>
                  <strong>Topic:</strong> {eventData.topic ?? "—"}
                </Typography>
                <Typography>
                  <strong>Speaker:</strong> {eventData.speaker_name ?? "—"}
                </Typography>
                <Typography>
                  <strong>Starts:</strong>{" "}
                  {formatDateTime(eventData.start_datetime)}
                </Typography>
                <Typography>
                  <strong>Ends:</strong>{" "}
                  {formatDateTime(eventData.end_datetime)}
                </Typography>
                <Typography>
                  <strong>Created by member ID:</strong>{" "}
                  {eventData.created_by_member_id ?? "—"}
                </Typography>
                <Typography>
                  <strong>Created at:</strong>{" "}
                  {formatDateTime(eventData.created_at)}
                </Typography>

                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.5}
                  sx={{ pt: 1 }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/events/${eventData.event_id}/edit`)}
                  >
                    Edit event
                  </Button>

                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete event
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Stack spacing={1.5}>
                <Typography variant="h6">My application</Typography>

                {applicationLoading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography>Loading your application...</Typography>
                  </Box>
                ) : myApplication ? (
                  <>
                    <Typography>
                      <strong>Applied at:</strong>{" "}
                      {formatDateTime(myApplication.applied_at)}
                    </Typography>
                    <Typography>
                      <strong>Decision status:</strong>{" "}
                      {myApplication.decision_status}
                    </Typography>
                    <Typography>
                      <strong>Attendance status:</strong>{" "}
                      {myApplication.attendance_status}
                    </Typography>
                    <Typography>
                      <strong>Attendance mode:</strong>{" "}
                      {myApplication.attendance_mode ?? "—"}
                    </Typography>
                    <Typography>
                      <strong>Feedback rating:</strong>{" "}
                      {myApplication.feedback_rating ?? "—"}
                    </Typography>
                    <Typography>
                      <strong>Feedback comment:</strong>{" "}
                      {myApplication.feedback_comment ?? "—"}
                    </Typography>
                    <Typography>
                      <strong>Feedback submitted at:</strong>{" "}
                      {formatDateTime(myApplication.feedback_submitted_at)}
                    </Typography>
                  </>
                ) : (
                  <Typography color="text.secondary">
                    You have not applied to this event yet.
                  </Typography>
                )}

                {applicationError && (
                  <Alert severity="error">{applicationError}</Alert>
                )}
              </Stack>
            </Paper>

            {!myApplication && (
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Apply to this event</Typography>

                  <TextField
                    select
                    label="Attendance mode"
                    value={applyMode}
                    onChange={(event) =>
                      setApplyMode(event.target.value as AttendanceMode)
                    }
                    SelectProps={{ native: true }}
                  >
                    <option value="in_person">In person</option>
                    <option value="online">Online</option>
                  </TextField>

                  <Box>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={handleApply}
                      disabled={applySubmitting}
                    >
                      {applySubmitting ? "Submitting..." : "Submit application"}
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            )}

            {eventData && canSubmitFeedback(eventData, myApplication) && (
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Submit feedback</Typography>

                  <TextField
                    label="Rating"
                    type="number"
                    value={feedbackRating}
                    onChange={(event) => setFeedbackRating(event.target.value)}
                    inputProps={{ min: 1, max: 5, step: 1 }}
                  />

                  <TextField
                    label="Comment"
                    value={feedbackComment}
                    onChange={(event) => setFeedbackComment(event.target.value)}
                    multiline
                    minRows={3}
                    placeholder="Share your feedback about the event"
                  />

                  <Box>
                    <Button
                      variant="contained"
                      startIcon={<FactCheckIcon />}
                      onClick={handleSubmitFeedback}
                      disabled={feedbackSubmitting}
                    >
                      {feedbackSubmitting ? "Submitting..." : "Submit feedback"}
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            )}

            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">Management</Typography>
                <Typography variant="body2" color="text.secondary">
                  Use these tools for applications, attendance, and analytics.
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  flexWrap="wrap"
                >
                  <Button
                    variant="outlined"
                    startIcon={<GroupIcon />}
                    onClick={() =>
                      navigate(`/events/${eventData.event_id}/applications`)
                    }
                  >
                    Applications
                  </Button>

                  {showAttendanceLink ? (
                    <Button
                      variant="outlined"
                      startIcon={<HowToRegIcon />}
                      onClick={() =>
                        navigate(`/events/${eventData.event_id}/attendance`)
                      }
                    >
                      Attendance
                    </Button>
                  ) : (
                    <Button variant="outlined" startIcon={<HowToRegIcon />} disabled>
                      Attendance available after event end
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() =>
                      navigate(`/events/${eventData.event_id}/stats`)
                    }
                  >
                    Stats
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Stack spacing={1.5}>
                <Typography variant="h6">
                  Registration summary
                </Typography>

                {statsLoading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography>Loading statistics...</Typography>
                  </Box>
                ) : stats ? (
                  <>
                    <Typography>
                      <strong>Total applications:</strong> {stats.total_applications}
                    </Typography>
                    <Typography>
                      <strong>Accepted:</strong> {stats.accepted}
                    </Typography>
                    <Typography>
                      <strong>Pending:</strong> {stats.pending}
                    </Typography>
                    <Typography>
                      <strong>Waitlisted:</strong> {stats.waitlisted}
                    </Typography>
                    <Typography>
                      <strong>Rejected:</strong> {stats.rejected}
                    </Typography>
                    <Typography>
                      <strong>Cancelled:</strong> {stats.cancelled}
                    </Typography>
                  </>
                ) : statsError ? (
                  <Alert severity="warning">{statsError}</Alert>
                ) : (
                  <Typography color="text.secondary">
                    Statistics are not available for your current permissions.
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Stack>
        )}
      </Stack>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
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
            onClick={handleDelete}
            disabled={deleteSubmitting}
          >
            {deleteSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}