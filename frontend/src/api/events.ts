import { apiClient } from "./client";
import type {
  Event,
  EventApplication,
  EventApplicationAttendancePayload,
  EventApplicationCreatePayload,
  EventApplicationDecisionPayload,
  EventApplicationFeedbackPayload,
  EventApplicationListResponse,
  EventAttendanceResponse,
  EventCreatePayload,
  EventListResponse,
  EventStats,
  EventUpdatePayload,
} from "../types/event";

type PaginationParams = {
  limit?: number;
  offset?: number;
};

export async function listEvents(
  params: PaginationParams = {},
): Promise<EventListResponse> {
  const response = await apiClient.get<EventListResponse>("/events", {
    params: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  });

  return response.data;
}

export async function getEvent(eventId: string | number): Promise<Event> {
  const response = await apiClient.get<Event>(`/events/${eventId}`);
  return response.data;
}

export async function createEvent(payload: EventCreatePayload): Promise<Event> {
  const response = await apiClient.post<Event>("/events", payload);
  return response.data;
}

export async function updateEvent(
  eventId: string | number,
  payload: EventUpdatePayload,
): Promise<Event> {
  const response = await apiClient.patch<Event>(`/events/${eventId}`, payload);
  return response.data;
}

export async function deleteEvent(
  eventId: string | number,
): Promise<{ status: string }> {
  const response = await apiClient.delete<{ status: string }>(
    `/events/${eventId}`,
  );
  return response.data;
}

export async function getMyEventApplication(
  eventId: string | number,
): Promise<EventApplication> {
  const response = await apiClient.get<EventApplication>(
    `/events/${eventId}/applications/me`,
  );
  return response.data;
}

export async function applyToEvent(
  eventId: string | number,
  payload: EventApplicationCreatePayload,
): Promise<EventApplication> {
  const response = await apiClient.post<EventApplication>(
    `/events/${eventId}/applications`,
    payload,
  );
  return response.data;
}

export async function submitMyEventFeedback(
  eventId: string | number,
  payload: EventApplicationFeedbackPayload,
): Promise<EventApplication> {
  const response = await apiClient.post<EventApplication>(
    `/events/${eventId}/applications/me/feedback`,
    payload,
  );
  return response.data;
}

export async function listEventApplications(
  eventId: string | number,
  params: PaginationParams = {},
): Promise<EventApplicationListResponse> {
  const response = await apiClient.get<EventApplicationListResponse>(
    `/events/${eventId}/applications`,
    {
      params: {
        limit: params.limit ?? 100,
        offset: params.offset ?? 0,
      },
    },
  );

  return response.data;
}

export async function decideEventApplication(
  eventId: string | number,
  memberId: string | number,
  payload: EventApplicationDecisionPayload,
): Promise<EventApplication> {
  const response = await apiClient.post<EventApplication>(
    `/events/${eventId}/applications/${memberId}/decide`,
    payload,
  );
  return response.data;
}

export async function listEventAttendance(
  eventId: string | number,
  params: PaginationParams = {},
): Promise<EventAttendanceResponse> {
  const response = await apiClient.get<EventAttendanceResponse>(
    `/events/${eventId}/attendance`,
    {
      params: {
        limit: params.limit ?? 100,
        offset: params.offset ?? 0,
      },
    },
  );

  return response.data;
}

export async function updateEventAttendance(
  eventId: string | number,
  memberId: string | number,
  payload: EventApplicationAttendancePayload,
): Promise<EventApplication> {
  const response = await apiClient.post<EventApplication>(
    `/events/${eventId}/applications/${memberId}/attendance`,
    payload,
  );
  return response.data;
}

export async function getEventStats(
  eventId: string | number,
): Promise<EventStats> {
  const response = await apiClient.get<EventStats>(`/events/${eventId}/stats`);
  return response.data;
}