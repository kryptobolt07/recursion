import { niches, formatNumber } from "@/data/mockData";

export default function ViewsBreakdownPage() {
  const totalViews = niches.reduce((sum, n) => sum + n.avgViews * n.totalVideos, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Views Breakdown</h1>
        <p className="text-sm text-muted-foreground mt-1">Which niches drive the most views?</p>
      </div>

      {/* Proportional views bar */}
      <div className="stat-card">
        <h3 className="section-header">View Share by Niche</h3>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {niches.map((n) => {
            const nicheColors: Record<number, string> = {
              1: "bg-red-600", 2: "bg-blue-600", 3: "bg-green-600", 4: "bg-amber-600", 5: "bg-purple-600",
            };
            return (
              <div
                key={n.id}
                className={`${nicheColors[n.colorIndex]} flex items-center justify-center transition-all hover:brightness-110`}
                style={{ width: `${n.viewShare}%` }}
              >
                {n.viewShare > 8 && (
                  <span className="text-xs font-medium text-primary-foreground">{n.viewShare}%</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {niches.map((n) => {
            const dotColors: Record<number, string> = {
              1: "bg-red-600", 2: "bg-blue-600", 3: "bg-green-600", 4: "bg-amber-600", 5: "bg-purple-600",
            };
            return (
              <div key={n.id} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${dotColors[n.colorIndex]}`} />
                <span className="text-xs text-muted-foreground">{n.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Efficiency chart */}
      <div className="stat-card">
        <h3 className="section-header">Upload Share vs View Share Efficiency</h3>
        <div className="space-y-3">
          {niches.map((n) => {
            const surplus = n.viewShare - n.uploadShare;
            return (
              <div key={n.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{n.name}</span>
                  <span className={`text-sm font-semibold ${surplus > 0 ? "text-success" : surplus < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {surplus > 0 ? "+" : ""}{surplus}% surplus
                  </span>
                </div>
                <div className="flex gap-1 h-5">
                  <div className="bg-muted rounded flex items-center justify-center" style={{ width: `${n.uploadShare * 2}%` }}>
                    <span className="text-[10px] text-muted-foreground">{n.uploadShare}% uploads</span>
                  </div>
                  <div
                    className={`rounded flex items-center justify-center ${surplus >= 0 ? "bg-success/20" : "bg-destructive/20"}`}
                    style={{ width: `${n.viewShare * 2}%` }}
                  >
                    <span className="text-[10px] text-foreground">{n.viewShare}% views</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 3 per niche */}
      <div className="stat-card">
        <h3 className="section-header">Top 3 Videos Per Niche</h3>
        <div className="space-y-4">
          {niches.map((n) => (
            <div key={n.id}>
              <p className="text-sm font-medium text-foreground mb-2">{n.name}</p>
              <div className="space-y-1.5">
                {n.topVideos.slice(0, 3).map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3 pl-3">
                    <span className="text-xs text-muted-foreground font-mono w-3">{i + 1}</span>
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: v.thumbnailColor }} />
                    <span className="text-sm text-foreground flex-1 truncate">{v.title}</span>
                    <span className="text-sm font-medium text-foreground">{formatNumber(v.views)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estimated views per niche (12 months) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {niches.map((n) => {
          const est12mo = n.avgViews * n.totalVideos;
          return (
            <div key={n.id} className="stat-card text-center">
              <p className="stat-value">{formatNumber(est12mo)}</p>
              <p className="stat-label">{n.name}</p>
              <p className="text-[10px] text-muted-foreground">est. 12mo views</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
