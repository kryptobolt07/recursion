import { niches } from "@/data/mockData";
import ReachCalendar from "@/components/shared/ReachCalendar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function CadencePage() {
  const globalMonthly = Array.from({ length: 12 }, (_, i) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[i];
    const data: Record<string, number | string> = { month };
    niches.forEach((n) => {
      data[n.id] = n.cadence.monthlyUploads[i]?.count || 0;
    });
    return data;
  });

  const globalDayDist = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
    day,
    count: niches.reduce((s, n) => s + (n.cadence.uploadDayHeatmap.find((d) => d.day === day)?.count || 0), 0),
  }));

  const bestGlobalDay = globalDayDist.reduce((max, d) => (d.count > max.count ? d : max));
  const globalAvgGap = niches.reduce((s, n) => s + n.cadence.avgGapDays * n.uploadShare, 0) / 100;
  const globalConsistency = Math.round(niches.reduce((s, n) => s + n.cadence.consistencyIndex * n.uploadShare, 0) / 100);

  const nicheBarColors = ["hsl(0,90%,50%)", "hsl(210,90%,55%)", "hsl(142,70%,45%)", "hsl(38,92%,50%)", "hsl(270,70%,55%)"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Cadence</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload rhythm, consistency, and timing patterns</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card text-center">
          <p className="stat-value">{globalAvgGap.toFixed(1)}d</p>
          <p className="stat-label">Avg Gap</p>
        </div>
        <div className="stat-card text-center">
          <p className="stat-value">{globalConsistency}</p>
          <p className="stat-label">Consistency Score</p>
        </div>
        <div className="stat-card text-center">
          <p className="stat-value">{bestGlobalDay.day}</p>
          <p className="stat-label">Best Upload Day</p>
        </div>
        <div className="stat-card text-center">
          <p className="stat-value">14d</p>
          <p className="stat-label">Longest Gap</p>
        </div>
      </div>

      <ReachCalendar />

      {/* Stacked monthly chart */}
      <div className="stat-card">
        <h3 className="section-header">Monthly Uploads by Niche</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={globalMonthly}>
            <XAxis dataKey="month" tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,12%)", border: "1px solid hsl(0,0%,18%)", borderRadius: 8, color: "hsl(0,0%,95%)" }} />
            {niches.map((n, i) => (
              <Bar key={n.id} dataKey={n.id} stackId="a" fill={nicheBarColors[i]} name={n.name} radius={i === niches.length - 1 ? [4, 4, 0, 0] : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Upload day distribution */}
      <div className="stat-card">
        <h3 className="section-header">Upload Day Distribution</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={globalDayDist}>
            <XAxis dataKey="day" tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {globalDayDist.map((d, i) => (
                <Cell key={i} fill={d.day === bestGlobalDay.day ? "hsl(0,90%,50%)" : "hsl(0,0%,25%)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per niche mini cards */}
      <div className="stat-card">
        <h3 className="section-header">Per-Niche Cadence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {niches.map((n) => (
            <div key={n.id} className="bg-accent/50 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground mb-2">{n.name}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Avg Gap</p>
                  <p className="text-foreground font-medium">{n.cadence.avgGapDays}d</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Consistency</p>
                  <p className="text-foreground font-medium">{n.cadence.consistencyIndex}/100</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Best Day</p>
                  <p className="text-foreground font-medium">{n.cadence.bestDay}</p>
                </div>
              </div>
              {n.cadence.cadenceDropCorrelation && (
                <p className="text-[10px] text-warning mt-2">⚠ Performance drops when cadence slips</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
