import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  Trophy,
  Wand2,
  LogOut,
  Moon,
  Sun,
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
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";

const navSections = [
  {
    label: "Channel Analysis",
    items: [
      { to: "/app", icon: BarChart3, label: "Overview" },
      { to: "/app/views", icon: Eye, label: "Views Breakdown" },
      { to: "/app/content-dna", icon: Target, label: "Content DNA" },
      { to: "/app/cadence", icon: Calendar, label: "Cadence" },
      { to: "/app/audience", icon: Activity, label: "Audience" },
      { to: "/app/ranking", icon: Trophy, label: "Video Ranking" },
    ],
  },
  {
    label: "Competitors",
    items: [
      { to: "/app/competitors", icon: Search, label: "Discovery" },
      { to: "/app/competitors/landscape", icon: TrendingUp, label: "Landscape" },
    ],
  },
  {
    label: "Strategy",
    items: [
      { to: "/app/strategy", icon: FileText, label: "Strategy Report" },
      { to: "/app/strategy/ideas", icon: Lightbulb, label: "Video Ideas" },
      { to: "/app/strategy/titles", icon: Wand2, label: "Title Optimizer" },
      { to: "/app/strategy/thumbnails", icon: Image, label: "Thumbnails" },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-3 p-3 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={toggleSidebar}
              className="h-auto min-h-14 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 p-3 hover:bg-sidebar-accent/70 group-data-[collapsible=icon]:min-h-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent"
              tooltip="Competitor Spy"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-data-[collapsible=icon]:hidden">
                <Eye className="size-4" />
              </div>
              <div className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm group-data-[collapsible=icon]:flex">
                <Eye className="size-4" />
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

      <SidebarContent className="px-2 py-3 group-data-[collapsible=icon]:px-1">
        {navSections.map((section) => (
          <SidebarGroup key={section.label} className="px-1 py-0">
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    item.to === "/app"
                      ? location.pathname === "/app"
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

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2 flex flex-col gap-2">
        <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/35 p-3 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar border border-sidebar-border/50 text-sidebar-accent-foreground shadow-sm group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg">
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

        <div className="flex flex-col gap-1 mt-1 group-data-[collapsible=icon]:items-center">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 w-full rounded-md p-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            <span className="group-data-[collapsible=icon]:hidden">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full rounded-md p-2 text-sm text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            title="Sign out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
          </button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
