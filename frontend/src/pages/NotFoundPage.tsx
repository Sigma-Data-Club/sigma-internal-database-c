import { Box, Button, Stack, Typography } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3} alignItems="flex-start">
        <Box>
          <Typography variant="h3" gutterBottom>
            404
          </Typography>
          <Typography variant="h5" gutterBottom>
            Page not found
          </Typography>
          <Typography color="text.secondary">
            The page you requested does not exist or is no longer available.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            Go back
          </Button>

          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate("/")}
          >
            Back to dashboard
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}