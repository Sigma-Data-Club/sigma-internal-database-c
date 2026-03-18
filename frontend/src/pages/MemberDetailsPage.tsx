import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import { useNavigate, useParams } from "react-router-dom";

import { getMember } from "../api/member";
import type { Member } from "../types/member";

export default function MemberDetailsPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMember() {
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
  }, [memberId]);

  const fullName = member
    ? `${member.first_name} ${member.last_name}`
    : "Member details";

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              {fullName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Detailed member profile
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<PeopleIcon />}
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

        {!loading && error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        {!loading && !error && member && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Box>
                  <Typography variant="h5">
                    {member.first_name} {member.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Member ID: {member.member_id}
                  </Typography>
                </Box>

                <Chip
                  label={member.is_active ? "Active" : "Inactive"}
                  color={member.is_active ? "success" : "default"}
                />
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Typography>
                  <strong>Email:</strong> {member.email}
                </Typography>

                <Typography>
                  <strong>Phone:</strong> {member.phone ?? "—"}
                </Typography>

                <Typography>
                  <strong>Academic program ID:</strong>{" "}
                  {member.academic_program_id ?? "—"}
                </Typography>

                <Typography>
                  <strong>Study year:</strong> {member.study_year ?? "—"}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}