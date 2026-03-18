export type AttendanceMode = "in_person" | "online";

export type DecisionStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "waitlisted"
  | "cancelled";

export type AttendanceStatus = "unknown" | "attended" | "no_show";

export type Event = {
  event_id: number;
  title: string;
  start_datetime: string;
  end_datetime: string | null;
  speaker_name: string | null;
  topic: string | null;
  created_by_member_id: number | null;
  created_at: string;
};

export type EventListResponse = {
  items: Event[];
  total: number;
  limit: number;
  offset: number;
};

export type EventCreatePayload = {
  title: string;
  start_datetime: string;
  end_datetime?: string | null;
  speaker_name?: string | null;
  topic?: string | null;
};

export type EventUpdatePayload = Partial<EventCreatePayload>;

export type EventApplication = {
  event_id: number;
  member_id: number;
  applied_at: string;
  decision_status: DecisionStatus;
  attendance_status: AttendanceStatus;
  attendance_mode: AttendanceMode | null;
  feedback_rating: number | null;
  feedback_comment: string | null;
  feedback_submitted_at: string | null;
};

export type EventApplicationListResponse = {
  items: EventApplication[];
  total: number;
  limit: number;
  offset: number;
};

export type EventApplicationCreatePayload = {
  attendance_mode?: AttendanceMode | null;
};

export type EventApplicationDecisionPayload = {
  decision_status: DecisionStatus;
};

export type EventApplicationAttendancePayload = {
  attendance_status: AttendanceStatus;
  attendance_mode?: AttendanceMode | null;
};

export type EventApplicationFeedbackPayload = {
  rating: number;
  comment?: string | null;
};

export type EventAttendanceRow = {
  member_id: number;
  applied_at: string;
  decision_status: DecisionStatus;
  attendance_status: AttendanceStatus;
  attendance_mode: AttendanceMode | null;
  feedback_rating: number | null;
};

export type EventAttendanceResponse = {
  items: EventAttendanceRow[];
  total: number;
  limit: number;
  offset: number;
};

export type EventStats = {
  event_id: number;
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
};