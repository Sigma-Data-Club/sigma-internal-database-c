import { apiClient } from "./client";
import type { Event, EventListResponse } from "../types/event";

type ListEventsParams = {
  limit?: number;
  offset?: number;
};

export async function listEvents(
  params: ListEventsParams = {},
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