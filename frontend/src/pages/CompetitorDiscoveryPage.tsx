import { useNavigate } from "react-router-dom";
import { competitors, channelStats, formatNumber } from "@/data/mockData";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis } from "recharts";

export default function CompetitorDiscoveryPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Competitor Discovery</h1>
        <p className="text-sm text-muted-foreground mt-1">Auto-discovered competitors based on niche overlap and audience behavior</p>
      </div>

      {/* Top competitors list */}
      <div className="stat-card">
        <h3 className="section-header">Discovered Competitors</h3>
        <div className="space-y-3">
          {competitors.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/competitors/${c.id}`)}
              className="flex items-center gap-4 p-3 rounded-lg bg-accent/30 hover:bg-accent/60 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{c.name[0]}</span>
              </div>
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
            </tr>
            {competitors.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/competitors/${c.id}`)}
                className="border-b border-border/50 cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <td className="py-2 font-medium text-foreground">{c.name}</td>
                <td className="text-right text-foreground">{formatNumber(c.subscribers)}</td>
                <td className="text-right text-foreground">{formatNumber(c.avgViews)}</td>
                <td className="text-right text-foreground">{c.engagementRate}%</td>
                <td className="text-right text-muted-foreground">{c.uploadFrequency}</td>
                <td className="text-right text-muted-foreground">{c.topNiche}</td>
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
