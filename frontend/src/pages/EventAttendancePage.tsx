import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import {
  getEvent,
  listEventAttendance,
  updateEventAttendance,
} from "../api/events";
import type {
  AttendanceMode,
  AttendanceStatus,
  Event,
  EventAttendanceRow,
} from "../types/event";

const attendanceStatuses: AttendanceStatus[] = [
  "unknown",
  "attended",
  "no_show",
];

const attendanceModes: AttendanceMode[] = ["in_person", "online"];

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

function hasEventEnded(event: Event): boolean {
  if (!event.end_datetime) {
    return new Date(event.start_datetime) < new Date();
  }

  return new Date(event.end_datetime) < new Date();
}

export default function EventAttendancePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState<Event | null>(null);
  const [rows, setRows] = useState<EventAttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!eventId) {
        setError("Event ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setActionError(null);

        const eventResult = await getEvent(eventId);
        setEventData(eventResult);

        if (!hasEventEnded(eventResult)) {
          setRows([]);
          return;
        }

        const attendanceResult = await listEventAttendance(eventId);
        setRows(
          attendanceResult.items.filter(
            (row) => row.decision_status === "accepted",
          ),
        );
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const detail = err.response?.data?.detail;
          const message =
            typeof detail === "string"
              ? detail
              : detail?.message ?? "Failed to load attendance.";

          setError(message);
        } else {
          setError("Failed to load attendance.");
        }
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [eventId]);

  const attendanceBlocked = useMemo(() => {
    if (!eventData) {
      return false;
    }
    return !hasEventEnded(eventData);
  }, [eventData]);

  const handleChange = async (
    memberId: number,
    attendance_status: AttendanceStatus,
    attendance_mode: AttendanceMode | null,
  ) => {
    if (!eventId) {
      return;
    }

    try {
      setBusyMemberId(memberId);
      setActionError(null);

      const updated = await updateEventAttendance(eventId, memberId, {
        attendance_status,
        attendance_mode,
      });

      setRows((current) =>
        current.map((row) =>
          row.member_id === memberId
            ? {
                member_id: updated.member_id,
                applied_at: updated.applied_at,
                decision_status: updated.decision_status,
                attendance_status: updated.attendance_status,
                attendance_mode: updated.attendance_mode,
                feedback_rating: updated.feedback_rating,
              }
            : row,
        ),
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        const message =
          typeof detail === "string"
            ? detail
            : detail?.message ?? "Failed to update attendance.";

        setActionError(message);
      } else {
        setActionError("Failed to update attendance.");
      }
    } finally {
      setBusyMemberId(null);
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
              Event attendance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {eventData?.title ?? "Manage attendance for this event"}
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={() => navigate(`/events/${eventId}`)}
          >
            Back to event
          </Button>
        </Stack>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}
        {!loading && actionError && <Alert severity="error">{actionError}</Alert>}

        {!loading && !error && attendanceBlocked && (
          <Paper sx={{ p: 3 }}>
            <Typography>
              Attendance can be managed only after the event has ended.
            </Typography>
          </Paper>
        )}

        {!loading && !error && !attendanceBlocked && (
          <>
            {rows.length === 0 ? (
              <Paper sx={{ p: 3 }}>
                <Typography>No accepted applications found.</Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {rows.map((row) => (
                  <Paper key={row.member_id} sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Typography variant="h6">
                        Member #{row.member_id}
                      </Typography>

                      <Typography>
                        <strong>Applied at:</strong>{" "}
                        {formatDateTime(row.applied_at)}
                      </Typography>

                      <Typography>
                        <strong>Decision status:</strong> {row.decision_status}
                      </Typography>

                      <Typography>
                        <strong>Feedback rating:</strong>{" "}
                        {row.feedback_rating ?? "—"}
                      </Typography>

                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
                        <TextField
                          select
                          fullWidth
                          label="Attendance status"
                          value={row.attendance_status}
                          onChange={(event) =>
                            handleChange(
                              row.member_id,
                              event.target.value as AttendanceStatus,
                              row.attendance_mode,
                            )
                          }
                          disabled={busyMemberId === row.member_id}
                        >
                          {attendanceStatuses.map((status) => (
                            <MenuItem key={status} value={status}>
                              {status}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          select
                          fullWidth
                          label="Attendance mode"
                          value={row.attendance_mode ?? ""}
                          onChange={(event) =>
                            handleChange(
                              row.member_id,
                              row.attendance_status,
                              (event.target.value || null) as AttendanceMode | null,
                            )
                          }
                          disabled={busyMemberId === row.member_id}
                        >
                          <MenuItem value="">None</MenuItem>
                          {attendanceModes.map((mode) => (
                            <MenuItem key={mode} value={mode}>
                              {mode}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}