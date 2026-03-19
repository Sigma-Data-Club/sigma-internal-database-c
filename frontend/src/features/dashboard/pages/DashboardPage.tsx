import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import FolderIcon from "@mui/icons-material/Folder";
import PeopleIcon from "@mui/icons-material/People";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { hasPermission } from "../../../auth/permissions";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canReadMembers = hasPermission(user, "member.read");
  const canReadProjects = hasPermission(user, "project.read");
  const canReadEvents = hasPermission(user, "event.read");

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "Member";

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome, {displayName}.
          </Typography>
        </Box>

        {!canReadMembers && !canReadProjects && !canReadEvents && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                No accessible sections
              </Typography>
              <Typography color="text.secondary">
                Your account is signed in, but no dashboard sections are available for your current permissions.
              </Typography>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={2}>
          {canReadMembers && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <PeopleIcon />
                    <Typography variant="h6">Members</Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    Browse club members, search by name or email, and open detailed profiles.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button onClick={() => navigate("/members")} variant="contained">
                    Open members
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )}

          {canReadProjects && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <FolderIcon />
                    <Typography variant="h6">Projects</Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    Browse projects, open project details, and access project management tools.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button onClick={() => navigate("/projects")} variant="outlined">
                    Open projects
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )}

          {canReadEvents && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <EventIcon />
                    <Typography variant="h6">Events</Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    Browse events, applications, attendance, and event analytics.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button onClick={() => navigate("/events")} variant="outlined">
                    Open events
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )}
        </Grid>
      </Stack>
    </Box>
  );
}