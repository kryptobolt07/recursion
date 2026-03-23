import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { demoCreatorChannelId } from "@/lib/demo";

interface MixRow {
  name: string;
  share: number;
}

interface Recommendation {
  niche: string;
  change: string;
  reason: string;
}

interface RoadmapPhase {
  title: string;
  actions: string[];
}

interface StrategyReport {
  summary: string;
  currentMix: MixRow[];
  suggestedMix: MixRow[];
  nicheRecommendations: Recommendation[];
  roadmap: {
    phase1: RoadmapPhase;
    phase2: RoadmapPhase;
    phase3: RoadmapPhase;
  };
  supportingSignals: {
    titlePlays: string[];
    thumbnailPlays: string[];
    viewerAsks: string[];
    marketLeaders: { name: string; topNiche: string; avgViews: number; audienceFitScore: number }[];
  };
}

interface PostingStrategy {
  bestDays: string[];
  bestHours: string[];
  weeklyCalendar: { day: string; time: string }[];
  recommendedCadence: string;
  shortsRecommendation: string;
}

const mixColors = ["bg-red-600", "bg-blue-600", "bg-green-600", "bg-amber-600", "bg-fuchsia-600"];

export default function StrategyReportPage() {
  const reportQuery = useQuery<StrategyReport>({
    queryKey: ["strategy-report", demoCreatorChannelId],
    queryFn: async () => {
      const res = await apiFetch(`/strategy/report/${demoCreatorChannelId}`);
      if (!res.ok) throw new Error("Failed to load strategy report");
      return res.json();
    },
  });

  const postingQuery = useQuery<PostingStrategy>({
    queryKey: ["posting-strategy", demoCreatorChannelId],
    queryFn: async () => {
      const res = await apiFetch(`/strategy/posting/${demoCreatorChannelId}`);
      if (!res.ok) throw new Error("Failed to load posting strategy");
      return res.json();
    },
  });

  if (reportQuery.isLoading || postingQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (reportQuery.error || postingQuery.error || !reportQuery.data || !postingQuery.data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Strategy Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real market recommendations built from discovered competitors.</p>
        </div>
        <div className="stat-card border border-destructive/30 bg-destructive/10">
          <p className="text-sm text-destructive">Could not load the strategy analysis.</p>
        </div>
      </div>
    );
  }

  const report = reportQuery.data;
  const posting = postingQuery.data;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Strategy Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real analysis from public competitor performance, audience demand, and posting patterns.</p>
      </div>

      <div className="stat-card border border-primary/20 bg-primary/5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Market Read</p>
        <p className="mt-2 text-sm leading-6 text-foreground">{report.summary}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="stat-card">
          <h3 className="section-header">Niche Mix: Current vs Suggested</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">CURRENT</p>
              <div className="flex h-8 overflow-hidden rounded-lg">
                {report.currentMix.map((row, index) => (
                  <div
                    key={row.name}
                    className={`${mixColors[index % mixColors.length]} flex items-center justify-center`}
                    style={{ width: `${row.share}%` }}
                  >
                    {row.share > 9 && <span className="text-[10px] text-primary-foreground">{row.share}%</span>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">SUGGESTED</p>
              <div className="flex h-8 overflow-hidden rounded-lg">
                {report.suggestedMix.map((row, index) => (
                  <div
                    key={row.name}
                    className={`${mixColors[index % mixColors.length]} flex items-center justify-center`}
                    style={{ width: `${row.share}%` }}
                  >
                    {row.share > 9 && <span className="text-[10px] text-primary-foreground">{row.share}%</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {report.nicheRecommendations.map((item) => (
              <div key={item.niche} className="rounded-lg border border-border/60 bg-accent/20 px-3 py-3">
                <div className="flex items-start gap-3">
                  <span className={`w-12 shrink-0 text-sm font-semibold ${item.change.startsWith("+") ? "text-success" : "text-destructive"}`}>
                    {item.change}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.niche}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <h3 className="section-header">Posting Strategy</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-accent/30 p-3">
              <p className="text-xs text-muted-foreground">Best Days</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{posting.bestDays.join(" • ") || "n/a"}</p>
            </div>
            <div className="rounded-lg bg-accent/30 p-3">
              <p className="text-xs text-muted-foreground">Best Hours</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{posting.bestHours.join(" • ") || "n/a"}</p>
            </div>
            <div className="rounded-lg bg-accent/30 p-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Recommended Cadence</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{posting.recommendedCadence}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{posting.shortsRecommendation}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs text-muted-foreground">Weekly Calendar</p>
            <div className="grid gap-2">
              {posting.weeklyCalendar.map((slot) => (
                <div key={`${slot.day}-${slot.time}`} className="flex items-center justify-between rounded-lg bg-accent/20 px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">{slot.day}</span>
                  <span className="text-muted-foreground">{slot.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {[report.roadmap.phase1, report.roadmap.phase2, report.roadmap.phase3].map((phase) => (
        <div key={phase.title} className="stat-card">
          <h3 className="section-header">{phase.title}</h3>
          <div className="space-y-3">
            {phase.actions.map((action, index) => (
              <div key={action} className="flex items-start gap-3 rounded-lg bg-accent/20 px-3 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-foreground">{action}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="stat-card">
          <h3 className="section-header">Title Plays</h3>
          <div className="space-y-2">
            {report.supportingSignals.titlePlays.map((item) => (
              <div key={item} className="rounded-lg bg-accent/20 px-3 py-3 text-sm text-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <h3 className="section-header">Thumbnail Plays</h3>
          <div className="space-y-2">
            {report.supportingSignals.thumbnailPlays.map((item) => (
              <div key={item} className="rounded-lg bg-accent/20 px-3 py-3 text-sm text-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <h3 className="section-header">Audience Demand</h3>
          <div className="flex flex-wrap gap-2">
            {report.supportingSignals.viewerAsks.map((item) => (
              <span key={item} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-card overflow-x-auto">
        <h3 className="section-header">Market Leaders</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 font-medium">Channel</th>
              <th className="pb-2 font-medium text-right">Top Niche</th>
              <th className="pb-2 font-medium text-right">Avg Views</th>
              <th className="pb-2 font-medium text-right">Audience Fit</th>
            </tr>
          </thead>
          <tbody>
            {report.supportingSignals.marketLeaders.map((leader) => (
              <tr key={leader.name} className="border-b border-border/50 last:border-0">
                <td className="py-2 font-medium text-foreground">{leader.name}</td>
                <td className="text-right text-muted-foreground">{leader.topNiche}</td>
                <td className="text-right text-foreground">{leader.avgViews.toLocaleString()}</td>
                <td className="text-right text-primary">{Math.round(leader.audienceFitScore)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
