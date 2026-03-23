import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Flame, Leaf, Lightbulb, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

import { AnalysisLoader } from "@/components/shared/AnalysisLoader";
import { apiFetch } from "@/lib/api";
import { demoCreatorChannelId } from "@/lib/demo";
import { useAnalysisRefreshShortcut } from "@/hooks/useAnalysisRefreshShortcut";
import { Button } from "@/components/ui/button";

interface VideoIdea {
  id: string;
  title: string;
  niche: string;
  subniche: string;
  competition: string;
  urgency: string;
  rationale: string;
  suggestedLength: string;
}

interface SimulationData {
  trajectory: { day: number; conservative: number; base: number; optimistic: number }[];
  day1: number;
  day7: number;
  day30: number;
  confidence: string;
  sensitivity: string[];
}

function IdeaSimulation({ idea }: { idea: VideoIdea }) {
  const [isOpen, setIsOpen] = useState(false);

  const simQuery = useQuery<SimulationData>({
    queryKey: ["simulator", idea.title, idea.niche],
    queryFn: async () => {
      const res = await apiFetch("/simulator/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: idea.title,
          niche: idea.niche,
          targetLengthMinutes: 12,
          channelId: demoCreatorChannelId,
        }),
      });
      if (!res.ok) throw new Error("Failed to load simulation");
      return res.json();
    },
    enabled: isOpen,
  });

  return (
    <div className="mt-4 border-t border-border/50 pt-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs flex items-center gap-2"
      >
        <Activity className="h-3 w-3" />
        {isOpen ? "Hide Simulation" : "Simulate Performance"}
      </Button>

      {isOpen && (
        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
          {simQuery.isLoading ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              Running simulation engine...
            </div>
          ) : simQuery.error ? (
            <div className="text-sm text-destructive">Failed to load simulation data.</div>
          ) : simQuery.data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-64 bg-card border border-border rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simQuery.data.trajectory} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="day" tick={{ fill: "hsl(0,0%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(0,0%,12%)", border: "1px solid hsl(0,0%,18%)", borderRadius: 8, fontSize: 12 }} 
                      formatter={(val: number) => [val.toLocaleString(), "Views"]}
                    />
                    <Line type="monotone" dataKey="optimistic" stroke="hsl(142,70%,45%)" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Optimistic" />
                    <Line type="monotone" dataKey="base" stroke="hsl(210,90%,55%)" strokeWidth={2} dot={false} name="Base Estimate" />
                    <Line type="monotone" dataKey="conservative" stroke="hsl(0,90%,60%)" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Conservative" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Projections</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-accent/40 rounded p-2 text-center">
                      <p className="text-lg font-bold text-foreground">{simQuery.data.day1 > 1000 ? `${(simQuery.data.day1/1000).toFixed(1)}k` : simQuery.data.day1}</p>
                      <p className="text-[10px] text-muted-foreground">Day 1</p>
                    </div>
                    <div className="bg-accent/40 rounded p-2 text-center">
                      <p className="text-lg font-bold text-foreground">{simQuery.data.day7 > 1000 ? `${(simQuery.data.day7/1000).toFixed(1)}k` : simQuery.data.day7}</p>
                      <p className="text-[10px] text-muted-foreground">Day 7</p>
                    </div>
                    <div className="bg-accent/40 rounded p-2 text-center col-span-2">
                      <p className="text-lg font-bold text-primary">{simQuery.data.day30 > 1000 ? `${(simQuery.data.day30/1000).toFixed(1)}k` : simQuery.data.day30}</p>
                      <p className="text-[10px] text-muted-foreground">Day 30 (Long Tail)</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Sensitivity</p>
                  <ul className="text-[11px] text-foreground space-y-1 list-disc list-inside pl-3">
                    {simQuery.data.sensitivity.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-muted-foreground mt-2">Confidence: <span className="font-medium text-foreground">{simQuery.data.confidence}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VideoIdeasPage() {
  const [filter, setFilter] = useState("all");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const forceNextRefresh = useRef(false);

  const ideasQuery = useQuery<{ ideas: VideoIdea[] }>({
    queryKey: ["video-ideas", demoCreatorChannelId, refreshVersion],
    queryFn: async () => {
      const forceSuffix = forceNextRefresh.current ? "?force=true" : "";
      forceNextRefresh.current = false;
      const res = await apiFetch(`/strategy/ideas/${demoCreatorChannelId}${forceSuffix}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to load video ideas");
      return res.json();
    },
  });
  useAnalysisRefreshShortcut({
    label: "video ideas",
    onRefresh: () => {
      forceNextRefresh.current = true;
      setRefreshVersion((value) => value + 1);
    },
  });

  const ideas = ideasQuery.data?.ideas || [];
  const filtered = filter === "all" ? ideas : ideas.filter((idea) => idea.urgency.toLowerCase() === filter);

  const urgencyIcon = (urgency: string) => {
    if (urgency === "Timely") return <Flame className="h-3 w-3 text-destructive" />;
    if (urgency === "Trending") return <Clock className="h-3 w-3 text-warning" />;
    return <Leaf className="h-3 w-3 text-success" />;
  };

  const competitionColor = (competition: string) =>
    competition === "low" ? "text-success" : competition === "medium" ? "text-warning" : "text-destructive";

  if (ideasQuery.isLoading) {
    return (
      <AnalysisLoader
        className="min-h-[52vh]"
        eyebrow="Idea Engine"
        title="Turning audience demand into usable video concepts"
        subtitle="The engine is clustering public comment asks, outlier videos, and competitor gaps to produce ideas you can ship."
        steps={[
          "Pulling request phrases from comments",
          "Matching them to real outperforming videos",
          "Ranking urgency and competition",
          "Formatting concepts for your channel mix",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Video Ideas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real ideas synthesized from audience asks, competitor outliers, and market gaps.</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {["all", "timely", "trending", "evergreen"].map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-md px-3 py-1.5 text-xs capitalize transition-colors ${
                filter === value ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {ideasQuery.error && (
        <div className="stat-card border border-destructive/30 bg-destructive/10">
          <p className="text-sm text-destructive">Could not load real video ideas.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((idea) => (
          <div key={idea.id} className="stat-card">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Lightbulb className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">{idea.title}</h3>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">{idea.niche}</span>
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">{idea.subniche}</span>
                  <span className={`rounded bg-accent px-1.5 py-0.5 text-[10px] ${competitionColor(idea.competition)}`}>
                    {idea.competition} competition
                  </span>
                  <span className="flex items-center gap-0.5 rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {urgencyIcon(idea.urgency)} {idea.urgency}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{idea.rationale}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Suggested length: <span className="text-foreground">{idea.suggestedLength}</span>
                </p>
                <IdeaSimulation idea={idea} />
              </div>
            </div>
          </div>
        ))}

        {!filtered.length && !ideasQuery.error && (
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">No ideas matched this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
