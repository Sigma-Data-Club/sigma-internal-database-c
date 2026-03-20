import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import FolderIcon from "@mui/icons-material/Folder";
import EventIcon from "@mui/icons-material/Event";
import SettingsIcon from "@mui/icons-material/Settings";
import { Link as RouterLink, useLocation } from "react-router-dom";

import { layoutText } from "./layoutText";

const drawerWidth = 240;

const navItems = [
  { label: layoutText.sidebar.dashboard, path: "/", icon: <DashboardIcon /> },
  { label: layoutText.sidebar.members, path: "/members", icon: <GroupIcon /> },
  { label: layoutText.sidebar.projects, path: "/projects", icon: <FolderIcon /> },
  { label: layoutText.sidebar.events, path: "/events", icon: <EventIcon /> },
  { label: layoutText.sidebar.settings, path: "/settings", icon: <SettingsIcon /> },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar />
      <List>
        {navItems.map((item) => {
          const selected =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={selected}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}