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
import { dashboardText } from "../utils/dashboardStrings";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canReadMembers = hasPermission(user, "member.read");
  const canReadProjects = hasPermission(user, "project.read");
  const canReadEvents = hasPermission(user, "event.read");

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    dashboardText.fallbackMember;

  const sectionButtonSx = {
    mx: 1,
    mb: 1,
    textTransform: "none",
    fontWeight: 600,
    borderRadius: 2,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {dashboardText.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {dashboardText.welcome(displayName)}
          </Typography>
        </Box>

        {!canReadMembers && !canReadProjects && !canReadEvents && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {dashboardText.noAccessibleSectionsTitle}
              </Typography>
              <Typography color="text.secondary">
                {dashboardText.noAccessibleSectionsDescription}
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
                    <Typography variant="h6">{dashboardText.members.title}</Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    {dashboardText.members.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    onClick={() => navigate("/members")}
                    variant="contained"
                    sx={sectionButtonSx}
                  >
                    {dashboardText.members.button}
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
                    <Typography variant="h6">{dashboardText.projects.title}</Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    {dashboardText.projects.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    onClick={() => navigate("/projects")}
                    variant="contained"
                    sx={sectionButtonSx}
                  >
                    {dashboardText.projects.button}
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
                    <Typography variant="h6">{dashboardText.events.title}</Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    {dashboardText.events.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    onClick={() => navigate("/events")}
                    variant="contained"
                    sx={sectionButtonSx}
                  >
                    {dashboardText.events.button}
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