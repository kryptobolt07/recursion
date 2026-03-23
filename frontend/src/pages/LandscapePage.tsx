import { useNavigate } from "react-router-dom";
import { competitors, channelStats, formatNumber } from "@/data/mockData";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function LandscapePage() {
  const navigate = useNavigate();

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Competitive Landscape</h1>
        <p className="text-sm text-muted-foreground mt-1">Subscriber count vs engagement rate positioning</p>
      </div>

      <div className="stat-card">
        <h3 className="section-header">Landscape Map</h3>
        <div className="relative">
          {/* Quadrant labels */}
          <div className="absolute top-2 left-8 text-[10px] text-muted-foreground/50 uppercase tracking-wide">Rising Stars</div>
          <div className="absolute top-2 right-4 text-[10px] text-muted-foreground/50 uppercase tracking-wide">Dominant</div>
          <div className="absolute bottom-12 left-8 text-[10px] text-muted-foreground/50 uppercase tracking-wide">Fringe</div>
          <div className="absolute bottom-12 right-4 text-[10px] text-muted-foreground/50 uppercase tracking-wide">Sleeping Giants</div>

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
                if (!data.isYou) navigate(`/competitors/${data.id}`);
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
