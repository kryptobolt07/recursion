import { Outlet, useLocation } from "react-router-dom";

import AppSidebar from "./AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const pageTitles: Array<{ title: string; match: (pathname: string) => boolean }> = [
  { title: "Overview", match: (pathname) => pathname === "/app" },
  { title: "Views Breakdown", match: (pathname) => pathname === "/app/views" },
  { title: "Content DNA", match: (pathname) => pathname === "/app/content-dna" },
  { title: "Cadence", match: (pathname) => pathname === "/app/cadence" },
  { title: "Audience", match: (pathname) => pathname === "/app/audience" },
  { title: "Competitor Discovery", match: (pathname) => pathname === "/app/competitors" },
  { title: "Landscape", match: (pathname) => pathname === "/app/competitors/landscape" },
  { title: "Competitor Detail", match: (pathname) => pathname.startsWith("/app/competitors/") },
  { title: "Strategy Report", match: (pathname) => pathname === "/app/strategy" },
  { title: "Video Ideas", match: (pathname) => pathname === "/app/strategy/ideas" },
  { title: "Title Optimizer", match: (pathname) => pathname === "/app/strategy/titles" },
  { title: "Thumbnails", match: (pathname) => pathname === "/app/strategy/thumbnails" },
];

function getPageTitle(pathname: string) {
  return pageTitles.find((item) => item.match(pathname))?.title ?? "Workspace";
}

export default function AppLayout() {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="-ml-1 h-9 w-9 rounded-lg border border-border/70 bg-background shadow-sm" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Workspace</p>
              <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">{pageTitle}</h1>
            </div>
          </div>

          <div className="hidden items-center rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground md:flex">
            Collapse with Ctrl/Cmd + B
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
