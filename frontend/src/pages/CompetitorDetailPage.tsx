import { useParams, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { channelStats, niches, formatNumber } from "@/data/mockData";
import StatStrip from "@/components/shared/StatStrip";
import SentimentBar from "@/components/shared/SentimentBar";
import TagCloud from "@/components/shared/TagCloud";
import { ArrowLeft, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { apiFetch } from "@/lib/api";
import { findCreatorNiche, findCreatorVideoMatch } from "@/lib/creatorDerived";
import { useAnalysisRefreshShortcut } from "@/hooks/useAnalysisRefreshShortcut";
import { AnalysisLoader } from "@/components/shared/AnalysisLoader";

const tabs = ["Overview", "Content Similarity", "Similar Videos", "Thumbnail Analysis", "Viral Patterns", "Engagement"] as const;

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

interface CompetitorThumbnailAnalysis {
  available: boolean;
  facePresencePct: number;
  avgWordCount: number;
  dominantColors: string[];
  topOverlayWords: string[];
  averageBrightness: number;
  averageEdgeDensity: number;
  compositionBias: string;
  referenceVideos: { id: string; title: string; thumbnailUrl: string; views: number }[];
}

export default function CompetitorDetailPage() {
  const { competitorId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Overview");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const forceOverviewRefresh = useRef(false);
  const forceThumbnailRefresh = useRef(false);
  const { data: comp, isLoading, error } = useQuery<CompetitorDetail>({
    queryKey: ["competitor_detail", competitorId, refreshVersion],
    queryFn: async () => {
      const forceSuffix = forceOverviewRefresh.current ? "?force=true" : "";
      const res = await apiFetch(`/competitors/${competitorId}/overview${forceSuffix}`);
      forceOverviewRefresh.current = false;
      if (!res.ok) throw new Error("Failed to load competitor details");
      return res.json();
    },
    enabled: !!competitorId,
  });
  const { data: thumbnailAnalysis } = useQuery<CompetitorThumbnailAnalysis>({
    queryKey: ["competitor_thumbnail_analysis", competitorId, refreshVersion],
    queryFn: async () => {
      const forceSuffix = forceThumbnailRefresh.current ? "?force=true" : "";
      const res = await apiFetch(`/competitors/${competitorId}/thumbnails${forceSuffix}`);
      forceThumbnailRefresh.current = false;
      if (!res.ok) throw new Error("Failed to load thumbnail analysis");
      return res.json();
    },
    enabled: !!competitorId,
  });
  useAnalysisRefreshShortcut({
    label: "competitor analysis",
    onRefresh: () => {
      forceOverviewRefresh.current = true;
      forceThumbnailRefresh.current = true;
      setRefreshVersion((value) => value + 1);
    },
    enabled: !!competitorId,
  });

  if (isLoading) {
    return (
      <AnalysisLoader
        className="min-h-[52vh]"
        eyebrow="Competitor X-Ray"
        title="Extracting competitor blueprint"
        subtitle="The engine is tearing down their video history, clustering their formats, and scoring them against your audience signals."
        steps={[
          "Fetching full public video history",
          "Running cluster analysis on their catalog",
          "Sampling comments for audience sentiment",
          "Building similarity and viral pattern maps",
        ]}
      />
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
        <button onClick={() => navigate("/app/competitors")} className="p-1.5 rounded-md hover:bg-accent transition-colors">
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
          <div className="stat-card overflow-x-auto">
            <h3 className="section-header">Their Top Videos vs Yours</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium w-1/2">Their Video</th>
                  <th className="pb-2 font-medium w-1/2 border-l border-border pl-4">Your Closest Match</th>
                </tr>
              </thead>
              <tbody>
                {comp.videos.map((cv) => {
                  const yourMatch = findCreatorVideoMatch({
                    nicheId: cv.nicheId,
                    nicheName: cv.nicheName,
                    title: cv.title,
                  });
                  return (
                    <tr key={cv.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="py-3 pr-4 align-top">
                        <div className="flex gap-3">
                          {cv.thumbnailUrl ? (
                            <img src={cv.thumbnailUrl} alt="" className="w-24 h-14 object-cover rounded-md shrink-0 border border-border" />
                          ) : (
                            <div className="w-24 h-14 bg-muted rounded-md shrink-0 border border-border flex items-center justify-center">
                              <PlayCircle className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-foreground font-medium line-clamp-2">{cv.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatNumber(cv.views)} views · {cv.duration}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pl-4 border-l border-border align-top">
                        {yourMatch ? (
                          <div className="flex gap-3">
                            <div className="w-24 h-14 bg-muted rounded-md shrink-0 border border-border overflow-hidden relative group">
                              <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors z-10" />
                              <div className="absolute inset-0 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
                                <PlayCircle className="h-6 w-6" />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-foreground font-medium line-clamp-2">{yourMatch.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{formatNumber(yourMatch.views)} views · {yourMatch.duration}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center h-14 text-muted-foreground italic text-xs">
                            No matching video found in your catalog.
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Viral Patterns */}
      {activeTab === "Thumbnail Analysis" && (
        <div className="space-y-6 animate-fade-in">
          {thumbnailAnalysis?.available ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="stat-card text-center">
                  <p className="stat-value">{thumbnailAnalysis.facePresencePct}%</p>
                  <p className="stat-label">Face Presence</p>
                </div>
                <div className="stat-card text-center">
                  <p className="stat-value">{thumbnailAnalysis.avgWordCount}</p>
                  <p className="stat-label">Avg OCR Words</p>
                </div>
                <div className="stat-card text-center">
                  <p className="stat-value">{thumbnailAnalysis.averageBrightness}%</p>
                  <p className="stat-label">Brightness</p>
                </div>
                <div className="stat-card text-center">
                  <p className="stat-value">{thumbnailAnalysis.averageEdgeDensity}%</p>
                  <p className="stat-label">Visual Density</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-4">
                <div className="stat-card">
                  <h3 className="section-header">Detected Style</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Composition Bias</p>
                      <p className="text-sm text-foreground mt-1">{thumbnailAnalysis.compositionBias}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dominant Colors</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {thumbnailAnalysis.dominantColors.map((color) => (
                          <div key={color} className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-2 py-1 text-xs text-foreground">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            {color}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Top Overlay Words</p>
                      <TagCloud tags={thumbnailAnalysis.topOverlayWords} />
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <h3 className="section-header">Reference Thumbnails</h3>
                  <div className="space-y-3">
                    {thumbnailAnalysis.referenceVideos.map((video) => (
                      <div key={video.id} className="flex items-center gap-3 rounded-lg bg-accent/30 p-3">
                        {video.thumbnailUrl ? (
                          <img src={video.thumbnailUrl} alt={video.title} className="w-16 h-16 rounded-md object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-accent" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground truncate">{video.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatNumber(video.views)} views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Thumbnail analysis is unavailable for this competitor.</p>
            </div>
          )}
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
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }} />
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
