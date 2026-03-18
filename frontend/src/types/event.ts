export type AttendanceMode = "in_person" | "online";

export type Event = {
  event_id: number;
  title: string;
  description: string | null;
  starts_at: string | null;
  location: string | null;
  attendance_mode: AttendanceMode | null;
  capacity: number | null;
  is_active: boolean;
};

export type EventListResponse = {
  items: Event[];
  total: number;
  limit: number;
  offset: number;
};