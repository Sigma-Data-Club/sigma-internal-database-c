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

import PageHeader from "../../../components/common/PageHeader";
import { listEvents } from "../../../api/events";
import { useAuth } from "../../../context/AuthContext";
import { hasPermission } from "../../../auth/permissions";
import type { Event } from "../../../types/event";
import { eventStrings } from "../utils/eventStrings";
import {
  formatEventDateTime,
  getEventStatusLabel,
  getEventTimeStatus,
  getStatusChipColor,
  type EventTimeStatus,
} from "../utils/eventHelpers";
import { extractEventApiErrorMessage } from "../utils/eventErrors";

export default function EventsPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<EventTimeStatus>("all");

  const canReadEvents = hasPermission(user, "event.read");
  const canCreateEvent = hasPermission(user, "event.create");
  const canReadAnalytics = hasPermission(user, "event.stats.read");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!canReadEvents) {
      setEvents([]);
      setError(eventStrings.messages.noEventsPermission);
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
            setError(eventStrings.messages.sessionExpired);
          } else if (status === 403) {
            setError(eventStrings.messages.noEventsPermission);
          } else if (status === 404) {
            setError(eventStrings.messages.eventsEndpointNotFound);
          } else {
            setError(
              extractEventApiErrorMessage(
                err,
                eventStrings.messages.failedToLoadEvents,
              ),
            );
          }
        } else {
          setError(eventStrings.messages.unexpectedError);
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
        <PageHeader
          title={eventStrings.page.listTitle}
          subtitle={eventStrings.page.listSubtitle}
          actions={
            <Stack direction="row" spacing={1}>
              {canReadAnalytics && (
                <Button
                  variant="outlined"
                  onClick={() => navigate("/events/analytics")}
                >
                  {eventStrings.page.analyticsTitle}
                </Button>
              )}

              {canCreateEvent && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/events/new")}
                >
                  {eventStrings.actions.createEvent}
                </Button>
              )}
            </Stack>
          }
        />

        <TextField
          label={eventStrings.filters.searchEvents}
          placeholder={eventStrings.filters.searchEventsPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
        />

        <Tabs
          value={filter}
          onChange={(_, value: EventTimeStatus) => setFilter(value)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab value="all" label={eventStrings.filters.all} />
          <Tab value="upcoming" label={eventStrings.filters.upcoming} />
          <Tab value="ongoing" label={eventStrings.filters.ongoing} />
          <Tab value="past" label={eventStrings.filters.past} />
        </Tabs>

        {loading && (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <CircularProgress size={24} />
            <Typography>{eventStrings.messages.loadingEvents}</Typography>
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
          <Paper>
            {filteredEvents.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography>
                  {search.trim() || filter !== "all"
                    ? eventStrings.empty.noEventsWithFilters
                    : eventStrings.empty.noEvents}
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredEvents.map((event) => {
                  const status = getEventTimeStatus(event);

                  return (
                    <Box key={event.event_id}>
                      <ListItemButton
                        onClick={() => navigate(`/events/${event.event_id}/manage?tab=overview`)}
                      >
                        <ListItemText
                          primary={
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                              alignItems={{ xs: "flex-start", sm: "center" }}
                            >
                              <Typography variant="subtitle1">
                                {event.title}
                              </Typography>
                              <Chip
                                label={getEventStatusLabel(status)}
                                size="small"
                                color={getStatusChipColor(status)}
                              />
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {eventStrings.labels.topic}: {event.topic || "—"}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {eventStrings.labels.speaker}: {event.speaker_name || "—"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {eventStrings.labels.id}: {event.event_id} ·{" "}
                                {formatEventDateTime(event.start_datetime)}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItemButton>
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