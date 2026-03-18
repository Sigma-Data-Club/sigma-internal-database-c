import { useState } from "react";
import axios from "axios";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

import EventForm from "../components/events/EventForm";
import { createEvent } from "../api/events";
import type { EventCreatePayload } from "../types/event";

export default function EventCreatePage() {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: EventCreatePayload) => {
    try {
      setSubmitting(true);
      setError(null);

      const created = await createEvent(payload);
      navigate(`/events/${created.event_id}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        const message =
          typeof detail === "string"
            ? detail
            : detail?.message ?? "Failed to create event.";

        setError(message);
      } else {
        setError("Failed to create event.");
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
              Create event
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fill in the event fields and save a new event.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/events")}
          >
            Back to events
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <EventForm mode="create" submitting={submitting} onSubmit={handleSubmit} />
      </Stack>
    </Box>
  );
}