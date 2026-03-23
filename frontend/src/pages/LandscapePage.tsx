import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { channelStats, formatNumber } from "@/data/mockData";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { demoCreatorChannelId } from "@/lib/demo";
import { useAnalysisRefreshShortcut } from "@/hooks/useAnalysisRefreshShortcut";
import { AnalysisLoader } from "@/components/shared/AnalysisLoader";

interface CompetitorCard {
  id: string;
  name: string;
  subscribers: number;
  engagementRate: number;
}

export default function LandscapePage() {
  const navigate = useNavigate();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const forceNextRefresh = useRef(false);
  const { data, isLoading, error } = useQuery<{ competitors: CompetitorCard[] }>({
    queryKey: ["competitor_landscape", demoCreatorChannelId, refreshVersion],
    queryFn: async () => {
      const forceSuffix = forceNextRefresh.current ? "?force=true" : "";
      forceNextRefresh.current = false;
      const res = await apiFetch(`/competitors/landscape/${demoCreatorChannelId}${forceSuffix}`);
      if (!res.ok) throw new Error("Failed to load landscape");
      return res.json();
    },
  });
  useAnalysisRefreshShortcut({
    label: "landscape analysis",
    onRefresh: () => {
      forceNextRefresh.current = true;
      setRefreshVersion((value) => value + 1);
    },
  });

  const competitors = data?.competitors || [];

  const scatterData = [
    { name: "You (TechForge)", subs: channelStats.subscribers, engagement: channelStats.engagementRate, isYou: true, id: "you" },
    ...competitors.map((c) => ({ name: c.name, subs: c.subscribers, engagement: c.engagementRate, isYou: false, id: c.id })),
  ];

  const midSubs = 500000;
  const midEng = 6;

  const getQuadrant = (subs: number, eng: number) => {
    if (subs >= midSubs && eng >= midEng) return "Dominant";
    if (subs >= midSubs && eng < midEng) return "Sleeping Giant";
    if (subs < midSubs && eng >= midEng) return "Rising Star";
    return "Fringe";
  };

  if (isLoading) {
    return (
      <AnalysisLoader
        className="min-h-[52vh]"
        eyebrow="Landscape Analysis"
        title="Mapping the competitive landscape"
        subtitle="The engine is plotting your channel against discovered competitors to find market positioning gaps."
        steps={[
          "Gathering competitor subscriber counts",
          "Calculating channel-wide engagement rates",
          "Plotting subscriber-vs-engagement quadrants",
          "Identifying 'Sleeping Giants' and 'Rising Stars'",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Competitive Landscape</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover your market positioning based on subscriber count vs. engagement rate.</p>
      </div>

      {error && (
        <div className="stat-card border border-destructive/30 bg-destructive/10">
          <p className="text-sm text-destructive">Could not load real competitor landscape.</p>
        </div>
      )}

      {/* Explanation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card bg-primary/5 border border-primary/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">Dominant</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">High subs, high engagement. The market leaders. Study their content formulas closely.</p>
        </div>
        <div className="stat-card bg-accent/30 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">Rising Stars</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">Low subs, high engagement. Fast growers. Watch them for emerging trends and formats.</p>
        </div>
        <div className="stat-card bg-accent/30 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">Sleeping Giants</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">High subs, low engagement. Large legacy audiences but declining momentum.</p>
        </div>
        <div className="stat-card bg-accent/30 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">Fringe</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">Low subs, low engagement. Struggling to find product-market fit or highly niched.</p>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="section-header">Landscape Map</h3>
        <div className="relative mt-4">
          {/* Quadrant labels with better visibility */}
          <div className="absolute top-4 left-10 rounded bg-background/80 px-2 py-1 text-[10px] font-semibold text-foreground uppercase tracking-wider border border-border shadow-sm backdrop-blur-sm z-10">Rising Stars</div>
          <div className="absolute top-4 right-6 rounded bg-background/80 px-2 py-1 text-[10px] font-semibold text-foreground uppercase tracking-wider border border-border shadow-sm backdrop-blur-sm z-10">Dominant</div>
          <div className="absolute bottom-12 left-10 rounded bg-background/80 px-2 py-1 text-[10px] font-semibold text-foreground uppercase tracking-wider border border-border shadow-sm backdrop-blur-sm z-10">Fringe</div>
          <div className="absolute bottom-12 right-6 rounded bg-background/80 px-2 py-1 text-[10px] font-semibold text-foreground uppercase tracking-wider border border-border shadow-sm backdrop-blur-sm z-10">Sleeping Giants</div>

          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis
                type="number"
                dataKey="subs"
                name="Subscribers"
                tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatNumber(v)}
              />
              <YAxis
                type="number"
                dataKey="engagement"
                name="Engagement %"
                tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(0,0%,12%)", border: "1px solid hsl(0,0%,18%)", borderRadius: 8, color: "hsl(0,0%,95%)" }}
                formatter={(value: number, name: string) => [name === "Subscribers" ? formatNumber(value) : `${value}%`, name]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ""}
              />
              <Scatter data={scatterData} onClick={(data) => {
                if (!data.isYou) navigate(`/app/competitors/${data.id}`);
              }}>
                {scatterData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.isYou ? "hsl(0,90%,50%)" : "hsl(210,90%,55%)"}
                    r={entry.isYou ? 10 : 7}
                    style={{ cursor: entry.isYou ? "default" : "pointer" }}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {scatterData.map((d) => (
            <div key={d.id} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: d.isYou ? "hsl(0,90%,50%)" : "hsl(210,90%,55%)" }}
              />
              <span className="text-xs text-muted-foreground">
                {d.name}
                <span className="text-[10px] ml-1 text-muted-foreground/60">({getQuadrant(d.subs, d.engagement)})</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
