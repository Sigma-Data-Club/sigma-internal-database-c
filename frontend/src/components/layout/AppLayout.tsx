import { Box, Toolbar } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { layoutText } from "./layoutText";

function getPageTitle(pathname: string): string {
  if (pathname === "/" || pathname === "/dashboard") {
    return layoutText.pageTitles.dashboard;
  }

  if (pathname.startsWith("/members")) {
    return layoutText.pageTitles.members;
  }

  if (pathname.startsWith("/projects")) {
    return layoutText.pageTitles.projects;
  }

  if (pathname.startsWith("/events")) {
    return layoutText.pageTitles.events;
  }

  if (pathname.startsWith("/settings")) {
    return layoutText.pageTitles.settings;
  }

  return layoutText.pageTitles.fallback;
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