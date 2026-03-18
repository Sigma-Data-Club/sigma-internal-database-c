import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { listEvents } from "../api/events";
import type { Event } from "../types/event";

export default function EventsPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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

    if (!normalized) {
      return events;
    }

    return events.filter((event) => {
      const title = event.title.toLowerCase();
      const description = (event.description ?? "").toLowerCase();
      const location = (event.location ?? "").toLowerCase();
      const mode = (event.attendance_mode ?? "").toLowerCase();

      return (
        title.includes(normalized) ||
        description.includes(normalized) ||
        location.includes(normalized) ||
        mode.includes(normalized) ||
        String(event.event_id).includes(normalized)
      );
    });
  }, [events, search]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Events
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse club events and open detailed pages.
          </Typography>
        </Box>

        <TextField
          label="Search events"
          placeholder="Search by title, location, mode or ID"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
        />

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
                    : "No events found."}
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredEvents.map((event) => (
                  <ListItemButton
                    key={event.event_id}
                    divider
                    onClick={() => navigate(`/events/${event.event_id}`)}
                  >
                    <ListItemText
                      primary={event.title}
                      secondary={
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mt: 0.5, flexWrap: "wrap" }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {event.location || "No location"}
                          </Typography>
                          {event.attendance_mode && (
                            <Chip
                              label={event.attendance_mode}
                              size="small"
                              color={
                                event.attendance_mode === "online"
                                  ? "info"
                                  : "success"
                              }
                            />
                          )}
                        </Stack>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        )}
      </Stack>
    </Box>
  );
}