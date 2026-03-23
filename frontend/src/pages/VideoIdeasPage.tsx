import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Flame, Leaf, Lightbulb, Loader2 } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { demoCreatorChannelId } from "@/lib/demo";

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

export default function VideoIdeasPage() {
  const [filter, setFilter] = useState("all");

  const ideasQuery = useQuery<{ ideas: VideoIdea[] }>({
    queryKey: ["video-ideas", demoCreatorChannelId],
    queryFn: async () => {
      const res = await apiFetch(`/strategy/ideas/${demoCreatorChannelId}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to load video ideas");
      return res.json();
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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
