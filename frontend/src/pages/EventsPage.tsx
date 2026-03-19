import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";

import { listEvents } from "../api/events";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../auth/permissions";
import type { Event } from "../types/event";

type EventFilter = "all" | "upcoming" | "ongoing" | "past";

function getEventTimeStatus(event: Event): EventFilter {
  const now = new Date();
  const start = new Date(event.start_datetime);
  const end = event.end_datetime ? new Date(event.end_datetime) : null;

  if (start > now) {
    return "upcoming";
  }

  if (end && end < now) {
    return "past";
  }

  if (start <= now && (!end || end >= now)) {
    return "ongoing";
  }

  return "past";
}

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

function getStatusChipColor(
  status: EventFilter,
): "default" | "primary" | "success" | "warning" {
  switch (status) {
    case "upcoming":
      return "primary";
    case "ongoing":
      return "success";
    case "past":
      return "default";
    default:
      return "default";
  }
}

export default function EventsPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<EventFilter>("all");

  const canReadEvents = hasPermission(user, "event.read");
  const canCreateEvent = hasPermission(user, "event.create");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!canReadEvents) {
      setEvents([]);
      setError("You do not have permission to view events.");
      setLoading(false);
      return;
    }

    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await listEvents();
        setEvents(data.items);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;

          if (status === 401) {
            setError("Session expired. Please sign in again.");
          } else if (status === 403) {
            setError("You do not have permission to view events.");
          } else if (status === 404) {
            setError("Events endpoint was not found.");
          } else {
            setError("Failed to load events.");
          }
        } else {
          setError("Unexpected error.");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadEvents();
  }, [authLoading, canReadEvents]);

  const filteredEvents = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return events.filter((event) => {
      const status = getEventTimeStatus(event);

      if (filter !== "all" && status !== filter) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      const title = event.title.toLowerCase();
      const topic = (event.topic ?? "").toLowerCase();
      const speaker = (event.speaker_name ?? "").toLowerCase();

      return (
        title.includes(normalized) ||
        topic.includes(normalized) ||
        speaker.includes(normalized) ||
        String(event.event_id).includes(normalized)
      );
    });
  }, [events, search, filter]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Events
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browse events, applications, attendance, and statistics.
            </Typography>
          </Box>

          {canCreateEvent && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/events/new")}
            >
              Create event
            </Button>
          )}
        </Stack>

        <TextField
          label="Search events"
          placeholder="Search by title, topic, speaker or ID"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
        />

        <Tabs
          value={filter}
          onChange={(_, value: EventFilter) => setFilter(value)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab value="all" label="All" />
          <Tab value="upcoming" label="Upcoming" />
          <Tab value="ongoing" label="Ongoing" />
          <Tab value="past" label="Past" />
        </Tabs>

        {loading && (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <CircularProgress size={24} />
            <Typography>Loading events...</Typography>
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
          <Paper>
            {filteredEvents.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography>
                  {search.trim() || filter !== "all"
                    ? "No events match your filters."
                    : "No events found."}
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredEvents.map((event, index) => {
                  const status = getEventTimeStatus(event);

                  return (
                    <Box key={event.event_id}>
                      <ListItemButton onClick={() => navigate(`/events/${event.event_id}`)}>
                        <ListItemText
                          primary={
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                              alignItems={{ xs: "flex-start", sm: "center" }}
                            >
                              <Typography variant="subtitle1">{event.title}</Typography>
                              <Chip
                                label={status}
                                size="small"
                                color={getStatusChipColor(status)}
                              />
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Topic: {event.topic || "—"}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Speaker: {event.speaker_name || "—"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {event.event_id}
                                {` • Start: ${formatDateTime(event.start_datetime)}`}
                                {event.end_datetime
                                  ? ` • End: ${formatDateTime(event.end_datetime)}`
                                  : ""}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItemButton>

                      {index < filteredEvents.length - 1 && (
                        <Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />
                      )}
                    </Box>
                  );
                })}
              </List>
            )}
          </Paper>
        )}
      </Stack>
    </Box>
  );
}