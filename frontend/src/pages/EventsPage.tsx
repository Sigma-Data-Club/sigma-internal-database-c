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

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<EventFilter>("all");

  useEffect(() => {
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
  }, []);

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
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Events
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browse club events, filter them by time, and open detailed pages.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/events/new")}
          >
            Create event
          </Button>
        </Stack>

        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Tabs
              value={filter}
              onChange={(_, value: EventFilter) => setFilter(value)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="All" value="all" />
              <Tab label="Upcoming" value="upcoming" />
              <Tab label="Ongoing" value="ongoing" />
              <Tab label="Past" value="past" />
            </Tabs>

            <TextField
              label="Search events"
              placeholder="Search by title, topic, speaker or ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              fullWidth
            />
          </Stack>
        </Paper>

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
                  {search.trim()
                    ? "No events match your search."
                    : "No events found for this filter."}
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredEvents.map((event) => {
                  const status = getEventTimeStatus(event);

                  return (
                    <ListItemButton
                      key={event.event_id}
                      divider
                      onClick={() => navigate(`/events/${event.event_id}`)}
                    >
                      <ListItemText
                        primary={event.title}
                        secondary={
                          <Stack spacing={1} sx={{ mt: 0.75 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ flexWrap: "wrap" }}
                            >
                              <Chip
                                label={status}
                                size="small"
                                color={getStatusChipColor(status)}
                              />

                              {event.topic && (
                                <Chip
                                  label={event.topic}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Stack>

                            <Typography variant="body2" color="text.secondary">
                              <strong>Starts:</strong>{" "}
                              {formatDateTime(event.start_datetime)}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                              <strong>Ends:</strong>{" "}
                              {formatDateTime(event.end_datetime)}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                              <strong>Speaker:</strong>{" "}
                              {event.speaker_name ?? "—"}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                              <strong>ID:</strong> {event.event_id}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItemButton>
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