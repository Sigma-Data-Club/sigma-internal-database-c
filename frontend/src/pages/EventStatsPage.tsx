import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import { getEvent, getEventStats } from "../api/events";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../auth/permissions";
import type { Event, EventStats } from "../types/event";

export default function EventStatsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [eventData, setEventData] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canReadEventStats = hasPermission(user, "event.stats.read");

  useEffect(() => {
    async function loadData() {
      if (authLoading) {
        return;
      }

      if (!canReadEventStats) {
        setError("You do not have permission to view event statistics.");
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

        const [eventResult, statsResult] = await Promise.all([
          getEvent(eventId),
          getEventStats(eventId),
        ]);

        setEventData(eventResult);
        setStats(statsResult);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const message =
            typeof err.response?.data?.detail === "string"
              ? err.response.data.detail
              : "Failed to load event stats.";

          setError(message);
        } else {
          setError("Failed to load event stats.");
        }
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [eventId, authLoading, canReadEventStats]);

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
              Event stats
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {eventData?.title ?? "Statistics for this event"}
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

        {!loading && !error && stats && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={1.25}>
              <Typography variant="h6">Applications</Typography>
              <Typography><strong>Total:</strong> {stats.total_applications}</Typography>
              <Typography><strong>Accepted:</strong> {stats.accepted}</Typography>
              <Typography><strong>Rejected:</strong> {stats.rejected}</Typography>
              <Typography><strong>Pending:</strong> {stats.pending}</Typography>
              <Typography><strong>Waitlisted:</strong> {stats.waitlisted}</Typography>
              <Typography><strong>Cancelled:</strong> {stats.cancelled}</Typography>

              <Box sx={{ pt: 1 }} />

              <Typography variant="h6">Attendance</Typography>
              <Typography><strong>Attended:</strong> {stats.attended}</Typography>
              <Typography><strong>No show:</strong> {stats.no_show}</Typography>
              <Typography><strong>Unknown:</strong> {stats.unknown_attendance}</Typography>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}