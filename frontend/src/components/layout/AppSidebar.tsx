import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Calendar,
  Eye,
  FileText,
  Image,
  Lightbulb,
  Search,
  Target,
  TrendingUp,
  Wand2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const navSections = [
  {
    label: "Channel Analysis",
    items: [
      { to: "/", icon: BarChart3, label: "Overview" },
      { to: "/views", icon: Eye, label: "Views Breakdown" },
      { to: "/content-dna", icon: Target, label: "Content DNA" },
      { to: "/cadence", icon: Calendar, label: "Cadence" },
      { to: "/audience", icon: Activity, label: "Audience" },
    ],
  },
  {
    label: "Competitors",
    items: [
      { to: "/competitors", icon: Search, label: "Discovery" },
      { to: "/competitors/landscape", icon: TrendingUp, label: "Landscape" },
    ],
  },
  {
    label: "Strategy",
    items: [
      { to: "/strategy", icon: FileText, label: "Strategy Report" },
      { to: "/strategy/ideas", icon: Lightbulb, label: "Video Ideas" },
      { to: "/strategy/titles", icon: Wand2, label: "Title Optimizer" },
      { to: "/strategy/thumbnails", icon: Image, label: "Thumbnails" },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-3 px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-auto min-h-14 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 px-3 py-3 hover:bg-sidebar-accent/70"
              tooltip="Competitor Spy"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-data-[collapsible=icon]:hidden">
                <Eye className="size-4" />
              </div>
              <div className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-data-[collapsible=icon]:flex">
                <BarChart3 className="size-4" />
              </div>
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold text-sidebar-accent-foreground">Competitor Spy</span>
                <span className="truncate text-xs text-sidebar-foreground/70">Creator research workspace</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="rounded-xl border border-dashed border-sidebar-border/70 bg-sidebar/70 px-3 py-2 group-data-[collapsible=icon]:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/60">Mode</p>
          <p className="mt-1 text-sm font-medium text-sidebar-accent-foreground">Live market analysis</p>
          <p className="text-xs leading-5 text-sidebar-foreground/75">
            Creator metrics stay seeded. Competitor signals come from public data.
          </p>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2 py-3">
        {navSections.map((section) => (
          <SidebarGroup key={section.label} className="px-1 py-0">
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/55">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    item.to === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.to);

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <NavLink to={item.to} onClick={handleNavigate}>
                          <item.icon />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="px-3 py-3">
        <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/35 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar text-sidebar-accent-foreground shadow-sm">
              <BarChart3 className="size-4" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">TechForge</p>
              <p className="truncate text-xs text-sidebar-foreground/70">482K subscribers</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 group-data-[collapsible=icon]:hidden">
            <div className="rounded-lg bg-sidebar/80 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/55">Catalog</p>
              <p className="mt-1 text-sm font-semibold text-sidebar-accent-foreground">387 videos</p>
            </div>
            <div className="rounded-lg bg-sidebar/80 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/55">Focus</p>
              <p className="mt-1 text-sm font-semibold text-sidebar-accent-foreground">Dev + AI</p>
            </div>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
