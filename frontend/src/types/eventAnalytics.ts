export type EventsAnalyticsTimeseriesPoint = {
  day: string;
  events_count: number;
  applications: number;
  accepted: number;
  attended: number;
  no_show: number;
};

export type EventsTopEventRow = {
  event_id: number;
  title: string;
  start_datetime: string;
  total_applications: number;
  accepted: number;
  attended: number;
  no_show: number;
  attendance_rate: number;
  no_show_rate: number;
  avg_feedback_rating: number | null;
};

export type EventsAnalyticsDashboard = {
  total_events: number;
  upcoming_events: number;
  ongoing_events: number;
  past_events: number;

  total_applications: number;
  accepted: number;
  rejected: number;
  pending: number;
  waitlisted: number;
  cancelled: number;

  attended: number;
  no_show: number;
  unknown_attendance: number;

  online: number;
  in_person: number;

  avg_feedback_rating: number | null;
  application_acceptance_rate: number;
  attendance_rate: number;
  no_show_rate: number;

  timeseries: EventsAnalyticsTimeseriesPoint[];
  top_events: EventsTopEventRow[];
};