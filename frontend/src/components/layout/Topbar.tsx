import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";

import { useAuth } from "../../context/AuthContext";
import { layoutText } from "./layoutText";

const drawerWidth = 240;

type TopbarProps = {
  title: string;
};

export default function Topbar({ title }: TopbarProps) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: `calc(100% - ${drawerWidth}px)`,
        ml: `${drawerWidth}px`,
      }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
          {title}
        </Typography>

        <Box>
          <Button color="inherit" onClick={handleLogout}>
            {layoutText.topbar.logout}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}