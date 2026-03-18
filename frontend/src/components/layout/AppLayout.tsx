import { Box, Toolbar } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function getPageTitle(pathname: string): string {
  if (pathname === "/" || pathname === "/dashboard") {
    return "Dashboard";
  }

  if (pathname.startsWith("/members")) {
    return "Members";
  }

  if (pathname.startsWith("/projects")) {
    return "Projects";
  }

  if (pathname.startsWith("/events")) {
    return "Events";
  }

  return "Club Panel";
}

export default function AppLayout() {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <Box sx={{ display: "flex" }}>
      <Topbar title={title} />
      <Sidebar />

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}