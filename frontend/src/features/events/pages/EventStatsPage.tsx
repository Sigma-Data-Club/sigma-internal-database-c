import { Navigate, useParams } from "react-router-dom";

export default function EventStatsPage() {
  const { eventId } = useParams();

  if (!eventId) {
    return <Navigate to="/events" replace />;
  }

  return <Navigate to={`/events/${eventId}/manage?tab=stats`} replace />;
}