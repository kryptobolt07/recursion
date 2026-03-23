import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { competitors, channelStats, niches, formatNumber } from "@/data/mockData";
import StatStrip from "@/components/shared/StatStrip";
import SentimentBar from "@/components/shared/SentimentBar";
import TagCloud from "@/components/shared/TagCloud";
import { ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const tabs = ["Overview", "Content Similarity", "Similar Videos", "Thumbnails", "Viral Patterns", "Engagement"] as const;

export default function CompetitorDetailPage() {
  const { competitorId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Overview");
  const comp = competitors.find((c) => c.id === competitorId);

  if (!comp) return <div className="p-6 text-foreground">Competitor not found</div>;

  const delta = (yours: number, theirs: number) => {
    const diff = yours - theirs;
    const pct = theirs !== 0 ? ((diff / theirs) * 100).toFixed(0) : "—";
    return { diff, pct, positive: diff > 0 };
  };

  const engDelta = delta(channelStats.engagementRate, comp.engagementRate);
  const viewDelta = delta(channelStats.avgViews, comp.avgViews);

  // Content similarity scores (mock)
  const similarityBreakdown = {
    nicheOverlap: Math.min(comp.sharedNiches.length / niches.length * 100, 100),
    titleFormula: 65 + Math.random() * 20,
    thumbnailStyle: 45 + Math.random() * 30,
    audienceOverlap: comp.similarityScore * 0.9,
  };
  const overallSimilarity = Math.round((similarityBreakdown.nicheOverlap + similarityBreakdown.titleFormula + similarityBreakdown.thumbnailStyle + similarityBreakdown.audienceOverlap) / 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/competitors")} className="p-1.5 rounded-md hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{comp.name}</h1>
          <p className="text-sm text-muted-foreground">{comp.handle} · {formatNumber(comp.subscribers)} subscribers</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm whitespace-nowrap transition-colors ${activeTab === tab ? "tab-active" : "tab-inactive"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "Overview" && (
        <div className="space-y-6 animate-fade-in">
          <StatStrip stats={[
            { label: "Subscribers", value: comp.subscribers },
            { label: "Avg Views", value: comp.avgViews },
            { label: "Engagement Rate", value: comp.engagementRate, suffix: "%" },
            { label: "Upload Frequency", value: comp.uploadFrequency },
          ]} />

          {/* Side by side comparison */}
          <div className="stat-card">
            <h3 className="section-header">You vs {comp.name}</h3>
            <div className="space-y-3">
              {[
                { label: "Subscribers", yours: channelStats.subscribers, theirs: comp.subscribers },
                { label: "Avg Views", yours: channelStats.avgViews, theirs: comp.avgViews },
                { label: "Engagement", yours: channelStats.engagementRate, theirs: comp.engagementRate },
                { label: "Health Score", yours: channelStats.healthScore, theirs: comp.healthScore },
              ].map((row) => {
                const d = delta(row.yours, row.theirs);
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-24 shrink-0">{row.label}</span>
                    <span className="text-sm font-medium text-primary w-20 text-right">{typeof row.yours === "number" && row.yours > 1000 ? formatNumber(row.yours) : row.yours}</span>
                    <div className="flex-1 flex items-center gap-1">
                      {d.positive ? <ArrowUp className="w-3 h-3 text-success" /> : <ArrowDown className="w-3 h-3 text-destructive" />}
                      <span className={`text-xs ${d.positive ? "text-success" : "text-destructive"}`}>{d.positive ? "+" : ""}{d.pct}%</span>
                    </div>
                    <span className="text-sm text-foreground w-20 text-right">{typeof row.theirs === "number" && row.theirs > 1000 ? formatNumber(row.theirs) : row.theirs}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Competitor niche chart */}
          <div className="stat-card">
            <h3 className="section-header">Niche Distribution</h3>
            <div className="flex gap-2 h-24">
              {comp.nicheDistribution.map((n, i) => {
                const colors = ["bg-red-600", "bg-blue-600", "bg-green-600", "bg-amber-600", "bg-purple-600"];
                return (
                  <div
                    key={n.nicheId}
                    className={`${colors[i % 5]} rounded-lg p-2 flex flex-col justify-between`}
                    style={{ flex: n.share }}
                  >
                    {n.share > 10 && (
                      <>
                        <p className="text-xs font-medium text-primary-foreground">{n.name}</p>
                        <p className="text-[10px] text-primary-foreground/70">{n.share}%</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content Similarity */}
      {activeTab === "Content Similarity" && (
        <div className="space-y-6 animate-fade-in">
          <div className="stat-card">
            <h3 className="section-header">Overall Similarity: {overallSimilarity}/100</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Niche Overlap", value: Math.round(similarityBreakdown.nicheOverlap) },
                { label: "Title Formula", value: Math.round(similarityBreakdown.titleFormula) },
                { label: "Thumbnail Style", value: Math.round(similarityBreakdown.thumbnailStyle) },
                { label: "Audience Overlap", value: Math.round(similarityBreakdown.audienceOverlap) },
              ].map((s) => (
                <div key={s.label} className="bg-accent/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="stat-card">
              <h3 className="section-header">Shared Niches</h3>
              {comp.sharedNiches.map((sn) => {
                const yourNiche = niches.find((n) => n.name === sn);
                const theirNiche = comp.nicheDistribution.find((n) => n.name === sn);
                return (
                  <div key={sn} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-foreground">{sn}</span>
                    <div className="text-xs text-muted-foreground">
                      <span className="text-primary">You: {yourNiche ? formatNumber(yourNiche.avgViews) : "—"}</span>
                      <span className="mx-2">vs</span>
                      <span>{theirNiche ? formatNumber(theirNiche.avgViews) : "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="stat-card">
              <h3 className="section-header">Exclusive Niches</h3>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">They cover (you don't):</p>
                <div className="flex flex-wrap gap-1">
                  {comp.exclusiveNiches.map((n) => (
                    <span key={n} className="metric-badge bg-warning/10 text-warning">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Similar Videos */}
      {activeTab === "Similar Videos" && (
        <div className="space-y-6 animate-fade-in">
          <div className="stat-card">
            <h3 className="section-header">Their Top Videos vs Yours</h3>
            <div className="space-y-4">
              {comp.videos.map((cv) => {
                const matchingNiche = niches.find((n) => n.id === cv.nicheId);
                const yourMatch = matchingNiche?.topVideos[0];
                return (
                  <div key={cv.id} className="bg-accent/30 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-primary mb-1">YOUR VIDEO</p>
                        {yourMatch ? (
                          <>
                            <p className="text-sm text-foreground">{yourMatch.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatNumber(yourMatch.views)} views · {yourMatch.duration}</p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No matching video</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-info mb-1">THEIR VIDEO</p>
                        <p className="text-sm text-foreground">{cv.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatNumber(cv.views)} views · {cv.duration}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Thumbnails */}
      {activeTab === "Thumbnails" && (
        <div className="space-y-6 animate-fade-in">
          <div className="stat-card">
            <h3 className="section-header">Thumbnail Style Comparison</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-primary mb-3">YOU (TechForge)</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Face present</span><span className="text-foreground">48%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Bold text</span><span className="text-foreground">79%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Avg words</span><span className="text-foreground">3.2</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Complexity</span><span className="text-foreground">Clean</span></div>
                  <div className="flex gap-1 mt-2">
                    {["#e53935", "#1a1a1a", "#ffffff"].map((c) => (
                      <div key={c} className="w-6 h-6 rounded border border-border" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-info mb-3">{comp.name}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Face present</span><span className="text-foreground">{comp.thumbnailStyle.facePresent}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Bold text</span><span className="text-foreground">{comp.thumbnailStyle.boldText}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Avg words</span><span className="text-foreground">{comp.thumbnailStyle.avgWordCount}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Complexity</span><span className="text-foreground capitalize">{comp.thumbnailStyle.backgroundComplexity}</span></div>
                  <div className="flex gap-1 mt-2">
                    {comp.thumbnailStyle.dominantColors.map((c) => (
                      <div key={c} className="w-6 h-6 rounded border border-border" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Viral Patterns */}
      {activeTab === "Viral Patterns" && (
        <div className="space-y-6 animate-fade-in">
          <div className="stat-card">
            <h3 className="section-header">Viral Videos (&gt;2× avg views)</h3>
            <div className="space-y-3">
              {comp.viralVideos.map((v) => (
                <div key={v.id} className="bg-accent/50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: v.thumbnailColor }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{v.title}</p>
                      <p className="text-xs text-muted-foreground">{v.publishDate} · {v.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatNumber(v.views)}</p>
                      <p className="text-xs text-success">{(v.views / comp.avgViews).toFixed(1)}× avg</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card">
            <h3 className="section-header">Pattern Summary</h3>
            <p className="text-sm text-muted-foreground">
              {comp.name}'s viral content tends to be longer-form ({comp.viralVideos[0]?.duration || "20+ min"}) tutorials and guides 
              posted on weekdays. Titles use strong hooks with specific outcomes or comparisons. 
              Thumbnail style leans {comp.thumbnailStyle.backgroundComplexity} with {comp.thumbnailStyle.facePresent > 50 ? "face presence" : "product-focused imagery"}.
            </p>
          </div>
        </div>
      )}

      {/* Engagement */}
      {activeTab === "Engagement" && (
        <div className="space-y-6 animate-fade-in">
          <div className="stat-card">
            <h3 className="section-header">Engagement Rate Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={comp.engagementTrend}>
                <XAxis dataKey="month" tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} domain={["dataMin - 0.5", "dataMax + 0.5"]} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,12%)", border: "1px solid hsl(0,0%,18%)", borderRadius: 8, color: "hsl(0,0%,95%)" }} />
                <Line type="monotone" dataKey="rate" stroke="hsl(210,90%,55%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="stat-card">
            <h3 className="section-header">Comment Sentiment</h3>
            <SentimentBar {...comp.commentSentiment} />
          </div>

          <div className="stat-card">
            <h3 className="section-header">What Their Audience Asks For</h3>
            <TagCloud tags={comp.viewerAsks} />
            <p className="text-xs text-muted-foreground mt-3">
              These are potential content gaps you could fill — topics their audience wants that you may already have expertise in.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
