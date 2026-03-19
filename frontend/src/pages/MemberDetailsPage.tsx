import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";

import { getMember } from "../api/member";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../auth/permissions";
import type { Member } from "../types/member";

export default function MemberDetailsPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canReadMemberDetails = hasPermission(user, "member.read");

  useEffect(() => {
    async function loadMember() {
      if (authLoading) {
        return;
      }

      if (!canReadMemberDetails) {
        setError("You do not have permission to view member details.");
        setLoading(false);
        return;
      }

      if (!memberId) {
        setError("Member ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getMember(memberId);
        setMember(data);
      } catch {
        setError("Failed to load member details.");
      } finally {
        setLoading(false);
      }
    }

    void loadMember();
  }, [memberId, authLoading, canReadMemberDetails]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Member details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Detailed member profile.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/members")}
          >
            Back to members
          </Button>
        </Stack>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && member && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="h5">
                {member.first_name} {member.last_name}
              </Typography>
              <Typography>
                <strong>ID:</strong> {member.member_id}
              </Typography>
              <Typography>
                <strong>Email:</strong> {member.email}
              </Typography>
              <Typography>
                <strong>Phone:</strong> {member.phone || "—"}
              </Typography>
              <Typography>
                <strong>Academic program ID:</strong> {member.academic_program_id ?? "—"}
              </Typography>
              <Typography>
                <strong>Study year:</strong> {member.study_year ?? "—"}
              </Typography>
              <Typography>
                <strong>Active:</strong> {member.is_active ? "Yes" : "No"}
              </Typography>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}