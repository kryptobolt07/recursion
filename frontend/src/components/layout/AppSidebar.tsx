import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Search,
  Lightbulb,
  Eye,
  Target,
  TrendingUp,
  FileText,
  Wand2,
  Image,
  Calendar,
  Activity,
} from "lucide-react";

const navSections = [
  {
    label: "CHANNEL ANALYSIS",
    items: [
      { to: "/", icon: BarChart3, label: "Overview" },
      { to: "/views", icon: Eye, label: "Views Breakdown" },
      { to: "/content-dna", icon: Target, label: "Content DNA" },
      { to: "/cadence", icon: Calendar, label: "Cadence" },
      { to: "/audience", icon: Activity, label: "Audience" },
    ],
  },
  {
    label: "COMPETITORS",
    items: [
      { to: "/competitors", icon: Search, label: "Discovery" },
      { to: "/competitors/landscape", icon: TrendingUp, label: "Landscape" },
    ],
  },
  {
    label: "STRATEGY",
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

  return (
    <aside className="w-56 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Eye className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-accent-foreground">Competitor Spy</h1>
            <p className="text-[10px] text-sidebar-foreground">YouTube Analytics</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 py-1 text-[10px] font-semibold tracking-widest text-sidebar-foreground uppercase">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-3">
          <p className="text-xs font-medium text-sidebar-accent-foreground">TechForge</p>
          <p className="text-[10px] text-sidebar-foreground">482K subscribers</p>
          <p className="text-[10px] text-sidebar-foreground">387 videos analyzed</p>
        </div>
      </div>
    </aside>
  );
}
