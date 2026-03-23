import { useNavigate } from "react-router-dom";
import { niches, channelStats, formatNumber } from "@/data/mockData";
import NicheBlockChart from "@/components/channel/NicheBlockChart";
import HealthScore from "@/components/channel/HealthScore";
import StatStrip from "@/components/shared/StatStrip";
import { Eye, TrendingUp, ArrowRight } from "lucide-react";

export default function OverviewPage() {
  const navigate = useNavigate();

  const allTopVideos = niches
    .flatMap((n) => n.topVideos.map((v) => ({ ...v, nicheName: n.name, nicheColor: n.colorIndex })))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Channel Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">TechForge — @TechForge</p>
      </div>

      <StatStrip
        stats={[
          { label: "Avg Views / Video", value: channelStats.avgViews },
          { label: "Engagement Rate", value: channelStats.engagementRate, suffix: "%" },
          { label: "View/Sub Ratio", value: channelStats.viewToSubRatio, suffix: "%" },
          { label: "Upload Frequency", value: channelStats.uploadFrequency },
        ]}
      />

      <NicheBlockChart />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Niche comparison table */}
        <div className="lg:col-span-2 stat-card overflow-x-auto">
          <h3 className="section-header">Niche Comparison</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 font-medium">Niche</th>
                <th className="pb-2 font-medium text-right">Upload %</th>
                <th className="pb-2 font-medium text-right">Avg Views</th>
                <th className="pb-2 font-medium text-right">Avg Length</th>
                <th className="pb-2 font-medium text-right">Retention</th>
                <th className="pb-2 font-medium text-right">View %</th>
              </tr>
            </thead>
            <tbody>
              {niches.map((n) => {
                const surplus = n.viewShare - n.uploadShare;
                return (
                  <tr
                    key={n.id}
                    onClick={() => navigate(`/niche/${n.id}`)}
                    className="border-b border-border/50 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-niche-${n.colorIndex}`} />
                        <span className="font-medium text-foreground">{n.name}</span>
                      </div>
                    </td>
                    <td className="text-right text-foreground">{n.uploadShare}%</td>
                    <td className="text-right text-foreground">{formatNumber(n.avgViews)}</td>
                    <td className="text-right text-muted-foreground">{n.avgLength}</td>
                    <td className="text-right text-muted-foreground">{n.retention}%</td>
                    <td className="text-right">
                      <span className="text-foreground">{n.viewShare}%</span>
                      <span className={`ml-1 text-xs ${surplus > 0 ? "text-success" : surplus < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {surplus > 0 ? `+${surplus}` : surplus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Health Score */}
        <HealthScore score={channelStats.healthScore} subScores={channelStats.healthSubScores} />
      </div>

      {/* Top performing videos */}
      <div className="stat-card">
        <h3 className="section-header">Top Performing Videos</h3>
        <div className="space-y-2">
          {allTopVideos.map((video, i) => (
            <div
              key={video.id}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
            >
              <span className="text-xs text-muted-foreground w-5 text-right font-mono">{i + 1}</span>
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: video.thumbnailColor }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{video.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded bg-niche-${video.nicheColor}/10 text-niche-${video.nicheColor}`}>
                    {video.nicheName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{video.duration}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">{formatNumber(video.views)}</p>
                <p className="text-[10px] text-muted-foreground">views</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
