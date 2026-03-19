import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { listMembers } from "../../../api/member";
import type { Member } from "../../../types/member";

export default function MembersPage() {
  const navigate = useNavigate();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await listMembers();
        setMembers(data.items);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;

          if (status === 401) {
            setError("Session expired. Please sign in again.");
          } else if (status === 403) {
            setError("You do not have permission to view members.");
          } else {
            setError("Failed to load members.");
          }
        } else {
          setError("Unexpected error.");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return members;
    }

    return members.filter((member) => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
      const reversedFullName =
        `${member.last_name} ${member.first_name}`.toLowerCase();
      const email = member.email.toLowerCase();
      const phone = (member.phone ?? "").toLowerCase();

      return (
        fullName.includes(normalized) ||
        reversedFullName.includes(normalized) ||
        email.includes(normalized) ||
        phone.includes(normalized) ||
        String(member.member_id).includes(normalized)
      );
    });
  }, [members, search]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Members
      </Typography>

      <TextField
        label="Search members"
        placeholder="Search by name, email, phone or ID"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />

      {loading && (
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <CircularProgress size={24} />
          <Typography>Loading members...</Typography>
        </Box>
      )}

      {!loading && error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Paper>
          {filteredMembers.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography>
                {search.trim()
                  ? "No members match your search."
                  : "No members found."}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredMembers.map((member) => (
                <ListItemButton
                  key={member.member_id}
                  divider
                  onClick={() => navigate(`/members/${member.member_id}`)}
                >
                  <ListItemText
                    primary={`${member.first_name} ${member.last_name}`}
                    secondary={member.email}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Paper>
      )}
    </Box>
  );
}