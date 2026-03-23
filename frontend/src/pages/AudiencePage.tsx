import { niches } from "@/data/mockData";
import SentimentBar from "@/components/shared/SentimentBar";
import TagCloud from "@/components/shared/TagCloud";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

export default function AudiencePage() {
  // Global aggregation
  const globalSentiment = {
    positive: Math.round(niches.reduce((s, n) => s + n.audience.sentiment.positive * n.uploadShare, 0) / 100),
    neutral: Math.round(niches.reduce((s, n) => s + n.audience.sentiment.neutral * n.uploadShare, 0) / 100),
    critical: Math.round(niches.reduce((s, n) => s + n.audience.sentiment.critical * n.uploadShare, 0) / 100),
  };

  const bands = ["13–17", "18–24", "25–34", "35–44", "45–54", "55+"];
  const globalAge = bands.map((band) => ({
    band,
    percentage: Math.round(niches.reduce((s, n) => s + (n.audience.ageBreakdown.find((a) => a.band === band)?.percentage || 0) * n.uploadShare, 0) / 100),
  }));

  const genders = ["Male", "Female", "Other"];
  const globalGender = genders.map((gender) => ({
    name: gender,
    value: Math.round(niches.reduce((s, n) => s + (n.audience.genderBreakdown.find((g) => g.gender === gender)?.percentage || 0) * n.uploadShare, 0) / 100),
  })).filter(g => g.value > 0);

  const genderColors = ["hsl(210,90%,55%)", "hsl(340,80%,60%)", "hsl(0,0%,50%)"];

  const allCountries = new Map<string, number>();
  niches.forEach((n) => {
    n.audience.countryBreakdown.forEach((c) => {
      allCountries.set(c.country, (allCountries.get(c.country) || 0) + c.percentage * n.uploadShare / 100);
    });
  });
  const globalCountries = [...allCountries.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([country, pct]) => ({ country, percentage: Math.round(pct) }));

  const allAsks = [...new Set(niches.flatMap((n) => n.audience.viewerAsks))];
  const allPraises = [...new Set(niches.flatMap((n) => n.audience.praises))];
  const allComplaints = [...new Set(niches.flatMap((n) => n.audience.complaints))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audience</h1>
        <p className="text-sm text-muted-foreground mt-1">Sentiment, demographics, and viewer feedback</p>
      </div>

      {/* Global sentiment */}
      <div className="stat-card">
        <h3 className="section-header">Global Sentiment</h3>
        <SentimentBar {...globalSentiment} />
        <p className="text-sm text-muted-foreground mt-3">Your audience is largely positive with strong enthusiasm for technical depth. Privacy content generates more polarized reactions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Age breakdown */}
        <div className="stat-card">
          <h3 className="section-header">Age Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={globalAge}>
              <XAxis dataKey="band" tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }} />
              <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                {globalAge.map((_, i) => (
                  <Cell key={i} fill={i === 2 ? "hsl(0,90%,50%)" : "hsl(0,0%,25%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender breakdown */}
        <div className="stat-card">
          <h3 className="section-header">Gender Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={globalGender}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {globalGender.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={genderColors[index % genderColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {globalGender.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: genderColors[index % genderColors.length] }}></div>
                {entry.name} ({entry.value}%)
              </div>
            ))}
          </div>
        </div>

        {/* Country breakdown */}

        <div className="stat-card">
          <h3 className="section-header">Country Breakdown</h3>
          <div className="space-y-2">
            {globalCountries.map((c) => (
              <div key={c.country} className="flex items-center gap-3">
                <span className="text-sm text-foreground w-32 shrink-0">{c.country}</span>
                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${c.percentage * 3}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Viewer feedback */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <h3 className="text-sm font-medium text-foreground mb-3">What Viewers Ask For</h3>
          <TagCloud tags={allAsks} />
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-medium text-foreground mb-3">What Viewers Praise</h3>
          <TagCloud tags={allPraises} variant="positive" />
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-medium text-foreground mb-3">What Viewers Complain About</h3>
          <TagCloud tags={allComplaints} variant="negative" />
        </div>
      </div>

      {/* Per-niche audience cards */}
      <div className="stat-card">
        <h3 className="section-header">Per-Niche Audience</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {niches.map((n) => {
            const peakAge = n.audience.ageBreakdown.reduce((max, a) => a.percentage > max.percentage ? a : max);
            const topCountry = n.audience.countryBreakdown[0];
            return (
              <div key={n.id} className="bg-accent/50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">{n.name}</p>
                <SentimentBar {...n.audience.sentiment} showLabels={false} />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Peak Age</p>
                    <p className="text-foreground">{peakAge.band} ({peakAge.percentage}%)</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Top Country</p>
                    <p className="text-foreground">{topCountry.country} ({topCountry.percentage}%)</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {n.audience.viewerAsks.slice(0, 2).map((ask) => (
                    <span key={ask} className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">{ask}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
