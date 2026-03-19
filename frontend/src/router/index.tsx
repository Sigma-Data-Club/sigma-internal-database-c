import { createBrowserRouter } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import RequirePermissionRoute from "../components/common/RequirePermissionRoute";

import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";

import MembersPage from "../pages/MembersPage";
import MemberDetailsPage from "../pages/MemberDetailsPage";

import ProjectsPage from "../pages/ProjectsPage";
import ProjectDetailsPage from "../pages/ProjectDetailsPage";

import EventsPage from "../pages/EventsPage";
import EventCreatePage from "../pages/EventCreatePage";
import EventDetailsPage from "../pages/EventDetailsPage";
import EventEditPage from "../pages/EventEditPage";
import EventApplicationsPage from "../pages/EventApplicationsPage";
import EventAttendancePage from "../pages/EventAttendancePage";
import EventStatsPage from "../pages/EventStatsPage";

import NotFoundPage from "../pages/NotFoundPage";

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
            <ProjectDetailsPage />
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
        path: "events/:eventId",
        element: (
          <RequirePermissionRoute permissions={["event.read"]}>
            <EventDetailsPage />
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
        path: "events/:eventId/applications",
        element: (
          <RequirePermissionRoute permissions={["event.decide"]}>
            <EventApplicationsPage />
          </RequirePermissionRoute>
        ),
      },
      {
        path: "events/:eventId/attendance",
        element: (
          <RequirePermissionRoute permissions={["event.attendance", "event.decide"]}>
            <EventAttendancePage />
          </RequirePermissionRoute>
        ),
      },
      {
        path: "events/:eventId/stats",
        element: (
          <RequirePermissionRoute permissions={["event.stats.read"]}>
            <EventStatsPage />
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