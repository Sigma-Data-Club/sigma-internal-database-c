import { Navigate, createBrowserRouter, useParams } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import RequirePermissionRoute from "../components/common/RequirePermissionRoute";

import LoginPage from "../features/auth/pages/LoginPage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import SettingsPage from "../features/settings/pages/SettingsPage";

import MembersPage from "../features/members/pages/MembersPage";
import MemberDetailsPage from "../features/members/pages/MemberDetailsPage";

import ProjectsPage from "../features/projects/pages/ProjectsPage";
import ProjectManagementPage from "../features/projects/pages/ProjectManagementPage";
import ProjectAnalyticsPage from "../features/projects/pages/ProjectAnalyticsPage";

import EventsPage from "../features/events/pages/EventsPage";
import EventCreatePage from "../features/events/pages/EventCreatePage";
import EventEditPage from "../features/events/pages/EventEditPage";
import EventAnalyticsPage from "../features/events/pages/EventAnalyticsPage";
import EventManagementPage from "../features/events/pages/EventManagementPage";

import NotFoundPage from "../pages/NotFoundPage";

function EventOverviewRedirect() {
  const { eventId } = useParams();

  if (!eventId) {
    return <Navigate to="/events" replace />;
  }

  return <Navigate to={`/events/${eventId}/manage?tab=overview`} replace />;
}

function ProjectOverviewRedirect() {
  const { projectId } = useParams();

  if (!projectId) {
    return <Navigate to="/projects" replace />;
  }

  return <Navigate to={`/projects/${projectId}/manage?tab=overview`} replace />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },

      {
        path: "settings",
        element: <SettingsPage />,
      },

      {
        path: "members",
        element: (
          <RequirePermissionRoute permissions={["member.read"]}>
            <MembersPage />
          </RequirePermissionRoute>
        ),
      },
      {
        path: "members/:memberId",
        element: (
          <RequirePermissionRoute permissions={["member.read"]}>
            <MemberDetailsPage />
          </RequirePermissionRoute>
        ),
      },

      {
        path: "projects",
        element: (
          <RequirePermissionRoute permissions={["project.read"]}>
            <ProjectsPage />
          </RequirePermissionRoute>
        ),
      },
      {
        path: "projects/:projectId",
        element: (
          <RequirePermissionRoute permissions={["project.read"]}>
            <ProjectOverviewRedirect />
          </RequirePermissionRoute>
        ),
      },
      {
        path: "projects/:projectId/manage",
        element: (
          <RequirePermissionRoute permissions={["project.read"]}>
            <ProjectManagementPage />
          </RequirePermissionRoute>
        ),
      },
      {
        path: "projects/analytics",
        element: (
          <RequirePermissionRoute permissions={["project.stats.read"]}>
            <ProjectAnalyticsPage />
          </RequirePermissionRoute>
        ),
      },

      {
        path: "events",
        element: (
          <RequirePermissionRoute permissions={["event.read"]}>
            <EventsPage />
          </RequirePermissionRoute>
        ),
      },
      {
        path: "events/new",
        element: (
          <RequirePermissionRoute permissions={["event.create"]}>
            <EventCreatePage />
          </RequirePermissionRoute>
        ),
      },
      {
        path: "events/analytics",
        element: (
          <RequirePermissionRoute permissions={["event.stats.read"]}>
            <EventAnalyticsPage />
          </RequirePermissionRoute>
        ),
      },
      {
        path: "events/:eventId",
        element: (
          <RequirePermissionRoute permissions={["event.read"]}>
            <EventOverviewRedirect />
          </RequirePermissionRoute>
        ),
      },
      {
        path: "events/:eventId/edit",
        element: (
          <RequirePermissionRoute permissions={["event.update"]}>
            <EventEditPage />
          </RequirePermissionRoute>
        ),
      },
      {
        path: "events/:eventId/manage",
        element: (
          <RequirePermissionRoute permissions={["event.read"]}>
            <EventManagementPage />
          </RequirePermissionRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);