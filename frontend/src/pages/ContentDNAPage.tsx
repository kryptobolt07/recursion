import { niches } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function ContentDNAPage() {
  const globalTitlePatterns = {
    numbers: Math.round(niches.reduce((s, n) => s + n.contentDNA.titlePatterns.numbers * n.uploadShare, 0) / 100),
    powerVerbs: Math.round(niches.reduce((s, n) => s + n.contentDNA.titlePatterns.powerVerbs * n.uploadShare, 0) / 100),
    questionFormat: Math.round(niches.reduce((s, n) => s + n.contentDNA.titlePatterns.questionFormat * n.uploadShare, 0) / 100),
    howIStructure: Math.round(niches.reduce((s, n) => s + n.contentDNA.titlePatterns.howIStructure * n.uploadShare, 0) / 100),
  };

  const globalLengthDist = ["<5m", "5–10m", "10–20m", "20–30m", "30m+"].map((bucket) => ({
    bucket,
    count: niches.reduce((s, n) => s + (n.contentDNA.videoLengthDist.find((d) => d.bucket === bucket)?.count || 0), 0),
  }));

  const peakBucket = globalLengthDist.reduce((max, d) => (d.count > max.count ? d : max));

  const barColors = ["hsl(0,90%,50%)", "hsl(210,90%,55%)", "hsl(142,70%,45%)", "hsl(38,92%,50%)", "hsl(270,70%,55%)"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content DNA</h1>
        <p className="text-sm text-muted-foreground mt-1">Title patterns, thumbnail styles, and video structure across all niches</p>
      </div>

      {/* Global title patterns */}
      <div className="stat-card">
        <h3 className="section-header">Title Pattern Analysis (Global)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Contains Numbers", value: globalTitlePatterns.numbers },
            { label: "Power Verbs", value: globalTitlePatterns.powerVerbs },
            { label: "Question Format", value: globalTitlePatterns.questionFormat },
            { label: '"How I" Structure', value: globalTitlePatterns.howIStructure },
          ].map((p) => (
            <div key={p.label} className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="32" cy="32" r="28" fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeDasharray={`${(p.value / 100) * 175.9} 175.9`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{p.value}%</span>
              </div>
              <p className="text-xs text-muted-foreground">{p.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Global thumbnail style */}
      <div className="stat-card">
        <h3 className="section-header">Thumbnail Style (Global)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {niches.map((n) => (
            <div key={n.id} className="bg-accent/50 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground mb-2">{n.name}</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>Face: <span className="text-foreground">{n.contentDNA.thumbnailStyle.facePresent}%</span></p>
                <p>Bold text: <span className="text-foreground">{n.contentDNA.thumbnailStyle.boldTextOverlay}%</span></p>
                <p>Avg words: <span className="text-foreground">{n.contentDNA.thumbnailStyle.avgWordCount}</span></p>
                <div className="flex gap-1 mt-1">
                  {n.contentDNA.thumbnailStyle.dominantColors.map((c) => (
                    <div key={c} className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video length distribution */}
      <div className="stat-card">
        <h3 className="section-header">Video Length Distribution</h3>
        <p className="text-xs text-muted-foreground mb-3">Peak: <span className="text-foreground font-medium">{peakBucket.bucket}</span> ({peakBucket.count} videos)</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={globalLengthDist}>
            <XAxis dataKey="bucket" tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {globalLengthDist.map((_, i) => (
                <Cell key={i} fill={barColors[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cross-niche comparison */}
      <div className="stat-card">
        <h3 className="section-header">Cross-Niche Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-accent/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Longest Videos</p>
            <p className="text-sm font-medium text-foreground">
              {[...niches].sort((a, b) => b.avgLengthMinutes - a.avgLengthMinutes)[0].name}
            </p>
            <p className="text-xs text-muted-foreground">
              {[...niches].sort((a, b) => b.avgLengthMinutes - a.avgLengthMinutes)[0].avgLength} avg
            </p>
          </div>
          <div className="bg-accent/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Most Face-in-Thumbnail</p>
            <p className="text-sm font-medium text-foreground">
              {[...niches].sort((a, b) => b.contentDNA.thumbnailStyle.facePresent - a.contentDNA.thumbnailStyle.facePresent)[0].name}
            </p>
            <p className="text-xs text-muted-foreground">
              {[...niches].sort((a, b) => b.contentDNA.thumbnailStyle.facePresent - a.contentDNA.thumbnailStyle.facePresent)[0].contentDNA.thumbnailStyle.facePresent}%
            </p>
          </div>
          <div className="bg-accent/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Most Number-Based Titles</p>
            <p className="text-sm font-medium text-foreground">
              {[...niches].sort((a, b) => b.contentDNA.titlePatterns.numbers - a.contentDNA.titlePatterns.numbers)[0].name}
            </p>
            <p className="text-xs text-muted-foreground">
              {[...niches].sort((a, b) => b.contentDNA.titlePatterns.numbers - a.contentDNA.titlePatterns.numbers)[0].contentDNA.titlePatterns.numbers}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
