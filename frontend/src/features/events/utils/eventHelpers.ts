import type {
  AttendanceMode,
  AttendanceStatus,
  DecisionStatus,
  Event,
  EventApplication,
} from "../../../types/event";

export type EventPhase = "upcoming" | "checkin_open" | "ongoing" | "past";
export type EventTimeStatus = "all" | "upcoming" | "ongoing" | "past";
export type EventDisplayStatus = "upcoming" | "ongoing" | "past";
export type EventManagementTab =
  | "overview"
  | "applications"
  | "attendance"
  | "stats";

export function getEventPhase(event: Event): EventPhase {
  const now = new Date();
  const start = new Date(event.start_datetime);
  const end = event.end_datetime ? new Date(event.end_datetime) : null;

  const checkInStart = new Date(start.getTime() - 60 * 60 * 1000);

  if (now < checkInStart) {
    return "upcoming";
  }

  if (now >= checkInStart && now < start) {
    return "checkin_open";
  }

  if (!end || now <= end) {
    return "ongoing";
  }

  return "past";
}

export function getEventTimeStatus(event: Event): EventDisplayStatus {
  const phase = getEventPhase(event);

  if (phase === "checkin_open") {
    return "upcoming";
  }

  return phase;
}

export function formatEventDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function hasEventEnded(event: Event): boolean {
  const end = event.end_datetime ? new Date(event.end_datetime) : null;

  if (!end) {
    return new Date(event.start_datetime) < new Date();
  }

  return end < new Date();
}

export function canManageAttendance(event: Event): boolean {
  const phase = getEventPhase(event);
  return phase === "checkin_open" || phase === "ongoing" || phase === "past";
}

export function canManageAttendanceForApplication(
  event: Event,
  application: EventApplication,
): boolean {
  if (!canManageAttendance(event)) {
    return false;
  }

  return application.decision_status === "accepted";
}

export function canSubmitFeedback(
  event: Event,
  application: EventApplication | null,
): boolean {
  if (!application) {
    return false;
  }

  if (application.feedback_submitted_at) {
    return false;
  }

  if (application.attendance_status === "attended") {
    return true;
  }

  return getEventPhase(event) === "past";
}

export function getAttendanceModeLabel(
  mode: AttendanceMode | null,
): string {
  switch (mode) {
    case "in_person":
      return "Presencial";
    case "online":
      return "En línea";
    default:
      return "—";
  }
}

export function getDecisionStatusLabel(status: DecisionStatus): string {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "accepted":
      return "Aceptada";
    case "rejected":
      return "Rechazada";
    case "waitlisted":
      return "En espera";
    case "cancelled":
      return "Cancelada";
    default:
      return status;
  }
}

export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  switch (status) {
    case "unknown":
      return "Desconocida";
    case "attended":
      return "Asistió";
    case "no_show":
      return "No asistió";
    default:
      return status;
  }
}

export function getEventPhaseLabel(phase: EventPhase): string {
  switch (phase) {
    case "upcoming":
      return "Próximo";
    case "checkin_open":
      return "Check-in abierto";
    case "ongoing":
      return "En curso";
    case "past":
      return "Finalizado";
    default:
      return phase;
  }
}

export function getEventStatusLabel(status: EventDisplayStatus): string {
  switch (status) {
    case "upcoming":
      return "Próximo";
    case "ongoing":
      return "En curso";
    case "past":
      return "Finalizado";
    default:
      return "—";
  }
}

export function getEventPhaseChipColor(
  phase: EventPhase,
): "default" | "primary" | "success" | "warning" {
  switch (phase) {
    case "upcoming":
      return "primary";
    case "checkin_open":
      return "warning";
    case "ongoing":
      return "success";
    case "past":
      return "default";
    default:
      return "default";
  }
}

export function getStatusChipColor(
  status: EventDisplayStatus,
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

export function filterApplicationsBySearch(
  applications: EventApplication[],
  search: string,
): EventApplication[] {
  const normalized = search.trim().toLowerCase();

  if (!normalized) {
    return applications;
  }

  return applications.filter((application) => {
    const memberId = String(application.member_id).toLowerCase();
    const decision = String(application.decision_status).toLowerCase();
    const attendance = String(application.attendance_status).toLowerCase();
    const mode = String(application.attendance_mode ?? "").toLowerCase();

    return (
      memberId.includes(normalized) ||
      decision.includes(normalized) ||
      attendance.includes(normalized) ||
      mode.includes(normalized)
    );
  });
}

export function sortApplicationsByAppliedAt(
  applications: EventApplication[],
  order: "newest" | "oldest",
): EventApplication[] {
  return [...applications].sort((a, b) => {
    const left = new Date(a.applied_at).getTime();
    const right = new Date(b.applied_at).getTime();

    return order === "newest" ? right - left : left - right;
  });
}

export function getManagementTabFromSearchParams(
  searchParams: URLSearchParams,
): EventManagementTab {
  const tab = searchParams.get("tab");

  if (
    tab === "overview" ||
    tab === "applications" ||
    tab === "attendance" ||
    tab === "stats"
  ) {
    return tab;
  }

  return "overview";
}