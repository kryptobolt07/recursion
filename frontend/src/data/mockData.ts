// ============================================================
// MOCK DATA — Tech YouTube Channel "TechForge"
// ============================================================

export interface Niche {
  id: string;
  name: string;
  colorIndex: number;
  uploadShare: number;
  avgViews: number;
  avgLength: string;
  avgLengthMinutes: number;
  retention: number;
  viewShare: number;
  totalVideos: number;
  topVideos: Video[];
  subniches: Subniche[];
  sentiment: { positive: number; neutral: number; critical: number };
  contentDNA: ContentDNA;
  cadence: CadenceData;
  audience: AudienceData;
  healthSummary: string;
}

export interface Video {
  id: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  durationMinutes: number;
  publishDate: string;
  nicheId: string;
  thumbnailColor: string;
  engagement: number;
  isViral?: boolean;
}

export interface Subniche {
  name: string;
  avgViews: number;
  retention: number;
  uploadFrequency: string;
  growthTrend: "growing" | "stable" | "shrinking";
}

export interface ContentDNA {
  titlePatterns: {
    numbers: number;
    powerVerbs: number;
    questionFormat: number;
    howIStructure: number;
    avgWordCount: number;
    avgCharLength: number;
  };
  thumbnailStyle: {
    facePresent: number;
    boldTextOverlay: number;
    avgWordCount: number;
    dominantColors: string[];
  };
  videoLengthDist: { bucket: string; count: number }[];
  hookTypes: { type: string; percentage: number }[];
  ctaPattern: {
    asksForLikesSubs: number;
    avgTimestamp: string;
    consistency: number;
  };
}

export interface CadenceData {
  monthlyUploads: { month: string; count: number }[];
  uploadDayHeatmap: { day: string; count: number }[];
  avgGapDays: number;
  consistencyIndex: number;
  bestDay: string;
  cadenceDropCorrelation: boolean;
}

export interface AudienceData {
  sentiment: { positive: number; neutral: number; critical: number };
  sentimentSummary: string;
  viewerAsks: string[];
  praises: string[];
  complaints: string[];
  ageBreakdown: { band: string; percentage: number }[];
  countryBreakdown: { country: string; percentage: number }[];
  languageDistribution: { language: string; percentage: number }[];
}

export interface Competitor {
  id: string;
  name: string;
  handle: string;
  subscribers: number;
  avgViews: number;
  engagementRate: number;
  uploadFrequency: string;
  topNiche: string;
  similarityScore: number;
  discoveryReason: string;
  nicheMatchTags: string[];
  sharedNiches: string[];
  exclusiveNiches: string[];
  healthScore: number;
  videos: Video[];
  nicheDistribution: { nicheId: string; name: string; share: number; avgViews: number }[];
  thumbnailStyle: {
    facePresent: number;
    boldText: number;
    avgWordCount: number;
    dominantColors: string[];
    backgroundComplexity: "clean" | "moderate" | "busy";
  };
  viralVideos: Video[];
  engagementTrend: { month: string; rate: number }[];
  commentSentiment: { positive: number; neutral: number; critical: number };
  viewerAsks: string[];
}

export interface ChannelStats {
  name: string;
  handle: string;
  subscribers: number;
  totalVideos: number;
  avgViews: number;
  engagementRate: number;
  viewToSubRatio: number;
  uploadFrequency: string;
  healthScore: number;
  healthSubScores: {
    contentQuality: number;
    engagement: number;
    growthMomentum: number;
    consistency: number;
  };
}

// ============================================================
// CHANNEL
// ============================================================

export const channelStats: ChannelStats = {
  name: "TechForge",
  handle: "@TechForge",
  subscribers: 482000,
  totalVideos: 387,
  avgViews: 89200,
  engagementRate: 6.8,
  viewToSubRatio: 18.5,
  uploadFrequency: "3.2 videos/week",
  healthScore: 78,
  healthSubScores: {
    contentQuality: 82,
    engagement: 74,
    growthMomentum: 71,
    consistency: 85,
  },
};

// ============================================================
// NICHES
// ============================================================

export const niches: Niche[] = [
  {
    id: "linux",
    name: "Linux & OS",
    colorIndex: 1,
    uploadShare: 38,
    avgViews: 112000,
    avgLength: "14:22",
    avgLengthMinutes: 14.4,
    retention: 52,
    viewShare: 41,
    totalVideos: 147,
    topVideos: [
      { id: "v1", title: "I Switched to NixOS for 30 Days — Here's What Happened", views: 892000, likes: 34200, comments: 2810, duration: "18:42", durationMinutes: 18.7, publishDate: "2025-11-12", nicheId: "linux", thumbnailColor: "#e53935", engagement: 4.2, isViral: true },
      { id: "v2", title: "5 Linux Distros That Actually Respect Your Privacy", views: 541000, likes: 22100, comments: 1940, duration: "12:08", durationMinutes: 12.1, publishDate: "2025-09-28", nicheId: "linux", thumbnailColor: "#1e88e5", engagement: 4.4 },
      { id: "v3", title: "Why I Left Windows After 15 Years", views: 478000, likes: 19800, comments: 3210, duration: "16:33", durationMinutes: 16.6, publishDate: "2025-10-15", nicheId: "linux", thumbnailColor: "#43a047", engagement: 4.8 },
    ],
    subniches: [
      { name: "Distro Reviews", avgViews: 134000, retention: 48, uploadFrequency: "2/month", growthTrend: "stable" },
      { name: "Terminal Setup", avgViews: 98000, retention: 55, uploadFrequency: "1.5/month", growthTrend: "growing" },
      { name: "NixOS / Arch", avgViews: 156000, retention: 58, uploadFrequency: "1/month", growthTrend: "growing" },
      { name: "Window Managers", avgViews: 87000, retention: 61, uploadFrequency: "0.8/month", growthTrend: "stable" },
      { name: "Kernel Deep Dives", avgViews: 62000, retention: 44, uploadFrequency: "0.5/month", growthTrend: "shrinking" },
    ],
    sentiment: { positive: 72, neutral: 18, critical: 10 },
    contentDNA: {
      titlePatterns: { numbers: 42, powerVerbs: 68, questionFormat: 28, howIStructure: 35, avgWordCount: 9.2, avgCharLength: 52 },
      thumbnailStyle: { facePresent: 45, boldTextOverlay: 78, avgWordCount: 3.1, dominantColors: ["#e53935", "#1a1a1a", "#ffffff"] },
      videoLengthDist: [{ bucket: "<5m", count: 4 }, { bucket: "5–10m", count: 18 }, { bucket: "10–20m", count: 82 }, { bucket: "20–30m", count: 31 }, { bucket: "30m+", count: 12 }],
      hookTypes: [{ type: "Story", percentage: 38 }, { type: "Question", percentage: 28 }, { type: "Demo", percentage: 22 }, { type: "Shocking Stat", percentage: 12 }],
      ctaPattern: { asksForLikesSubs: 88, avgTimestamp: "11:42", consistency: 82 },
    },
    cadence: {
      monthlyUploads: [
        { month: "Jan", count: 5 }, { month: "Feb", count: 4 }, { month: "Mar", count: 6 },
        { month: "Apr", count: 5 }, { month: "May", count: 4 }, { month: "Jun", count: 5 },
        { month: "Jul", count: 3 }, { month: "Aug", count: 5 }, { month: "Sep", count: 6 },
        { month: "Oct", count: 5 }, { month: "Nov", count: 4 }, { month: "Dec", count: 3 },
      ],
      uploadDayHeatmap: [
        { day: "Mon", count: 12 }, { day: "Tue", count: 28 }, { day: "Wed", count: 8 },
        { day: "Thu", count: 22 }, { day: "Fri", count: 15 }, { day: "Sat", count: 5 }, { day: "Sun", count: 2 },
      ],
      avgGapDays: 4.8,
      consistencyIndex: 76,
      bestDay: "Tuesday",
      cadenceDropCorrelation: true,
    },
    audience: {
      sentiment: { positive: 72, neutral: 18, critical: 10 },
      sentimentSummary: "Audience is highly enthusiastic about NixOS and Arch content. Terminal setups get the most engaged comments.",
      viewerAsks: ["More NixOS tutorials", "Wayland setup guide", "Hyprland config", "Server hardening", "Distro for gaming"],
      praises: ["Deep technical content", "Honest reviews", "Great pacing", "No filler"],
      complaints: ["Too fast sometimes", "Need more beginner content", "Audio quality varies"],
      ageBreakdown: [
        { band: "13–17", percentage: 8 }, { band: "18–24", percentage: 34 },
        { band: "25–34", percentage: 38 }, { band: "35–44", percentage: 14 },
        { band: "45–54", percentage: 4 }, { band: "55+", percentage: 2 },
      ],
      countryBreakdown: [
        { country: "United States", percentage: 28 }, { country: "India", percentage: 18 },
        { country: "Germany", percentage: 12 }, { country: "United Kingdom", percentage: 9 },
        { country: "Brazil", percentage: 7 }, { country: "Canada", percentage: 6 },
      ],
      languageDistribution: [
        { language: "English", percentage: 74 }, { language: "Hindi", percentage: 8 },
        { language: "German", percentage: 6 }, { language: "Portuguese", percentage: 5 },
        { language: "Spanish", percentage: 4 }, { language: "Other", percentage: 3 },
      ],
    },
    healthSummary: "Linux & OS is your strongest niche — growing steadily with NixOS/Arch content leading performance. Terminal Setup is an emerging subniche worth doubling down on.",
  },
  {
    id: "hardware",
    name: "Hardware Reviews",
    colorIndex: 2,
    uploadShare: 27,
    avgViews: 134000,
    avgLength: "11:45",
    avgLengthMinutes: 11.75,
    retention: 46,
    viewShare: 38,
    totalVideos: 104,
    topVideos: [
      { id: "v4", title: "This $200 Mini PC Replaced My Desktop", views: 1240000, likes: 48200, comments: 3890, duration: "13:22", durationMinutes: 13.4, publishDate: "2025-08-14", nicheId: "hardware", thumbnailColor: "#ff6f00", engagement: 4.2, isViral: true },
      { id: "v5", title: "Framework Laptop 16 — 6 Months Later", views: 634000, likes: 28900, comments: 2140, duration: "15:08", durationMinutes: 15.1, publishDate: "2025-10-02", nicheId: "hardware", thumbnailColor: "#1e88e5", engagement: 4.9 },
      { id: "v6", title: "7 Gadgets I Can't Live Without in 2025", views: 412000, likes: 18700, comments: 1560, duration: "10:44", durationMinutes: 10.7, publishDate: "2025-12-01", nicheId: "hardware", thumbnailColor: "#e53935", engagement: 4.9 },
    ],
    subniches: [
      { name: "Mini PCs", avgViews: 178000, retention: 44, uploadFrequency: "1.5/month", growthTrend: "growing" },
      { name: "Laptops", avgViews: 142000, retention: 48, uploadFrequency: "1/month", growthTrend: "stable" },
      { name: "Peripherals", avgViews: 98000, retention: 42, uploadFrequency: "2/month", growthTrend: "stable" },
      { name: "DIY Builds", avgViews: 116000, retention: 51, uploadFrequency: "0.8/month", growthTrend: "growing" },
    ],
    sentiment: { positive: 68, neutral: 22, critical: 10 },
    contentDNA: {
      titlePatterns: { numbers: 55, powerVerbs: 72, questionFormat: 18, howIStructure: 22, avgWordCount: 7.8, avgCharLength: 46 },
      thumbnailStyle: { facePresent: 62, boldTextOverlay: 85, avgWordCount: 2.8, dominantColors: ["#ff6f00", "#1a1a1a", "#e53935"] },
      videoLengthDist: [{ bucket: "<5m", count: 2 }, { bucket: "5–10m", count: 28 }, { bucket: "10–20m", count: 58 }, { bucket: "20–30m", count: 12 }, { bucket: "30m+", count: 4 }],
      hookTypes: [{ type: "Demo", percentage: 42 }, { type: "Shocking Stat", percentage: 28 }, { type: "Story", percentage: 18 }, { type: "Question", percentage: 12 }],
      ctaPattern: { asksForLikesSubs: 92, avgTimestamp: "9:30", consistency: 88 },
    },
    cadence: {
      monthlyUploads: [
        { month: "Jan", count: 3 }, { month: "Feb", count: 3 }, { month: "Mar", count: 4 },
        { month: "Apr", count: 3 }, { month: "May", count: 3 }, { month: "Jun", count: 4 },
        { month: "Jul", count: 2 }, { month: "Aug", count: 3 }, { month: "Sep", count: 4 },
        { month: "Oct", count: 3 }, { month: "Nov", count: 3 }, { month: "Dec", count: 2 },
      ],
      uploadDayHeatmap: [
        { day: "Mon", count: 8 }, { day: "Tue", count: 12 }, { day: "Wed", count: 18 },
        { day: "Thu", count: 28 }, { day: "Fri", count: 14 }, { day: "Sat", count: 6 }, { day: "Sun", count: 2 },
      ],
      avgGapDays: 6.2,
      consistencyIndex: 68,
      bestDay: "Thursday",
      cadenceDropCorrelation: true,
    },
    audience: {
      sentiment: { positive: 68, neutral: 22, critical: 10 },
      sentimentSummary: "Audience values honest, no-BS reviews. Mini PC content drives the highest engagement and viewer retention.",
      viewerAsks: ["More budget builds", "Compare to Mac Mini", "NAS recommendations", "eGPU setups", "Thunderbolt docks"],
      praises: ["Honest opinions", "Good B-roll", "Practical tests", "No sponsored bias"],
      complaints: ["Need more benchmarks", "Affiliate links not disclosed enough", "Missing comparison tables"],
      ageBreakdown: [
        { band: "13–17", percentage: 5 }, { band: "18–24", percentage: 28 },
        { band: "25–34", percentage: 35 }, { band: "35–44", percentage: 22 },
        { band: "45–54", percentage: 7 }, { band: "55+", percentage: 3 },
      ],
      countryBreakdown: [
        { country: "United States", percentage: 34 }, { country: "India", percentage: 14 },
        { country: "United Kingdom", percentage: 11 }, { country: "Germany", percentage: 9 },
        { country: "Australia", percentage: 6 }, { country: "Canada", percentage: 5 },
      ],
      languageDistribution: [
        { language: "English", percentage: 82 }, { language: "Hindi", percentage: 6 },
        { language: "German", percentage: 4 }, { language: "Spanish", percentage: 3 },
        { language: "Other", percentage: 5 },
      ],
    },
    healthSummary: "Hardware Reviews punches above its weight — 27% of uploads driving 38% of views. Mini PCs and DIY Builds are your growth engines here.",
  },
  {
    id: "devtools",
    name: "Dev Tools & Workflow",
    colorIndex: 3,
    uploadShare: 18,
    avgViews: 67000,
    avgLength: "9:55",
    avgLengthMinutes: 9.9,
    retention: 58,
    viewShare: 12,
    totalVideos: 70,
    topVideos: [
      { id: "v7", title: "My 2025 Dev Setup — Tools I Use Every Day", views: 312000, likes: 14200, comments: 1240, duration: "14:22", durationMinutes: 14.4, publishDate: "2025-07-18", nicheId: "devtools", thumbnailColor: "#43a047", engagement: 5.0 },
      { id: "v8", title: "Neovim vs VS Code in 2025 — Honest Take", views: 245000, likes: 11800, comments: 2890, duration: "11:33", durationMinutes: 11.6, publishDate: "2025-09-05", nicheId: "devtools", thumbnailColor: "#1e88e5", engagement: 6.0 },
      { id: "v9", title: "Docker Compose for Beginners — Full Guide", views: 189000, likes: 8900, comments: 720, duration: "22:15", durationMinutes: 22.25, publishDate: "2025-06-22", nicheId: "devtools", thumbnailColor: "#0288d1", engagement: 5.1 },
    ],
    subniches: [
      { name: "Editor Configs", avgViews: 88000, retention: 62, uploadFrequency: "1/month", growthTrend: "growing" },
      { name: "DevOps / Docker", avgViews: 72000, retention: 54, uploadFrequency: "0.8/month", growthTrend: "stable" },
      { name: "Productivity", avgViews: 54000, retention: 56, uploadFrequency: "1.2/month", growthTrend: "stable" },
    ],
    sentiment: { positive: 78, neutral: 16, critical: 6 },
    contentDNA: {
      titlePatterns: { numbers: 38, powerVerbs: 58, questionFormat: 32, howIStructure: 45, avgWordCount: 8.4, avgCharLength: 48 },
      thumbnailStyle: { facePresent: 35, boldTextOverlay: 72, avgWordCount: 3.4, dominantColors: ["#43a047", "#1a1a1a", "#0288d1"] },
      videoLengthDist: [{ bucket: "<5m", count: 8 }, { bucket: "5–10m", count: 22 }, { bucket: "10–20m", count: 28 }, { bucket: "20–30m", count: 8 }, { bucket: "30m+", count: 4 }],
      hookTypes: [{ type: "Demo", percentage: 45 }, { type: "Story", percentage: 25 }, { type: "Question", percentage: 20 }, { type: "Shocking Stat", percentage: 10 }],
      ctaPattern: { asksForLikesSubs: 72, avgTimestamp: "8:15", consistency: 65 },
    },
    cadence: {
      monthlyUploads: [
        { month: "Jan", count: 2 }, { month: "Feb", count: 2 }, { month: "Mar", count: 3 },
        { month: "Apr", count: 2 }, { month: "May", count: 2 }, { month: "Jun", count: 2 },
        { month: "Jul", count: 1 }, { month: "Aug", count: 2 }, { month: "Sep", count: 3 },
        { month: "Oct", count: 2 }, { month: "Nov", count: 2 }, { month: "Dec", count: 1 },
      ],
      uploadDayHeatmap: [
        { day: "Mon", count: 14 }, { day: "Tue", count: 18 }, { day: "Wed", count: 12 },
        { day: "Thu", count: 8 }, { day: "Fri", count: 10 }, { day: "Sat", count: 4 }, { day: "Sun", count: 2 },
      ],
      avgGapDays: 8.5,
      consistencyIndex: 55,
      bestDay: "Tuesday",
      cadenceDropCorrelation: false,
    },
    audience: {
      sentiment: { positive: 78, neutral: 16, critical: 6 },
      sentimentSummary: "Highly technical audience that values depth. Editor config content sparks the most discussion and loyalty.",
      viewerAsks: ["Tmux setup", "Git workflow", "CI/CD for solo devs", "Rust tooling", "Self-hosted alternatives"],
      praises: ["Best dev content on YouTube", "Practical and no fluff", "Great explanations"],
      complaints: ["Uploads too infrequent", "Need more beginner-friendly versions", "Audio could be better"],
      ageBreakdown: [
        { band: "13–17", percentage: 4 }, { band: "18–24", percentage: 32 },
        { band: "25–34", percentage: 42 }, { band: "35–44", percentage: 16 },
        { band: "45–54", percentage: 4 }, { band: "55+", percentage: 2 },
      ],
      countryBreakdown: [
        { country: "United States", percentage: 30 }, { country: "India", percentage: 22 },
        { country: "Germany", percentage: 10 }, { country: "United Kingdom", percentage: 8 },
        { country: "Poland", percentage: 5 }, { country: "Netherlands", percentage: 4 },
      ],
      languageDistribution: [
        { language: "English", percentage: 70 }, { language: "Hindi", percentage: 10 },
        { language: "German", percentage: 6 }, { language: "Polish", percentage: 4 },
        { language: "Other", percentage: 10 },
      ],
    },
    healthSummary: "Dev Tools has the highest retention rate but underperforms on views. Increasing upload cadence could unlock significant growth — the audience is loyal but underserved.",
  },
  {
    id: "privacy",
    name: "Privacy & Security",
    colorIndex: 4,
    uploadShare: 10,
    avgViews: 52000,
    avgLength: "12:18",
    avgLengthMinutes: 12.3,
    retention: 49,
    viewShare: 5,
    totalVideos: 39,
    topVideos: [
      { id: "v10", title: "Stop Using These 5 Apps — They're Spying on You", views: 678000, likes: 28100, comments: 3420, duration: "11:22", durationMinutes: 11.4, publishDate: "2025-05-10", nicheId: "privacy", thumbnailColor: "#ffa000", engagement: 4.7, isViral: true },
      { id: "v11", title: "GrapheneOS Changed How I Think About Phones", views: 198000, likes: 9200, comments: 1120, duration: "14:08", durationMinutes: 14.1, publishDate: "2025-08-22", nicheId: "privacy", thumbnailColor: "#43a047", engagement: 5.2 },
      { id: "v12", title: "Self-Hosted Email in 2025 — Is It Worth It?", views: 145000, likes: 7100, comments: 890, duration: "18:44", durationMinutes: 18.7, publishDate: "2025-11-04", nicheId: "privacy", thumbnailColor: "#1e88e5", engagement: 5.5 },
    ],
    subniches: [
      { name: "App Alternatives", avgViews: 98000, retention: 44, uploadFrequency: "0.5/month", growthTrend: "growing" },
      { name: "Mobile Privacy", avgViews: 62000, retention: 52, uploadFrequency: "0.4/month", growthTrend: "stable" },
      { name: "Self-Hosting", avgViews: 48000, retention: 55, uploadFrequency: "0.3/month", growthTrend: "growing" },
    ],
    sentiment: { positive: 65, neutral: 20, critical: 15 },
    contentDNA: {
      titlePatterns: { numbers: 48, powerVerbs: 72, questionFormat: 35, howIStructure: 18, avgWordCount: 8.8, avgCharLength: 50 },
      thumbnailStyle: { facePresent: 52, boldTextOverlay: 82, avgWordCount: 3.6, dominantColors: ["#ffa000", "#e53935", "#1a1a1a"] },
      videoLengthDist: [{ bucket: "<5m", count: 1 }, { bucket: "5–10m", count: 8 }, { bucket: "10–20m", count: 22 }, { bucket: "20–30m", count: 6 }, { bucket: "30m+", count: 2 }],
      hookTypes: [{ type: "Shocking Stat", percentage: 42 }, { type: "Question", percentage: 28 }, { type: "Story", percentage: 20 }, { type: "Demo", percentage: 10 }],
      ctaPattern: { asksForLikesSubs: 78, avgTimestamp: "10:15", consistency: 72 },
    },
    cadence: {
      monthlyUploads: [
        { month: "Jan", count: 1 }, { month: "Feb", count: 1 }, { month: "Mar", count: 1 },
        { month: "Apr", count: 1 }, { month: "May", count: 2 }, { month: "Jun", count: 1 },
        { month: "Jul", count: 1 }, { month: "Aug", count: 1 }, { month: "Sep", count: 1 },
        { month: "Oct", count: 1 }, { month: "Nov", count: 1 }, { month: "Dec", count: 1 },
      ],
      uploadDayHeatmap: [
        { day: "Mon", count: 4 }, { day: "Tue", count: 6 }, { day: "Wed", count: 8 },
        { day: "Thu", count: 4 }, { day: "Fri", count: 8 }, { day: "Sat", count: 2 }, { day: "Sun", count: 1 },
      ],
      avgGapDays: 12,
      consistencyIndex: 42,
      bestDay: "Wednesday",
      cadenceDropCorrelation: false,
    },
    audience: {
      sentiment: { positive: 65, neutral: 20, critical: 15 },
      sentimentSummary: "Privacy-focused audience is passionate but polarized. App alternatives content goes viral but retention on deep dives is lower.",
      viewerAsks: ["VPN comparisons", "Degoogle guide", "Private cloud storage", "Password manager review", "Threat modeling basics"],
      praises: ["Important topics", "Well-researched", "Actionable advice"],
      complaints: ["Too paranoid sometimes", "Solutions too complex for average user", "Need Windows alternatives"],
      ageBreakdown: [
        { band: "13–17", percentage: 6 }, { band: "18–24", percentage: 26 },
        { band: "25–34", percentage: 36 }, { band: "35–44", percentage: 20 },
        { band: "45–54", percentage: 8 }, { band: "55+", percentage: 4 },
      ],
      countryBreakdown: [
        { country: "United States", percentage: 32 }, { country: "Germany", percentage: 16 },
        { country: "United Kingdom", percentage: 10 }, { country: "Canada", percentage: 8 },
        { country: "Netherlands", percentage: 6 }, { country: "Australia", percentage: 5 },
      ],
      languageDistribution: [
        { language: "English", percentage: 78 }, { language: "German", percentage: 8 },
        { language: "Dutch", percentage: 3 }, { language: "French", percentage: 3 },
        { language: "Other", percentage: 8 },
      ],
    },
    healthSummary: "Privacy content has viral potential but low consistency. The 'App Alternatives' subniche is an untapped goldmine — increase frequency to capitalize on audience demand.",
  },
  {
    id: "ai",
    name: "AI & Machine Learning",
    colorIndex: 5,
    uploadShare: 7,
    avgViews: 78000,
    avgLength: "10:30",
    avgLengthMinutes: 10.5,
    retention: 44,
    viewShare: 4,
    totalVideos: 27,
    topVideos: [
      { id: "v13", title: "Local LLMs Are Getting Scary Good", views: 445000, likes: 18900, comments: 2140, duration: "12:44", durationMinutes: 12.7, publishDate: "2025-10-28", nicheId: "ai", thumbnailColor: "#7b1fa2", engagement: 4.7, isViral: true },
      { id: "v14", title: "Run GPT-4 Level AI on Your Laptop — No Cloud Needed", views: 289000, likes: 12400, comments: 1560, duration: "14:18", durationMinutes: 14.3, publishDate: "2025-12-10", nicheId: "ai", thumbnailColor: "#e53935", engagement: 4.8 },
      { id: "v15", title: "AI Coding Tools Ranked — Which One Actually Works?", views: 167000, likes: 7800, comments: 1890, duration: "18:22", durationMinutes: 18.4, publishDate: "2025-09-15", nicheId: "ai", thumbnailColor: "#1e88e5", engagement: 5.8 },
    ],
    subniches: [
      { name: "Local LLMs", avgViews: 128000, retention: 46, uploadFrequency: "0.5/month", growthTrend: "growing" },
      { name: "AI Tools", avgViews: 72000, retention: 42, uploadFrequency: "0.8/month", growthTrend: "growing" },
    ],
    sentiment: { positive: 62, neutral: 24, critical: 14 },
    contentDNA: {
      titlePatterns: { numbers: 35, powerVerbs: 78, questionFormat: 22, howIStructure: 28, avgWordCount: 8.2, avgCharLength: 48 },
      thumbnailStyle: { facePresent: 55, boldTextOverlay: 88, avgWordCount: 3.2, dominantColors: ["#7b1fa2", "#e53935", "#1a1a1a"] },
      videoLengthDist: [{ bucket: "<5m", count: 2 }, { bucket: "5–10m", count: 6 }, { bucket: "10–20m", count: 14 }, { bucket: "20–30m", count: 4 }, { bucket: "30m+", count: 1 }],
      hookTypes: [{ type: "Demo", percentage: 48 }, { type: "Shocking Stat", percentage: 32 }, { type: "Question", percentage: 12 }, { type: "Story", percentage: 8 }],
      ctaPattern: { asksForLikesSubs: 85, avgTimestamp: "9:45", consistency: 78 },
    },
    cadence: {
      monthlyUploads: [
        { month: "Jan", count: 1 }, { month: "Feb", count: 0 }, { month: "Mar", count: 1 },
        { month: "Apr", count: 1 }, { month: "May", count: 1 }, { month: "Jun", count: 0 },
        { month: "Jul", count: 1 }, { month: "Aug", count: 1 }, { month: "Sep", count: 1 },
        { month: "Oct", count: 1 }, { month: "Nov", count: 0 }, { month: "Dec", count: 1 },
      ],
      uploadDayHeatmap: [
        { day: "Mon", count: 6 }, { day: "Tue", count: 4 }, { day: "Wed", count: 6 },
        { day: "Thu", count: 4 }, { day: "Fri", count: 4 }, { day: "Sat", count: 2 }, { day: "Sun", count: 1 },
      ],
      avgGapDays: 14,
      consistencyIndex: 38,
      bestDay: "Monday",
      cadenceDropCorrelation: false,
    },
    audience: {
      sentiment: { positive: 62, neutral: 24, critical: 14 },
      sentimentSummary: "AI content attracts a broad audience but also skeptics. Local LLM content resonates deeply with the core tech audience.",
      viewerAsks: ["Ollama tutorials", "Fine-tuning guide", "AI for productivity", "RAG setup", "Best open models"],
      praises: ["Practical AI coverage", "Not overhyped", "Real benchmarks"],
      complaints: ["Too advanced for beginners", "Need more use cases", "Clickbaity titles"],
      ageBreakdown: [
        { band: "13–17", percentage: 6 }, { band: "18–24", percentage: 30 },
        { band: "25–34", percentage: 38 }, { band: "35–44", percentage: 18 },
        { band: "45–54", percentage: 6 }, { band: "55+", percentage: 2 },
      ],
      countryBreakdown: [
        { country: "United States", percentage: 30 }, { country: "India", percentage: 20 },
        { country: "United Kingdom", percentage: 8 }, { country: "Germany", percentage: 8 },
        { country: "Japan", percentage: 5 }, { country: "Brazil", percentage: 5 },
      ],
      languageDistribution: [
        { language: "English", percentage: 72 }, { language: "Hindi", percentage: 10 },
        { language: "Japanese", percentage: 4 }, { language: "German", percentage: 4 },
        { language: "Other", percentage: 10 },
      ],
    },
    healthSummary: "AI content is your fastest-growing niche by view velocity. Local LLMs are a massive opportunity — increasing cadence from 0.5 to 2/month could 3× view contribution.",
  },
];

// ============================================================
// COMPETITORS
// ============================================================

export const competitors: Competitor[] = [
  {
    id: "c1",
    name: "LinuxCraft",
    handle: "@LinuxCraft",
    subscribers: 620000,
    avgViews: 142000,
    engagementRate: 5.8,
    uploadFrequency: "4.1 videos/week",
    topNiche: "Linux & OS",
    similarityScore: 89,
    discoveryReason: "Shares 4 of 5 niches, overlapping keyword density 82%",
    nicheMatchTags: ["Linux & OS", "Dev Tools", "Privacy & Security", "Hardware Reviews"],
    sharedNiches: ["Linux & OS", "Hardware Reviews", "Dev Tools & Workflow", "Privacy & Security"],
    exclusiveNiches: ["Server Administration"],
    healthScore: 82,
    videos: [
      { id: "cv1", title: "Arch Linux Install Guide 2025 — The Right Way", views: 890000, likes: 34500, comments: 2890, duration: "22:15", durationMinutes: 22.25, publishDate: "2025-10-05", nicheId: "linux", thumbnailColor: "#1e88e5", engagement: 4.2 },
      { id: "cv2", title: "Why Everyone Is Switching to Fedora", views: 567000, likes: 22100, comments: 1940, duration: "14:33", durationMinutes: 14.55, publishDate: "2025-11-18", nicheId: "linux", thumbnailColor: "#0288d1", engagement: 4.2 },
      { id: "cv3", title: "The Best Mechanical Keyboards for Developers", views: 412000, likes: 18700, comments: 1560, duration: "12:08", durationMinutes: 12.13, publishDate: "2025-09-22", nicheId: "hardware", thumbnailColor: "#e53935", engagement: 4.9 },
    ],
    nicheDistribution: [
      { nicheId: "linux", name: "Linux & OS", share: 48, avgViews: 156000 },
      { nicheId: "hardware", name: "Hardware Reviews", share: 22, avgViews: 134000 },
      { nicheId: "devtools", name: "Dev Tools", share: 15, avgViews: 88000 },
      { nicheId: "privacy", name: "Privacy & Security", share: 10, avgViews: 72000 },
      { nicheId: "server", name: "Server Admin", share: 5, avgViews: 45000 },
    ],
    thumbnailStyle: {
      facePresent: 38,
      boldText: 72,
      avgWordCount: 2.8,
      dominantColors: ["#1e88e5", "#0288d1", "#1a1a1a"],
      backgroundComplexity: "clean",
    },
    viralVideos: [
      { id: "cv1", title: "Arch Linux Install Guide 2025 — The Right Way", views: 890000, likes: 34500, comments: 2890, duration: "22:15", durationMinutes: 22.25, publishDate: "2025-10-05", nicheId: "linux", thumbnailColor: "#1e88e5", engagement: 4.2, isViral: true },
    ],
    engagementTrend: [
      { month: "Jan", rate: 5.2 }, { month: "Feb", rate: 5.4 }, { month: "Mar", rate: 5.6 },
      { month: "Apr", rate: 5.3 }, { month: "May", rate: 5.8 }, { month: "Jun", rate: 5.5 },
      { month: "Jul", rate: 5.9 }, { month: "Aug", rate: 6.1 }, { month: "Sep", rate: 5.7 },
      { month: "Oct", rate: 5.8 }, { month: "Nov", rate: 5.6 }, { month: "Dec", rate: 5.8 },
    ],
    commentSentiment: { positive: 70, neutral: 20, critical: 10 },
    viewerAsks: ["More Nix content", "Gentoo coverage", "Wayland deep dive", "Server tutorials"],
  },
  {
    id: "c2",
    name: "Hardware Unboxed",
    handle: "@HWUnboxed",
    subscribers: 1840000,
    avgViews: 312000,
    engagementRate: 4.2,
    uploadFrequency: "5.8 videos/week",
    topNiche: "Hardware Reviews",
    similarityScore: 72,
    discoveryReason: "Shares 2 of 5 niches, subscriber overlap detected",
    nicheMatchTags: ["Hardware Reviews", "Dev Tools"],
    sharedNiches: ["Hardware Reviews"],
    exclusiveNiches: ["Gaming Hardware", "Monitors", "Cooling Solutions"],
    healthScore: 88,
    videos: [
      { id: "cv4", title: "RTX 5070 vs RX 9070 — Complete Benchmark", views: 2100000, likes: 82000, comments: 5670, duration: "28:44", durationMinutes: 28.73, publishDate: "2025-11-22", nicheId: "hardware", thumbnailColor: "#43a047", engagement: 4.2, isViral: true },
      { id: "cv5", title: "Best Budget Monitor 2025 — $200 and Under", views: 890000, likes: 34200, comments: 2340, duration: "18:12", durationMinutes: 18.2, publishDate: "2025-10-08", nicheId: "hardware", thumbnailColor: "#e53935", engagement: 4.1 },
      { id: "cv6", title: "This Cooler Changed Everything", views: 678000, likes: 28900, comments: 1890, duration: "14:55", durationMinutes: 14.92, publishDate: "2025-12-01", nicheId: "hardware", thumbnailColor: "#1e88e5", engagement: 4.5 },
    ],
    nicheDistribution: [
      { nicheId: "hardware", name: "Hardware Reviews", share: 65, avgViews: 342000 },
      { nicheId: "gaming", name: "Gaming Hardware", share: 20, avgViews: 278000 },
      { nicheId: "monitors", name: "Monitors", share: 10, avgViews: 198000 },
      { nicheId: "cooling", name: "Cooling Solutions", share: 5, avgViews: 145000 },
    ],
    thumbnailStyle: {
      facePresent: 22,
      boldText: 92,
      avgWordCount: 3.4,
      dominantColors: ["#e53935", "#43a047", "#ff6f00"],
      backgroundComplexity: "busy",
    },
    viralVideos: [
      { id: "cv4", title: "RTX 5070 vs RX 9070 — Complete Benchmark", views: 2100000, likes: 82000, comments: 5670, duration: "28:44", durationMinutes: 28.73, publishDate: "2025-11-22", nicheId: "hardware", thumbnailColor: "#43a047", engagement: 4.2, isViral: true },
    ],
    engagementTrend: [
      { month: "Jan", rate: 4.0 }, { month: "Feb", rate: 4.1 }, { month: "Mar", rate: 4.3 },
      { month: "Apr", rate: 4.0 }, { month: "May", rate: 4.2 }, { month: "Jun", rate: 4.1 },
      { month: "Jul", rate: 4.4 }, { month: "Aug", rate: 4.2 }, { month: "Sep", rate: 4.3 },
      { month: "Oct", rate: 4.1 }, { month: "Nov", rate: 4.2 }, { month: "Dec", rate: 4.2 },
    ],
    commentSentiment: { positive: 65, neutral: 25, critical: 10 },
    viewerAsks: ["More budget options", "Laptop reviews", "Cable management", "Used market guides"],
  },
  {
    id: "c3",
    name: "The Privacy Dad",
    handle: "@PrivacyDad",
    subscribers: 185000,
    avgViews: 48000,
    engagementRate: 8.2,
    uploadFrequency: "1.8 videos/week",
    topNiche: "Privacy & Security",
    similarityScore: 68,
    discoveryReason: "Overlapping keyword density 74%, shared audience behavior",
    nicheMatchTags: ["Privacy & Security", "Linux & OS"],
    sharedNiches: ["Privacy & Security", "Linux & OS"],
    exclusiveNiches: ["Family Tech"],
    healthScore: 74,
    videos: [
      { id: "cv7", title: "How I Degoogled My Entire Family", views: 342000, likes: 18200, comments: 2140, duration: "22:33", durationMinutes: 22.55, publishDate: "2025-08-15", nicheId: "privacy", thumbnailColor: "#ffa000", engagement: 5.9, isViral: true },
      { id: "cv8", title: "The Best Private Messengers — Ranked", views: 198000, likes: 9800, comments: 1560, duration: "16:44", durationMinutes: 16.73, publishDate: "2025-10-22", nicheId: "privacy", thumbnailColor: "#43a047", engagement: 5.7 },
      { id: "cv9", title: "Linux Mint for Privacy — Complete Setup", views: 145000, likes: 7200, comments: 890, duration: "28:18", durationMinutes: 28.3, publishDate: "2025-09-08", nicheId: "linux", thumbnailColor: "#1e88e5", engagement: 5.6 },
    ],
    nicheDistribution: [
      { nicheId: "privacy", name: "Privacy & Security", share: 55, avgViews: 52000 },
      { nicheId: "linux", name: "Linux & OS", share: 30, avgViews: 44000 },
      { nicheId: "family", name: "Family Tech", share: 15, avgViews: 38000 },
    ],
    thumbnailStyle: {
      facePresent: 68,
      boldText: 65,
      avgWordCount: 3.8,
      dominantColors: ["#ffa000", "#43a047", "#ffffff"],
      backgroundComplexity: "clean",
    },
    viralVideos: [
      { id: "cv7", title: "How I Degoogled My Entire Family", views: 342000, likes: 18200, comments: 2140, duration: "22:33", durationMinutes: 22.55, publishDate: "2025-08-15", nicheId: "privacy", thumbnailColor: "#ffa000", engagement: 5.9, isViral: true },
    ],
    engagementTrend: [
      { month: "Jan", rate: 7.5 }, { month: "Feb", rate: 7.8 }, { month: "Mar", rate: 8.0 },
      { month: "Apr", rate: 7.6 }, { month: "May", rate: 8.2 }, { month: "Jun", rate: 8.1 },
      { month: "Jul", rate: 8.4 }, { month: "Aug", rate: 8.5 }, { month: "Sep", rate: 8.2 },
      { month: "Oct", rate: 8.0 }, { month: "Nov", rate: 8.2 }, { month: "Dec", rate: 8.2 },
    ],
    commentSentiment: { positive: 82, neutral: 12, critical: 6 },
    viewerAsks: ["Family-safe browser", "Kids' privacy", "Parental controls on Linux", "Simple degoogle steps"],
  },
  {
    id: "c4",
    name: "CodeStacked",
    handle: "@CodeStacked",
    subscribers: 340000,
    avgViews: 95000,
    engagementRate: 7.1,
    uploadFrequency: "2.5 videos/week",
    topNiche: "Dev Tools & Workflow",
    similarityScore: 78,
    discoveryReason: "Shares 3 of 5 niches, keyword co-occurrence 78%",
    nicheMatchTags: ["Dev Tools & Workflow", "Linux & OS", "AI & Machine Learning"],
    sharedNiches: ["Dev Tools & Workflow", "Linux & OS", "AI & Machine Learning"],
    exclusiveNiches: ["Web Development"],
    healthScore: 80,
    videos: [
      { id: "cv10", title: "My Terminal Setup Is Faster Than Your IDE", views: 512000, likes: 24200, comments: 3120, duration: "16:22", durationMinutes: 16.37, publishDate: "2025-11-05", nicheId: "devtools", thumbnailColor: "#43a047", engagement: 5.3, isViral: true },
      { id: "cv11", title: "Cursor AI vs GitHub Copilot — Real Coding Test", views: 389000, likes: 18900, comments: 2670, duration: "18:44", durationMinutes: 18.73, publishDate: "2025-10-18", nicheId: "ai", thumbnailColor: "#7b1fa2", engagement: 5.5 },
      { id: "cv12", title: "Nix Flakes for Real Projects — Practical Guide", views: 234000, likes: 11200, comments: 1450, duration: "24:33", durationMinutes: 24.55, publishDate: "2025-09-28", nicheId: "linux", thumbnailColor: "#0288d1", engagement: 5.4 },
    ],
    nicheDistribution: [
      { nicheId: "devtools", name: "Dev Tools & Workflow", share: 40, avgViews: 108000 },
      { nicheId: "linux", name: "Linux & OS", share: 25, avgViews: 82000 },
      { nicheId: "ai", name: "AI & Machine Learning", share: 20, avgViews: 95000 },
      { nicheId: "webdev", name: "Web Development", share: 15, avgViews: 72000 },
    ],
    thumbnailStyle: {
      facePresent: 42,
      boldText: 78,
      avgWordCount: 3.2,
      dominantColors: ["#43a047", "#7b1fa2", "#1a1a1a"],
      backgroundComplexity: "moderate",
    },
    viralVideos: [
      { id: "cv10", title: "My Terminal Setup Is Faster Than Your IDE", views: 512000, likes: 24200, comments: 3120, duration: "16:22", durationMinutes: 16.37, publishDate: "2025-11-05", nicheId: "devtools", thumbnailColor: "#43a047", engagement: 5.3, isViral: true },
    ],
    engagementTrend: [
      { month: "Jan", rate: 6.5 }, { month: "Feb", rate: 6.8 }, { month: "Mar", rate: 7.0 },
      { month: "Apr", rate: 6.8 }, { month: "May", rate: 7.1 }, { month: "Jun", rate: 7.0 },
      { month: "Jul", rate: 7.3 }, { month: "Aug", rate: 7.2 }, { month: "Sep", rate: 7.1 },
      { month: "Oct", rate: 7.0 }, { month: "Nov", rate: 7.1 }, { month: "Dec", rate: 7.1 },
    ],
    commentSentiment: { positive: 75, neutral: 18, critical: 7 },
    viewerAsks: ["More Neovim plugins", "Rust ecosystem", "Full-stack setup", "CI/CD deep dives"],
  },
  {
    id: "c5",
    name: "AI Forge",
    handle: "@AIForge",
    subscribers: 890000,
    avgViews: 245000,
    engagementRate: 5.4,
    uploadFrequency: "3.8 videos/week",
    topNiche: "AI & Machine Learning",
    similarityScore: 62,
    discoveryReason: "Overlapping AI content, growing audience crossover",
    nicheMatchTags: ["AI & Machine Learning", "Dev Tools"],
    sharedNiches: ["AI & Machine Learning"],
    exclusiveNiches: ["AI News", "Prompt Engineering", "AI Art"],
    healthScore: 85,
    videos: [
      { id: "cv13", title: "GPT-5 Is Here — Everything You Need to Know", views: 1890000, likes: 72000, comments: 8900, duration: "14:22", durationMinutes: 14.37, publishDate: "2025-12-08", nicheId: "ai", thumbnailColor: "#7b1fa2", engagement: 4.3, isViral: true },
      { id: "cv14", title: "Build Your Own AI Agent in 30 Minutes", views: 678000, likes: 28900, comments: 3450, duration: "32:18", durationMinutes: 32.3, publishDate: "2025-11-15", nicheId: "ai", thumbnailColor: "#e53935", engagement: 4.8 },
      { id: "cv15", title: "The Best Open Source AI Models — 2025 Tier List", views: 542000, likes: 22100, comments: 2780, duration: "20:44", durationMinutes: 20.73, publishDate: "2025-10-28", nicheId: "ai", thumbnailColor: "#1e88e5", engagement: 4.6 },
    ],
    nicheDistribution: [
      { nicheId: "ai", name: "AI & Machine Learning", share: 60, avgViews: 278000 },
      { nicheId: "ainews", name: "AI News", share: 20, avgViews: 198000 },
      { nicheId: "prompt", name: "Prompt Engineering", share: 12, avgViews: 145000 },
      { nicheId: "aiart", name: "AI Art", share: 8, avgViews: 112000 },
    ],
    thumbnailStyle: {
      facePresent: 72,
      boldText: 90,
      avgWordCount: 2.6,
      dominantColors: ["#7b1fa2", "#e53935", "#ff6f00"],
      backgroundComplexity: "busy",
    },
    viralVideos: [
      { id: "cv13", title: "GPT-5 Is Here — Everything You Need to Know", views: 1890000, likes: 72000, comments: 8900, duration: "14:22", durationMinutes: 14.37, publishDate: "2025-12-08", nicheId: "ai", thumbnailColor: "#7b1fa2", engagement: 4.3, isViral: true },
    ],
    engagementTrend: [
      { month: "Jan", rate: 4.8 }, { month: "Feb", rate: 5.0 }, { month: "Mar", rate: 5.2 },
      { month: "Apr", rate: 5.0 }, { month: "May", rate: 5.4 }, { month: "Jun", rate: 5.2 },
      { month: "Jul", rate: 5.5 }, { month: "Aug", rate: 5.3 }, { month: "Sep", rate: 5.4 },
      { month: "Oct", rate: 5.2 }, { month: "Nov", rate: 5.4 }, { month: "Dec", rate: 5.4 },
    ],
    commentSentiment: { positive: 60, neutral: 26, critical: 14 },
    viewerAsks: ["Local deployment", "Fine-tuning tutorials", "AI for non-coders", "Model comparison"],
  },
];

// Strategy data
export const strategyReport = {
  currentMix: niches.map(n => ({ name: n.name, share: n.uploadShare })),
  suggestedMix: [
    { name: "Linux & OS", share: 42 },
    { name: "Hardware Reviews", share: 24 },
    { name: "Dev Tools & Workflow", share: 14 },
    { name: "Privacy & Security", share: 8 },
    { name: "AI & Machine Learning", share: 12 },
  ],
  roadmap: {
    phase1: {
      title: "Quick Wins (0–30 days)",
      actions: [
        "Post Linux & Hardware content on Tuesdays and Thursdays — your highest-performing days",
        "Rewrite your 10 lowest-performing titles using the number + power verb formula",
        "Add face to thumbnails in Hardware niche — competitors with faces see 1.4× more clicks",
        "Reduce average gap between uploads from 5.8 to 4 days",
      ],
    },
    phase2: {
      title: "Content Shifts (31–60 days)",
      actions: [
        "Double AI & ML upload frequency — Local LLMs subniche is your fastest-growing topic",
        "Launch a Terminal Setup series in Dev Tools — high retention, loyal audience",
        "Test red/black high-contrast thumbnails in Hardware (competitors' winning style)",
        "Create a 'Degoogle Guide' video — top viewer ask across Privacy niche",
      ],
    },
    phase3: {
      title: "Strategic Bets (61–90 days)",
      actions: [
        "Enter Server Administration subniche — LinuxCraft's gap that overlaps with your audience",
        "Experiment with 30m+ deep-dive format in Linux — Kernel Deep Dives retention is surprisingly high",
        "Collaborate with CodeStacked on a Nix Flakes crossover video",
        "Launch weekly Shorts series covering AI tool quick reviews",
      ],
    },
  },
  nicheRecommendations: [
    { niche: "Linux & OS", change: "+4%", reason: "Generates 41% of views on 38% of uploads. NixOS and Wayland content have unmet demand." },
    { niche: "Hardware Reviews", change: "-3%", reason: "Already efficient. Maintain quality but redirect surplus uploads to AI." },
    { niche: "AI & Machine Learning", change: "+5%", reason: "Fastest-growing niche by view velocity. Local LLMs are a massive opportunity." },
    { niche: "Dev Tools & Workflow", change: "-4%", reason: "Highest retention but lowest views. Maintain quality, reduce volume slightly." },
    { niche: "Privacy & Security", change: "-2%", reason: "Keep viral App Alternatives content, reduce deep dives with lower ROI." },
  ],
};

export const videoIdeas = [
  { id: "vi1", title: "7 NixOS Modules That Transformed My System", niche: "Linux & OS", subniche: "NixOS / Arch", rationale: "NixOS is your fastest-growing subniche with 156K avg views. Audience has been requesting more Nix content consistently.", competition: "low" as const, suggestedLength: "14–18 min", urgency: "Evergreen" as const },
  { id: "vi2", title: "I Replaced Docker with Nix — Here's Why", niche: "Linux & OS", subniche: "NixOS / Arch", rationale: "Cross-pollination between your two strongest niches. CodeStacked's Nix video hit 234K — validates demand.", competition: "low" as const, suggestedLength: "16–20 min", urgency: "Evergreen" as const },
  { id: "vi3", title: "The $150 Mini PC That Does Everything", niche: "Hardware Reviews", subniche: "Mini PCs", rationale: "Your viral Mini PC video hit 1.24M views. Budget hardware is your audience's #1 ask.", competition: "medium" as const, suggestedLength: "12–15 min", urgency: "Trending" as const },
  { id: "vi4", title: "Ollama + RAG — Build a Local AI Assistant", niche: "AI & Machine Learning", subniche: "Local LLMs", rationale: "Local LLMs avg 128K views. RAG is top viewer ask. No competitor has covered this specific combo.", competition: "low" as const, suggestedLength: "18–22 min", urgency: "Trending" as const },
  { id: "vi5", title: "How I Degoogled Everything in 2025", niche: "Privacy & Security", subniche: "App Alternatives", rationale: "Privacy Dad's degoogle video hit 342K. Your audience asks for this regularly. Viral potential is high.", competition: "medium" as const, suggestedLength: "14–18 min", urgency: "Evergreen" as const },
  { id: "vi6", title: "Hyprland Setup From Scratch — Full Guide", niche: "Linux & OS", subniche: "Window Managers", rationale: "Hyprland is the #3 viewer ask in Linux niche. No comprehensive guide exists from a channel your size.", competition: "low" as const, suggestedLength: "20–25 min", urgency: "Evergreen" as const },
  { id: "vi7", title: "Cursor AI vs Windsurf — Which Codes Better?", niche: "AI & Machine Learning", subniche: "AI Tools", rationale: "AI coding tools video hit 167K with high engagement (5.8%). Comparison format consistently outperforms.", competition: "high" as const, suggestedLength: "14–18 min", urgency: "Timely" as const },
  { id: "vi8", title: "My Neovim Config Explained — Every Plugin", niche: "Dev Tools & Workflow", subniche: "Editor Configs", rationale: "Editor configs have 62% retention — your highest. CodeStacked's terminal video hit 512K, proving demand.", competition: "medium" as const, suggestedLength: "16–22 min", urgency: "Evergreen" as const },
  { id: "vi9", title: "Self-Hosted Cloud Storage — Better Than Google Drive", niche: "Privacy & Security", subniche: "Self-Hosting", rationale: "Self-hosting subniche is growing. 'Private cloud storage' is a top viewer ask in Privacy.", competition: "low" as const, suggestedLength: "16–20 min", urgency: "Evergreen" as const },
  { id: "vi10", title: "Framework Laptop vs ThinkPad — Linux Edition", niche: "Hardware Reviews", subniche: "Laptops", rationale: "Your Framework video hit 634K. ThinkPad is the go-to Linux laptop. Direct comparison format works.", competition: "medium" as const, suggestedLength: "14–18 min", urgency: "Trending" as const },
];

// Helpers
export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + "K";
  return num.toString();
}

export function getNicheColor(colorIndex: number): string {
  const colors: Record<number, string> = {
    1: "hsl(var(--niche-1))",
    2: "hsl(var(--niche-2))",
    3: "hsl(var(--niche-3))",
    4: "hsl(var(--niche-4))",
    5: "hsl(var(--niche-5))",
    6: "hsl(var(--niche-6))",
    7: "hsl(var(--niche-7))",
  };
  return colors[colorIndex] || colors[1];
}

export function getNicheTailwindColor(colorIndex: number): string {
  return `niche-${colorIndex}`;
}
