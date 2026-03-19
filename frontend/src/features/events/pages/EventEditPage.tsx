import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";

import EventForm from "../../../components/events/EventForm";
import { getEvent, updateEvent } from "../../../api/events";
import { useAuth } from "../../../context/AuthContext";
import { hasPermission } from "../../../auth/permissions";
import type { Event, EventUpdatePayload } from "../../../types/event";

export default function EventEditPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [eventData, setEventData] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUpdateEvent = hasPermission(user, "event.update");

  useEffect(() => {
    async function loadEvent() {
      if (authLoading) {
        return;
      }

      if (!canUpdateEvent) {
        setError("You do not have permission to edit events.");
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

        const data = await getEvent(eventId);
        setEventData(data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const detail = err.response?.data?.detail;
          const message =
            typeof detail === "string"
              ? detail
              : detail?.message ?? "Failed to load event.";

          setError(message);
        } else {
          setError("Failed to load event.");
        }
      } finally {
        setLoading(false);
      }
    }

    void loadEvent();
  }, [eventId, authLoading, canUpdateEvent]);

  const handleSubmit = async (payload: EventUpdatePayload) => {
    if (!eventId) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const updated = await updateEvent(eventId, payload);
      navigate(`/events/${updated.event_id}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        const message =
          typeof detail === "string"
            ? detail
            : detail?.message ?? "Failed to update event.";

        setError(message);
      } else {
        setError("Failed to update event.");
      }
    } finally {
      setSubmitting(false);
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
              Edit event
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update the selected event.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
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

        {!loading && !error && eventData && (
          <EventForm
            mode="edit"
            initialEvent={eventData}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}
      </Stack>
    </Box>
  );
}