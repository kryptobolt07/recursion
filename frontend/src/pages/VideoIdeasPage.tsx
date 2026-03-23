import { useState } from "react";
import { videoIdeas, formatNumber } from "@/data/mockData";
import { Lightbulb, Clock, Flame, Leaf } from "lucide-react";

export default function VideoIdeasPage() {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? videoIdeas : videoIdeas.filter((v) => v.urgency.toLowerCase() === filter);

  const urgencyIcon = (u: string) => {
    if (u === "Timely") return <Flame className="w-3 h-3 text-destructive" />;
    if (u === "Trending") return <Clock className="w-3 h-3 text-warning" />;
    return <Leaf className="w-3 h-3 text-success" />;
  };

  const compColor = (c: string) =>
    c === "low" ? "text-success" : c === "medium" ? "text-warning" : "text-destructive";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Video Ideas</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-generated ideas based on trends, gaps, and audience demand</p>
        </div>
        <div className="flex gap-1">
          {["all", "timely", "trending", "evergreen"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md capitalize transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((idea) => (
          <div key={idea.id} className="stat-card">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">{idea.title}</h3>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">{idea.niche}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">{idea.subniche}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded bg-accent ${compColor(idea.competition)}`}>
                    {idea.competition} competition
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
                    {urgencyIcon(idea.urgency)} {idea.urgency}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{idea.rationale}</p>
                <p className="text-xs text-muted-foreground mt-1">Suggested length: <span className="text-foreground">{idea.suggestedLength}</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
