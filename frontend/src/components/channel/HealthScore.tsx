import { formatNumber } from "@/data/mockData";

interface HealthScoreProps {
  score: number;
  subScores: {
    contentQuality: number;
    engagement: number;
    growthMomentum: number;
    consistency: number;
  };
}

export default function HealthScore({ score, subScores }: HealthScoreProps) {
  const getColor = (s: number) =>
    s >= 80 ? "bg-success" : s >= 60 ? "bg-warning" : "bg-destructive";

  return (
    <div className="stat-card">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={score >= 80 ? "hsl(var(--success))" : score >= 60 ? "hsl(var(--warning))" : "hsl(var(--destructive))"}
              strokeWidth="4"
              strokeDasharray={`${(score / 100) * 175.9} 175.9`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">{score}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Channel Health</p>
          <p className="text-xs text-muted-foreground">Overall score out of 100</p>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { label: "Content Quality", value: subScores.contentQuality },
          { label: "Engagement", value: subScores.engagement },
          { label: "Growth Momentum", value: subScores.growthMomentum },
          { label: "Consistency", value: subScores.consistency },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-28 shrink-0">{item.label}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${getColor(item.value)}`} style={{ width: `${item.value}%` }} />
            </div>
            <span className="text-xs font-medium text-foreground w-8 text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
