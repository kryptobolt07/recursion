import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { niches, formatNumber } from "@/data/mockData";
import StatStrip from "@/components/shared/StatStrip";
import SentimentBar from "@/components/shared/SentimentBar";
import TagCloud from "@/components/shared/TagCloud";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const tabs = ["Overview", "Subniches", "Content DNA", "Cadence", "Audience"] as const;

export default function NicheDetailPage() {
  const { nicheId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Overview");
  const niche = niches.find((n) => n.id === nicheId);

  if (!niche) return <div className="p-6 text-foreground">Niche not found</div>;

  const barColors = ["hsl(0,90%,50%)", "hsl(210,90%,55%)", "hsl(142,70%,45%)", "hsl(38,92%,50%)", "hsl(270,70%,55%)"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/app")} className="p-1.5 rounded-md hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{niche.name}</h1>
          <p className="text-sm text-muted-foreground">{niche.totalVideos} videos · {niche.uploadShare}% of uploads</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm transition-colors ${activeTab === tab ? "tab-active" : "tab-inactive"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "Overview" && (
        <div className="space-y-6 animate-fade-in">
          <StatStrip stats={[
            { label: "Avg Views", value: niche.avgViews },
            { label: "Avg Length", value: niche.avgLength },
            { label: "Est. Retention", value: niche.retention, suffix: "%" },
            { label: "View Share", value: niche.viewShare, suffix: "%" },
          ]} />

          <div className="stat-card">
            <h3 className="section-header">Top 3 Videos</h3>
            <div className="space-y-2">
              {niche.topVideos.map((v, i) => (
                <div key={v.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50">
                  <span className="text-xs text-muted-foreground font-mono w-4">{i + 1}</span>
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: v.thumbnailColor }} />
                  <span className="text-sm text-foreground flex-1 truncate">{v.title}</span>
                  <span className="text-sm font-semibold text-foreground">{formatNumber(v.views)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card">
            <h3 className="section-header">Audience Sentiment</h3>
            <SentimentBar {...niche.sentiment} />
          </div>

          <div className="stat-card">
            <h3 className="text-sm font-medium text-foreground mb-2">Content Health</h3>
            <p className="text-sm text-muted-foreground">{niche.healthSummary}</p>
          </div>
        </div>
      )}

      {/* Subniches */}
      {activeTab === "Subniches" && (
        <div className="space-y-4 animate-fade-in">
          {niche.subniches.map((sub) => (
            <div key={sub.name} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">{sub.name}</h3>
                <div className="flex items-center gap-1">
                  {sub.growthTrend === "growing" && <TrendingUp className="w-3.5 h-3.5 text-success" />}
                  {sub.growthTrend === "shrinking" && <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                  {sub.growthTrend === "stable" && <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span className={`text-xs capitalize ${sub.growthTrend === "growing" ? "text-success" : sub.growthTrend === "shrinking" ? "text-destructive" : "text-muted-foreground"}`}>
                    {sub.growthTrend}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Avg Views</p>
                  <p className="text-foreground font-medium">{formatNumber(sub.avgViews)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Retention</p>
                  <p className="text-foreground font-medium">{sub.retention}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Upload Freq</p>
                  <p className="text-foreground font-medium">{sub.uploadFrequency}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content DNA */}
      {activeTab === "Content DNA" && (
        <div className="space-y-6 animate-fade-in">
          <div className="stat-card">
            <h3 className="section-header">Title Patterns</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              {[
                { label: "Numbers", value: niche.contentDNA.titlePatterns.numbers },
                { label: "Power Verbs", value: niche.contentDNA.titlePatterns.powerVerbs },
                { label: "Question", value: niche.contentDNA.titlePatterns.questionFormat },
                { label: '"How I"', value: niche.contentDNA.titlePatterns.howIStructure },
              ].map((p) => (
                <div key={p.label} className="bg-accent/50 rounded-lg p-3">
                  <p className="text-xl font-bold text-foreground">{p.value}%</p>
                  <p className="text-xs text-muted-foreground">{p.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Avg word count: <span className="text-foreground">{niche.contentDNA.titlePatterns.avgWordCount}</span> · 
              Avg char length: <span className="text-foreground">{niche.contentDNA.titlePatterns.avgCharLength}</span>
            </p>
          </div>

          <div className="stat-card">
            <h3 className="section-header">Video Length Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={niche.contentDNA.videoLengthDist}>
                <XAxis dataKey="bucket" tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {niche.contentDNA.videoLengthDist.map((_, i) => (
                    <Cell key={i} fill={barColors[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="stat-card">
              <h3 className="section-header">Hook Types</h3>
              {niche.contentDNA.hookTypes.map((h) => (
                <div key={h.type} className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-foreground w-24">{h.type}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${h.percentage}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{h.percentage}%</span>
                </div>
              ))}
            </div>
            <div className="stat-card">
              <h3 className="section-header">CTA Pattern</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Asks for likes/subs</p>
                  <p className="text-lg font-bold text-foreground">{niche.contentDNA.ctaPattern.asksForLikesSubs}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg CTA timestamp</p>
                  <p className="text-lg font-bold text-foreground">{niche.contentDNA.ctaPattern.avgTimestamp}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Consistency</p>
                  <p className="text-lg font-bold text-foreground">{niche.contentDNA.ctaPattern.consistency}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cadence */}
      {activeTab === "Cadence" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="stat-card text-center">
              <p className="stat-value">{niche.cadence.avgGapDays}d</p>
              <p className="stat-label">Avg Gap</p>
            </div>
            <div className="stat-card text-center">
              <p className="stat-value">{niche.cadence.consistencyIndex}</p>
              <p className="stat-label">Consistency</p>
            </div>
            <div className="stat-card text-center">
              <p className="stat-value">{niche.cadence.bestDay}</p>
              <p className="stat-label">Best Day</p>
            </div>
            <div className="stat-card text-center">
              <p className={`stat-value ${niche.cadence.cadenceDropCorrelation ? "text-warning" : "text-success"}`}>
                {niche.cadence.cadenceDropCorrelation ? "Yes" : "No"}
              </p>
              <p className="stat-label">Cadence Drop Impact</p>
            </div>
          </div>

          <div className="stat-card">
            <h3 className="section-header">Monthly Uploads</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={niche.cadence.monthlyUploads}>
                <XAxis dataKey="month" tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Bar dataKey="count" fill="hsl(0,90%,50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="stat-card">
            <h3 className="section-header">Upload Day Heatmap</h3>
            <div className="flex gap-2">
              {niche.cadence.uploadDayHeatmap.map((d) => {
                const maxCount = Math.max(...niche.cadence.uploadDayHeatmap.map((h) => h.count));
                const intensity = d.count / maxCount;
                return (
                  <div key={d.day} className="flex-1 text-center">
                    <div
                      className="h-12 rounded-md mb-1 flex items-center justify-center"
                      style={{ backgroundColor: `hsla(0, 90%, 50%, ${0.1 + intensity * 0.8})` }}
                    >
                      <span className="text-xs font-medium text-foreground">{d.count}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Audience */}
      {activeTab === "Audience" && (
        <div className="space-y-6 animate-fade-in">
          <div className="stat-card">
            <h3 className="section-header">Sentiment</h3>
            <SentimentBar {...niche.audience.sentiment} />
            <p className="text-sm text-muted-foreground mt-3">{niche.audience.sentimentSummary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card">
              <h3 className="text-sm font-medium text-foreground mb-3">Viewer Asks</h3>
              <TagCloud tags={niche.audience.viewerAsks} />
            </div>
            <div className="stat-card">
              <h3 className="text-sm font-medium text-foreground mb-3">Praises</h3>
              <TagCloud tags={niche.audience.praises} variant="positive" />
            </div>
            <div className="stat-card">
              <h3 className="text-sm font-medium text-foreground mb-3">Complaints</h3>
              <TagCloud tags={niche.audience.complaints} variant="negative" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="stat-card">
              <h3 className="section-header">Age Breakdown</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={niche.audience.ageBreakdown}>
                  <XAxis dataKey="band" tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="percentage" fill="hsl(0,90%,50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="stat-card">
              <h3 className="section-header">Country Breakdown</h3>
              <div className="space-y-2">
                {niche.audience.countryBreakdown.map((c) => (
                  <div key={c.country} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-28 shrink-0">{c.country}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${c.percentage * 3}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <h3 className="section-header">Language Distribution</h3>
            <div className="flex flex-wrap gap-3">
              {niche.audience.languageDistribution.map((l) => (
                <div key={l.language} className="bg-accent/50 rounded-lg px-3 py-2 text-center">
                  <p className="text-sm font-medium text-foreground">{l.percentage}%</p>
                  <p className="text-xs text-muted-foreground">{l.language}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
