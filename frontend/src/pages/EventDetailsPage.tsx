import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import { useNavigate, useParams } from "react-router-dom";

import { getEvent } from "../api/events";
import type { Event } from "../types/event";

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvent() {
      if (!eventId) {
        setError("Event ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getEvent(eventId);
        setEventData(data);
      } catch {
        setError("Failed to load event details.");
      } finally {
        setLoading(false);
      }
    }

    void loadEvent();
  }, [eventId]);

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
          <Paper sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Typography>
                <strong>ID:</strong> {eventData.event_id}
              </Typography>
              <Typography>
                <strong>Title:</strong> {eventData.title}
              </Typography>
              <Typography>
                <strong>Description:</strong> {eventData.description ?? "—"}
              </Typography>
              <Typography>
                <strong>Starts at:</strong> {eventData.starts_at ?? "—"}
              </Typography>
              <Typography>
                <strong>Location:</strong> {eventData.location ?? "—"}
              </Typography>
              <Box>
                <strong>Attendance mode:</strong>{" "}
                <Chip
                  label={eventData.attendance_mode ?? "—"}
                  size="small"
                />
              </Box>
              <Typography>
                <strong>Capacity:</strong> {eventData.capacity ?? "—"}
              </Typography>
              <Typography>
                <strong>Active:</strong> {eventData.is_active ? "Yes" : "No"}
              </Typography>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}