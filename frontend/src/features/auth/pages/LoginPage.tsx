import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await login({ email, password });
      navigate("/", { replace: true });
    } catch {
      setFormError("Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, width: "100%", maxWidth: 420 }}>
        <Typography variant="h4" gutterBottom>
          Club Login
        </Typography>

        <Typography variant="body2" sx={{ mb: 3 }}>
          Sign in to access the internal club panel.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
            />

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
            />

            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}