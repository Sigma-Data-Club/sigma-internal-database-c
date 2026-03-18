import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import FolderIcon from "@mui/icons-material/Folder";
import EventIcon from "@mui/icons-material/Event";
import LoginIcon from "@mui/icons-material/Login";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Central entry point for the club management system.
          </Typography>
        </Box>

        {isLoading && (
          <Alert severity="info">
            Loading authentication state...
          </Alert>
        )}

        {!isLoading && !isAuthenticated && (
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<LoginIcon />}
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
            }
          >
            You are not signed in. Please log in to access protected sections.
          </Alert>
        )}

        {!isLoading && isAuthenticated && user && (
          <Card>
            <CardContent>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Box>
                  <Typography variant="h6">
                    Welcome, {user.first_name} {user.last_name}
                  </Typography>
                  <Typography color="text.secondary">
                    {user.email}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Member ID: {user.member_id}
                  </Typography>
                </Box>

                <Chip
                  label={user.is_active ? "Active member" : "Inactive member"}
                  color={user.is_active ? "success" : "default"}
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={2}>
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

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <FolderIcon />
                  <Typography variant="h6">Projects</Typography>
                </Stack>
                <Typography color="text.secondary">
                  View the projects section and prepare the interface for project endpoints.
                </Typography>
              </CardContent>
              <CardActions>
                <Button onClick={() => navigate("/projects")} variant="outlined">
                  Open projects
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <EventIcon />
                  <Typography variant="h6">Events</Typography>
                </Stack>
                <Typography color="text.secondary">
                  View the events section and prepare the interface for event endpoints.
                </Typography>
              </CardContent>
              <CardActions>
                <Button onClick={() => navigate("/events")} variant="outlined">
                  Open events
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}