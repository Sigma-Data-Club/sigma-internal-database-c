import { apiClient } from "./client";
import type { EventsAnalyticsDashboard } from "../types/eventAnalytics";

type EventsAnalyticsDashboardParams = {
  date_from?: string;
  date_to?: string;
  top_limit?: number;
};

export async function getEventsAnalyticsDashboard(
  params: EventsAnalyticsDashboardParams = {},
): Promise<EventsAnalyticsDashboard> {
  const response = await apiClient.get<EventsAnalyticsDashboard>(
    "/events/analytics/dashboard",
    {
      params: {
        date_from: params.date_from,
        date_to: params.date_to,
        top_limit: params.top_limit ?? 10,
      },
    },
  );

  return response.data;
}