import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import PageHeader from "../../../components/common/PageHeader";
import { getEventsAnalyticsDashboard } from "../../../api/eventAnalytics";
import type {
  EventsAnalyticsDashboard,
  EventsTopEventRow,
} from "../../../types/eventAnalytics";
import { eventStrings } from "../utils/eventStrings";
import { extractEventApiErrorMessage } from "../utils/eventErrors";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Paper sx={{ p: 2, minWidth: 180 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 1 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function EventAnalyticsPage() {
  const [data, setData] = useState<EventsAnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const dashboard = await getEventsAnalyticsDashboard({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        top_limit: 10,
      });

      setData(dashboard);
    } catch (err) {
      setError(
        extractEventApiErrorMessage(
          err,
          "Failed to load event analytics.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <PageHeader
          title={eventStrings.page.analyticsTitle}
          subtitle={eventStrings.page.analyticsSubtitle}
        />

        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label={eventStrings.filters.dateFrom}
              type="datetime-local"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label={eventStrings.filters.dateTo}
              type="datetime-local"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => void load()}>
                {eventStrings.actions.applyFilters}
              </Button>
              <Button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                {eventStrings.actions.resetFilters}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {loading && (
          <Typography>{eventStrings.messages.loadingAnalytics}</Typography>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {data && (
          <>
            <Stack direction="row" flexWrap="wrap" gap={2}>
              <StatCard
                label={eventStrings.analytics.cards.totalEvents}
                value={data.total_events}
              />
              <StatCard
                label={eventStrings.analytics.cards.totalApplications}
                value={data.total_applications}
              />
              <StatCard
                label={eventStrings.analytics.cards.accepted}
                value={data.accepted}
              />
              <StatCard
                label={eventStrings.analytics.cards.attended}
                value={data.attended}
              />
              <StatCard
                label={eventStrings.analytics.cards.noShow}
                value={data.no_show}
              />
              <StatCard
                label={eventStrings.analytics.cards.avgFeedback}
                value={data.avg_feedback_rating ?? "-"}
              />
              <StatCard
                label={eventStrings.analytics.cards.attendanceRate}
                value={`${(data.attendance_rate * 100).toFixed(1)}%`}
              />
              <StatCard
                label={eventStrings.analytics.cards.acceptanceRate}
                value={`${(data.application_acceptance_rate * 100).toFixed(1)}%`}
              />
            </Stack>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {eventStrings.analytics.charts.topEvents}
              </Typography>

              <Stack spacing={1}>
                {data.top_events.length === 0 ? (
                  <Typography color="text.secondary">
                    {eventStrings.empty.noData}
                  </Typography>
                ) : (
                  data.top_events.map((event: EventsTopEventRow) => (
                    <Paper
                      key={event.event_id}
                      variant="outlined"
                      sx={{ p: 2 }}
                    >
                      <Typography variant="subtitle1">{event.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Applications: {event.total_applications} · Accepted:{" "}
                        {event.accepted} · Attended: {event.attended} · No-show:{" "}
                        {event.no_show} · Attendance rate:{" "}
                        {(event.attendance_rate * 100).toFixed(1)}%
                      </Typography>
                    </Paper>
                  ))
                )}
              </Stack>
            </Paper>
          </>
        )}
      </Stack>
    </Box>
  );
}