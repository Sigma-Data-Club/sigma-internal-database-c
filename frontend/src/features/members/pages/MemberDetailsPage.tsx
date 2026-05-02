import { Navigate, useParams } from "react-router-dom";

export default function MemberDetailsPage() {
  const { memberId } = useParams();

  if (!memberId) {
    return <Navigate to="/members" replace />;
  }

  return <Navigate to={`/members/${memberId}/manage?tab=overview`} replace />;
}