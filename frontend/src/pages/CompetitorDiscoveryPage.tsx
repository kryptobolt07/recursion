import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { channelStats, formatNumber } from "@/data/mockData";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { demoCreatorChannelId } from "@/lib/demo";
import { useAnalysisRefreshShortcut } from "@/hooks/useAnalysisRefreshShortcut";
import { AnalysisLoader } from "@/components/shared/AnalysisLoader";

interface CompetitorCard {
  id: string;
  name: string;
  handle: string;
  thumbnailUrl?: string;
  subscribers: number;
  avgViews: number;
  engagementRate: number;
  uploadFrequency: string;
  topNiche: string;
  similarityScore: number;
  audienceFitScore: number;
  discoveryReason: string;
  nicheMatchTags: string[];
}

export default function CompetitorDiscoveryPage() {
  const navigate = useNavigate();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const forceNextRefresh = useRef(false);
  const { data, isLoading, error } = useQuery<{ competitors: CompetitorCard[] }>({
    queryKey: ["competitors", demoCreatorChannelId, refreshVersion],
    queryFn: async () => {
      const forceSuffix = forceNextRefresh.current ? "?force=true" : "";
      forceNextRefresh.current = false;
      const res = await apiFetch(`/competitors/discover/${demoCreatorChannelId}${forceSuffix}`);
      if (!res.ok) throw new Error("Failed to discover competitors");
      return res.json();
    },
  });
  useAnalysisRefreshShortcut({
    label: "competitor discovery",
    onRefresh: () => {
      forceNextRefresh.current = true;
      setRefreshVersion((value) => value + 1);
    },
  });

  const competitors = data?.competitors || [];

  if (isLoading) {
    return (
      <AnalysisLoader
        className="min-h-[52vh]"
        eyebrow="Discovery Engine"
        title="Scouring YouTube for matching competitors"
        subtitle="The engine is querying public channels, checking keyword overlaps, comparing subscriber brackets, and scoring audience fit."
        steps={[
          "Executing TF-IDF topic queries",
          "Filtering candidate channels by size",
          "Loading engagement metadata & recent videos",
          "Computing similarity & audience fit scores",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Competitor Discovery</h1>
        <p className="text-sm text-muted-foreground mt-1">Real public-channel discovery filtered by topical overlap, reach, and estimated audience fit</p>
      </div>

      {error && (
        <div className="stat-card border border-destructive/30 bg-destructive/10">
          <p className="text-sm text-destructive">Could not load real competitor data.</p>
        </div>
      )}

      {/* Top competitors list */}
      <div className="stat-card">
        <h3 className="section-header">Discovered Competitors</h3>
        <div className="space-y-3">
          {competitors.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/app/competitors/${c.id}`)}
              className="flex items-center gap-4 p-3 rounded-lg bg-accent/30 hover:bg-accent/60 cursor-pointer transition-colors"
            >
              {c.thumbnailUrl ? (
                <img src={c.thumbnailUrl} alt={c.name} className="w-10 h-10 rounded-full shrink-0 object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{c.name[0]}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <span className="text-xs text-muted-foreground">{c.handle}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.discoveryReason}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {c.nicheMatchTags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">{tag}</span>
                  ))}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    Audience fit {Math.round(c.audienceFitScore)}%
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">{formatNumber(c.subscribers)}</p>
                <p className="text-[10px] text-muted-foreground">subscribers</p>
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${c.similarityScore}%` }} />
                  </div>
                  <span className="text-xs text-primary font-medium">{c.similarityScore}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary table */}
      <div className="stat-card overflow-x-auto">
        <h3 className="section-header">Summary Table</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 font-medium">Channel</th>
              <th className="pb-2 font-medium text-right">Subs</th>
              <th className="pb-2 font-medium text-right">Avg Views</th>
              <th className="pb-2 font-medium text-right">Eng. Rate</th>
              <th className="pb-2 font-medium text-right">Upload Freq</th>
              <th className="pb-2 font-medium text-right">Top Niche</th>
              <th className="pb-2 font-medium text-right">Audience Fit</th>
              <th className="pb-2 font-medium text-right">Similarity</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-primary/20 bg-primary/5">
              <td className="py-2 font-medium text-primary">You (TechForge)</td>
              <td className="text-right text-foreground">{formatNumber(channelStats.subscribers)}</td>
              <td className="text-right text-foreground">{formatNumber(channelStats.avgViews)}</td>
              <td className="text-right text-foreground">{channelStats.engagementRate}%</td>
              <td className="text-right text-muted-foreground">{channelStats.uploadFrequency}</td>
              <td className="text-right text-muted-foreground">Linux & OS</td>
              <td className="text-right text-primary">—</td>
              <td className="text-right text-primary">—</td>
            </tr>
            {competitors.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/app/competitors/${c.id}`)}
                className="border-b border-border/50 cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <td className="py-2 font-medium text-foreground">{c.name}</td>
                <td className="text-right text-foreground">{formatNumber(c.subscribers)}</td>
                <td className="text-right text-foreground">{formatNumber(c.avgViews)}</td>
                <td className="text-right text-foreground">{c.engagementRate}%</td>
                <td className="text-right text-muted-foreground">{c.uploadFrequency}</td>
                <td className="text-right text-muted-foreground">{c.topNiche}</td>
                <td className="text-right text-foreground">{Math.round(c.audienceFitScore)}%</td>
                <td className="text-right">
                  <span className="text-primary font-medium">{c.similarityScore}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
