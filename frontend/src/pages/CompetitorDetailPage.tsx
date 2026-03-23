import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { channelStats, niches, formatNumber } from "@/data/mockData";
import StatStrip from "@/components/shared/StatStrip";
import SentimentBar from "@/components/shared/SentimentBar";
import TagCloud from "@/components/shared/TagCloud";
import { ArrowLeft, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { apiFetch } from "@/lib/api";
import { findCreatorNiche, findCreatorVideoMatch } from "@/lib/creatorDerived";

const tabs = ["Overview", "Content Similarity", "Similar Videos", "Viral Patterns", "Engagement"] as const;

interface CompetitorVideo {
  id: string;
  title: string;
  views: number;
  duration: string;
  publishDate: string;
  nicheId: string;
  nicheName: string;
  thumbnailUrl: string;
}

interface CompetitorDetail {
  id: string;
  name: string;
  handle: string;
  thumbnailUrl: string;
  subscribers: number;
  avgViews: number;
  engagementRate: number;
  uploadFrequency: string;
  topNiche: string;
  similarityScore: number;
  healthScore: number;
  nicheDistribution: { nicheId: string; name: string; share: number; avgViews: number }[];
  sharedNiches: string[];
  exclusiveNiches: string[];
  videos: CompetitorVideo[];
  viralVideos: { id: string; title: string; views: number; duration: string; publishDate: string; thumbnailUrl: string }[];
  engagementTrend: { month: string; rate: number }[];
  commentSentiment: { positive: number; neutral: number; critical: number };
  viewerAsks: string[];
  similarity: {
    overall: number;
    niche_overlap: number;
    title_formula_overlap: number;
    keyword_density_overlap: number;
    subscriber_proximity: number;
    audience_fit: number;
  };
  patternSummary: string;
}

export default function CompetitorDetailPage() {
  const { competitorId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Overview");
  const { data: comp, isLoading, error } = useQuery<CompetitorDetail>({
    queryKey: ["competitor_detail", competitorId],
    queryFn: async () => {
      const res = await apiFetch(`/competitors/${competitorId}/overview`);
      if (!res.ok) throw new Error("Failed to load competitor details");
      return res.json();
    },
    enabled: !!competitorId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !comp) return <div className="p-6 text-foreground">Competitor not found</div>;

  const delta = (yours: number, theirs: number) => {
    const diff = yours - theirs;
    const pct = theirs !== 0 ? ((diff / theirs) * 100).toFixed(0) : "—";
    return { diff, pct, positive: diff > 0 };
  };

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
            <h3 className="section-header">Overall Similarity: {Math.round(comp.similarity.overall)}/100</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Niche Overlap", value: Math.round(comp.similarity.niche_overlap) },
                { label: "Title Formula", value: Math.round(comp.similarity.title_formula_overlap) },
                { label: "Keyword Overlap", value: Math.round(comp.similarity.keyword_density_overlap) },
                { label: "Audience Fit", value: Math.round(comp.similarity.audience_fit) },
                { label: "Sub Proximity", value: Math.round(comp.similarity.subscriber_proximity) },
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
                const yourNiche = findCreatorNiche({ nicheName: sn });
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
                const yourMatch = findCreatorVideoMatch({
                  nicheId: cv.nicheId,
                  nicheName: cv.nicheName,
                  title: cv.title,
                });
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

      {/* Viral Patterns */}
      {activeTab === "Viral Patterns" && (
        <div className="space-y-6 animate-fade-in">
          <div className="stat-card">
            <h3 className="section-header">Viral Videos (&gt;2× avg views)</h3>
            <div className="space-y-3">
              {comp.viralVideos.map((v) => (
                <div key={v.id} className="bg-accent/50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-12 h-12 rounded-md object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-accent" />
                    )}
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
            <p className="text-sm text-muted-foreground">{comp.patternSummary}</p>
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
            <p className="text-xs text-muted-foreground mt-3">
              Estimated from sampled public comments on recent high-comment videos.
            </p>
          </div>

          <div className="stat-card">
            <h3 className="section-header">What Their Public Commenters Ask For</h3>
            <TagCloud tags={comp.viewerAsks} />
            <p className="text-xs text-muted-foreground mt-3">
              Estimated from question-style public comments and repeated request phrases, not private channel analytics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
