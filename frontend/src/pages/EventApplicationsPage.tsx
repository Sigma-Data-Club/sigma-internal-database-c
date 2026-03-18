import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import {
  decideEventApplication,
  getEvent,
  listEventApplications,
} from "../api/events";
import type { DecisionStatus, Event, EventApplication } from "../types/event";

const decisionOptions: DecisionStatus[] = [
  "pending",
  "accepted",
  "rejected",
  "waitlisted",
  "cancelled",
];

type SortDirection = "newest" | "oldest";

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

export default function EventApplicationsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState<Event | null>(null);
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>("newest");
  const [topN, setTopN] = useState("5");

  useEffect(() => {
    async function loadData() {
      if (!eventId) {
        setError("Event ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setActionError(null);

        const [eventResult, applicationsResult] = await Promise.all([
          getEvent(eventId),
          listEventApplications(eventId),
        ]);

        setEventData(eventResult);
        setApplications(applicationsResult.items);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const detail = err.response?.data?.detail;
          const message =
            typeof detail === "string"
              ? detail
              : detail?.message ?? "Failed to load event applications.";

          setError(message);
        } else {
          setError("Failed to load event applications.");
        }
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [eventId]);

  const sortedApplications = useMemo(() => {
    const copy = [...applications];

    copy.sort((a, b) => {
      const first = new Date(a.applied_at).getTime();
      const second = new Date(b.applied_at).getTime();

      return sortDirection === "newest" ? second - first : first - second;
    });

    return copy;
  }, [applications, sortDirection]);

  const handleDecision = async (
    memberId: number,
    decision_status: DecisionStatus,
  ) => {
    if (!eventId) {
      return;
    }

    try {
      setBusyMemberId(memberId);
      setActionError(null);

      const updated = await decideEventApplication(eventId, memberId, {
        decision_status,
      });

      setApplications((current) =>
        current.map((item) => (item.member_id === memberId ? updated : item)),
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        const message =
          typeof detail === "string"
            ? detail
            : detail?.message ?? "Failed to update application decision.";

        setActionError(message);
      } else {
        setActionError("Failed to update application decision.");
      }
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleApproveMany = async (items: EventApplication[]) => {
    if (!eventId || items.length === 0) {
      return;
    }

    try {
      setBulkBusy(true);
      setActionError(null);

      for (const item of items) {
        const updated = await decideEventApplication(eventId, item.member_id, {
          decision_status: "accepted",
        });

        setApplications((current) =>
          current.map((row) =>
            row.member_id === item.member_id ? updated : row,
          ),
        );
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        const message =
          typeof detail === "string"
            ? detail
            : detail?.message ?? "Bulk approve failed.";

        setActionError(message);
      } else {
        setActionError("Bulk approve failed.");
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const pendingApplications = sortedApplications.filter(
    (item) => item.decision_status === "pending",
  );

  const topNNumber = Number(topN);
  const topNPending =
    Number.isInteger(topNNumber) && topNNumber > 0
      ? pendingApplications.slice(0, topNNumber)
      : [];

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
              Event applications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {eventData?.title ?? "Manage applications for this event"}
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
        {!loading && actionError && <Alert severity="error">{actionError}</Alert>}

        {!loading && !error && (
          <>
            <Paper sx={{ p: 3 }}>
              <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", lg: "center" }}
              >
                <TextField
                  select
                  label="Order by application time"
                  value={sortDirection}
                  onChange={(event) =>
                    setSortDirection(event.target.value as SortDirection)
                  }
                  sx={{ minWidth: 240 }}
                >
                  <MenuItem value="newest">Newest first</MenuItem>
                  <MenuItem value="oldest">Oldest first</MenuItem>
                </TextField>

                <Button
                  variant="outlined"
                  onClick={() => handleApproveMany(pendingApplications)}
                  disabled={bulkBusy || pendingApplications.length === 0}
                >
                  {bulkBusy ? "Approving..." : "Approve all pending"}
                </Button>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <TextField
                    label="Top N"
                    type="number"
                    value={topN}
                    onChange={(event) => setTopN(event.target.value)}
                    inputProps={{ min: 1 }}
                    sx={{ width: 120 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => handleApproveMany(topNPending)}
                    disabled={bulkBusy || topNPending.length === 0}
                  >
                    Approve top N pending
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            {sortedApplications.length === 0 ? (
              <Paper sx={{ p: 3 }}>
                <Typography>No applications found.</Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {sortedApplications.map((application) => (
                  <Paper key={application.member_id} sx={{ p: 3 }}>
                    <Stack spacing={1.5}>
                      <Typography variant="h6">
                        Member #{application.member_id}
                      </Typography>

                      <Typography>
                        <strong>Applied at:</strong>{" "}
                        {formatDateTime(application.applied_at)}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ flexWrap: "wrap" }}
                      >
                        <Typography>
                          <strong>Decision:</strong>
                        </Typography>
                        <Chip label={application.decision_status} size="small" />
                      </Stack>

                      <Typography>
                        <strong>Attendance status:</strong>{" "}
                        {application.attendance_status}
                      </Typography>

                      <Typography>
                        <strong>Attendance mode:</strong>{" "}
                        {application.attendance_mode ?? "—"}
                      </Typography>

                      <Typography>
                        <strong>Feedback rating:</strong>{" "}
                        {application.feedback_rating ?? "—"}
                      </Typography>

                      <Typography>
                        <strong>Feedback submitted at:</strong>{" "}
                        {formatDateTime(application.feedback_submitted_at)}
                      </Typography>

                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1}
                        flexWrap="wrap"
                      >
                        {decisionOptions.map((decision) => (
                          <Button
                            key={decision}
                            variant={
                              application.decision_status === decision
                                ? "contained"
                                : "outlined"
                            }
                            onClick={() =>
                              handleDecision(application.member_id, decision)
                            }
                            disabled={
                              busyMemberId === application.member_id || bulkBusy
                            }
                          >
                            {decision}
                          </Button>
                        ))}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}