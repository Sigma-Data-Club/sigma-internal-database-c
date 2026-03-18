import { createBrowserRouter } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";

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
        element: <MembersPage />,
      },
      {
        path: "members/:memberId",
        element: <MemberDetailsPage />,
      },

      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "projects/:projectId",
        element: <ProjectDetailsPage />,
      },

      {
        path: "events",
        element: <EventsPage />,
      },
      {
        path: "events/new",
        element: <EventCreatePage />,
      },
      {
        path: "events/:eventId",
        element: <EventDetailsPage />,
      },
      {
        path: "events/:eventId/edit",
        element: <EventEditPage />,
      },
      {
        path: "events/:eventId/applications",
        element: <EventApplicationsPage />,
      },
      {
        path: "events/:eventId/attendance",
        element: <EventAttendancePage />,
      },
      {
        path: "events/:eventId/stats",
        element: <EventStatsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);