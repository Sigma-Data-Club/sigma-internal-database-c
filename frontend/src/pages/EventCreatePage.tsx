import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

import EventForm from "../components/events/EventForm";
import { createEvent } from "../api/events";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../auth/permissions";
import type { EventCreatePayload } from "../types/event";

export default function EventCreatePage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const canCreateEvent = hasPermission(user, "event.create");

  const handleSubmit = async (payload: EventCreatePayload) => {
    const created = await createEvent(payload);
    navigate(`/events/${created.event_id}`);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading permissions...</Typography>
      </Box>
    );
  }

  if (!canCreateEvent) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Alert severity="error">
            You do not have permission to create events.
          </Alert>
          <Button variant="outlined" onClick={() => navigate("/events")}>
            Back to events
          </Button>
        </Stack>
      </Box>
    );
  }

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
              Create a new event.
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

        <EventForm mode="create" submitting={false} onSubmit={handleSubmit} />
      </Stack>
    </Box>
  );
}