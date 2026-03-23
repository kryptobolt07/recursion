import { strategyReport, niches, formatNumber } from "@/data/mockData";

export default function StrategyReportPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Strategy Report</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-generated recommendations based on full channel analysis</p>
      </div>

      {/* Niche mix recommendation */}
      <div className="stat-card">
        <h3 className="section-header">Niche Mix: Current vs Suggested</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">CURRENT</p>
            <div className="flex h-8 rounded-lg overflow-hidden">
              {strategyReport.currentMix.map((n, i) => {
                const colors = ["bg-red-600", "bg-blue-600", "bg-green-600", "bg-amber-600", "bg-purple-600"];
                return <div key={n.name} className={`${colors[i]} flex items-center justify-center`} style={{ width: `${n.share}%` }}>
                  {n.share > 10 && <span className="text-[10px] text-primary-foreground">{n.share}%</span>}
                </div>;
              })}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">SUGGESTED</p>
            <div className="flex h-8 rounded-lg overflow-hidden">
              {strategyReport.suggestedMix.map((n, i) => {
                const colors = ["bg-red-600", "bg-blue-600", "bg-green-600", "bg-amber-600", "bg-purple-600"];
                return <div key={n.name} className={`${colors[i]} flex items-center justify-center`} style={{ width: `${n.share}%` }}>
                  {n.share > 10 && <span className="text-[10px] text-primary-foreground">{n.share}%</span>}
                </div>;
              })}
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {strategyReport.nicheRecommendations.map((r) => (
            <div key={r.niche} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
              <span className={`text-sm font-semibold w-12 ${r.change.startsWith("+") ? "text-success" : "text-destructive"}`}>{r.change}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{r.niche}</p>
                <p className="text-xs text-muted-foreground">{r.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      {[strategyReport.roadmap.phase1, strategyReport.roadmap.phase2, strategyReport.roadmap.phase3].map((phase) => (
        <div key={phase.title} className="stat-card">
          <h3 className="section-header">{phase.title}</h3>
          <ul className="space-y-2">
            {phase.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] text-primary font-bold">{i + 1}</span>
                </span>
                <p className="text-sm text-foreground">{action}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
