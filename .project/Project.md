# Competitor Spy — Full Product Specification

---

## 1. Channel Analysis Engine
*A system to understand content themes, audience, and performance patterns.*

### 1.1 Niche Overview — Block Chart
The entry point of the entire analysis. The channel's content is automatically clustered into broad niches and displayed as a proportional block chart — each block sized by upload share. Clicking any block opens the Niche Detail Page for that niche.

**Block chart shows per niche:**
- Niche name and upload share %
- Average views for that niche
- Color-coded by niche identity (persists throughout the app)

---

### 1.2 Niche Detail Page
Opens when a block is clicked. Five sub-tabs:

**Overview sub-tab**
- Stat strip: avg views, avg video length, estimated retention %, view share of total channel views
- Top 3 performing videos in that niche (title, view count, thumbnail color swatch)
- Audience sentiment bar (positive / neutral / critical %)
- Content health summary: one-line AI-generated insight on the niche's trajectory

**Subniches sub-tab**
- Auto-detected subniches within the niche (e.g. Linux & OS → Distro Reviews, Terminal Setup, NixOS/Arch, Window Managers, Kernel Deep Dives)
- Per subniche: estimated avg views, estimated retention, upload frequency
- Subniche growth trend: is this subniche growing or shrinking in upload volume over time?

**Content DNA sub-tab**
- Title pattern analysis: % of videos containing numbers, power verbs, question format, "How I" structure — with avg word count and avg character length
- Thumbnail style: face present %, bold text overlay %, avg word count on thumbnail, dominant color palette (swatches)
- Video length distribution: bar chart across buckets (<5m, 5–10m, 10–20m, 20–30m, 30m+) with the peak bucket called out
- Hook type breakdown: what kind of opening does the creator use? (question, shocking stat, story, demo) — derived from transcript analysis
- CTA pattern: does the creator ask for likes/subs? at what timestamp? how consistently?

**Cadence sub-tab**
- Monthly upload volume bar chart, colored by niche
- Upload day heatmap: which days of the week does this niche get posted on?
- Avg gap between uploads in this niche (days)
- Consistency index (0–100) based on variance in gap
- Best performing upload day for this niche specifically
- Correlation flag: does performance drop when cadence slips?

**Audience sub-tab**
- Sentiment breakdown: positive / neutral / critical % with a qualitative summary
- What viewers ask for: tag cloud of recurring comment questions and requests, specific to this niche
- What viewers praise vs. complain about: two separate tag sets
- Age breakdown: bar chart across 6 age bands (13–17, 18–24, 25–34, 35–44, 45–54, 55+) specific to this niche
- Country breakdown: top 6 countries with proportion bars, specific to this niche
- Language distribution: top languages in comments for this niche

---

### 1.3 Global Channel View — Five Tabs

**Overview tab**
- Stat strip: avg views/video, engagement rate, view-to-subscriber ratio, upload frequency
- Niche block chart (entry point, described above)
- Niche comparison table: all niches side by side — upload share, avg views, avg length, retention, view share — sortable
- Top performing videos across all niches: ranked list with niche tag, views, and thumbnail swatch
- Channel health score (0–100) with sub-scores for content quality, engagement, growth momentum, consistency

**Views Breakdown tab**
- Proportional views bar: visual representation of what % of total views each niche drives
- Upload share vs. view share efficiency chart: shows which niches punch above or below their upload weight — "Hardware Reviews is 27% of uploads but 38% of views: +11% surplus"
- Ranked top 3 videos per niche in one scrollable view
- Total estimated views generated per niche over the past 12 months

**Content DNA tab**
- Global title pattern analysis across all niches
- Global thumbnail style breakdown
- Global video length distribution
- Per-niche DNA preview cards (compact) with click-through to niche detail
- Cross-niche comparison: which niche has the longest videos? highest face-in-thumbnail rate? most number-based titles?

**Cadence tab**
- Stacked monthly upload chart: all niches layered, color-coded
- Per-niche mini upload rhythm bars in a 2-column grid
- Global cadence stats: avg gap, consistency score, best upload day, longest gap and its performance impact
- Upload day distribution: which days across all content does the channel tend to post, and which day performs best

**Audience tab**
- Global sentiment bar + qualitative summary
- Global age breakdown bar chart (6 bands)
- Global country breakdown with proportion bars (top 7 countries)
- Global language distribution
- What viewers ask for globally: tag cloud
- What viewers praise vs. complain about globally
- Per-niche audience comparison cards: compact cards for each niche showing sentiment, age peak, top country, top 2 viewer asks — all clickable into niche detail

---

## 2. Competitor Discovery Module
*A mechanism to identify relevant competitors without manual input.*

### 2.1 Competitor Discovery — Global View

**Auto-Discovery Panel**
- System automatically identifies competitors based on: niche overlap, keyword co-occurrence in titles/descriptions, shared audience comment behavior, similar subscriber bracket
- Displays a ranked list of top 10 discovered competitors for the channel overall
- Each competitor card shows: channel name, subscriber count, niche match tags, discovery reason ("shares 3 of 4 niches", "overlapping keyword density 74%"), similarity score (0–100)
- Manual override: user can add or exclude channels

**Competitive Landscape Map**
- 2D scatter plot: X-axis = subscriber count, Y-axis = avg engagement rate
- Your channel plotted as a distinct marker
- All discovered competitors plotted around it
- Quadrant labels: Dominant (high subs, high engagement), Sleeping Giants (high subs, low engagement), Rising Stars (low subs, high engagement), Fringe (low subs, low engagement)
- Clicking any dot opens that competitor's profile

**Top Competitors Summary Table**
- Columns: channel, subs, avg views, engagement rate, upload frequency, top niche, similarity score
- Sortable by any column
- Color-coded similarity score bar

---

### 2.2 Competitor Detail Page

**Overview sub-tab**
- Stat strip mirroring your own: subs, avg views, engagement rate, upload freq, view/sub ratio
- Side-by-side comparison: You vs. Competitor across all key metrics, with delta indicators (you're +12% on engagement, -34% on avg views)
- Competitor's niche block chart: same format as yours, so the comparison is immediate
- Content health score for competitor (same 0–100 scale as yours)

**Content Similarity sub-tab**
- Overall content similarity score (0–100) with breakdown: niche overlap score, title formula overlap, thumbnail style overlap, audience overlap
- Shared niches: which niches you both cover, with your avg views vs. their avg views in each shared niche
- Exclusive niches: what they cover that you don't (opportunity flags) and what you cover that they don't (your advantages)
- Keyword overlap map: shared high-performing keywords vs. unique keywords on each side

**Similar Videos Comparison sub-tab**
- For each shared niche: their top 3 videos vs. your top 3 videos side by side
- Each video row shows: title, views, length, estimated engagement, thumbnail style tag
- "What works for them" AI summary: one-paragraph analysis of what patterns make their top videos succeed
- Gap analysis: topics they've covered that performed well, which you haven't touched

**Thumbnail Analysis sub-tab**
- Side-by-side thumbnail style comparison: You vs. Competitor
- Metrics compared: face present %, bold text %, avg word count on thumbnail, dominant colors (swatches), background complexity (clean vs. busy)
- Pattern insight: "They use red/black high-contrast thumbnails with 3-word text. Your thumbnails average 4.2 words on a dark background — consider testing their contrast approach in your Hardware niche"
- Thumbnail performance correlation: which thumbnail styles correlate with their highest-view videos

**Viral Pattern Detection sub-tab**
- Identifies videos that significantly outperformed the competitor's channel average (>2× avg views)
- Shows: title, views, upload date, view velocity (views in first 48h estimated), topic tag
- Pattern summary: "Their viral content is 80% hardware reviews posted on Tuesday mornings with ≤5-word thumbnail text"
- Cross-competitor viral pattern: if multiple competitors have viral videos on the same topic, it's flagged as a niche trend

**Engagement Deep-Dive sub-tab**
- Engagement rate over time: are they growing or declining in engagement?
- Comment sentiment for competitor: positive/neutral/critical breakdown
- What their audience asks for: viewer requests from competitor comments (potential content gap for you)
- Like/comment/share ratio comparison: You vs. Competitor

---

### 2.3 Per-Niche Competitor View
Accessible from the Niche Detail Page. Shows competitors specifically within that niche, not the whole channel.

- Top 5 competitors in this specific niche (may differ from overall top competitors)
- Their avg views in this niche vs. yours
- Their upload frequency in this niche vs. yours
- Their top video in this niche vs. your top video in this niche
- Niche-specific similarity score

---

## 3. Data Extraction & Structuring Layer
*A system to collect and organize competitor data into usable formats.*

### 3.1 Data Sources
- YouTube Data API v3: channel metadata, video metadata (title, description, tags, duration, publish date, view count, like count, comment count), playlist data
- YouTube auto-captions: transcript text for theme and hook analysis
- Thumbnail images: fetched and passed through vision model for visual feature extraction (face detection, text detection, color palette extraction, composition analysis)
- Comment data: sampled from top videos (most recent 200 comments per video) for sentiment and request analysis

### 3.2 Ingestion Pipeline
- Rate-limit-aware API client with exponential backoff and quota management
- Deduplication layer: prevents re-fetching unchanged videos, caches by video ID + last-updated timestamp
- Schema normalizer: maps raw API response fields to internal unified schema regardless of source variation
- Incomplete data handler: when view count, like count, or comment count is missing or suppressed, system uses interpolation from similar videos or flags the field as estimated

### 3.3 Data Models
- Channel record: channel ID, handle, subscriber count, total videos, join date, niche tags (auto-assigned), health score, last analyzed timestamp
- Video record: video ID, channel ID, title, description, tags, duration, publish date, view count, like count, comment count, transcript (if available), thumbnail URL, extracted thumbnail features, niche tag (auto-assigned), cluster ID
- Competitor relationship record: your channel ID, competitor channel ID, similarity score, shared niches, discovery method, date discovered
- Audience signal record: video ID, sentiment score, top keywords from comments, top recurring questions, top praise themes, top complaint themes, language distribution

### 3.4 Structuring & Enrichment
- Niche clustering: sentence embeddings on title + description → k-means or HDBSCAN clustering → LLM assigns human-readable niche label to each cluster
- Subniche detection: second-pass clustering within each niche cluster to detect finer-grained subniches
- Thumbnail feature extraction: vision model pass on each thumbnail → structured output: {face: bool, face_count: int, text_present: bool, text_content: str, word_count: int, dominant_colors: [hex], background_complexity: low/medium/high}
- Engagement normalization: all engagement metrics normalized against channel subscriber count and niche averages to produce comparable scores across channels of different sizes

---

## 4. Pattern Recognition Engine
*A module to identify trends, successful strategies, and anomalies.*

### 4.1 Content Trend Detection
- Rising topic detector: tracks keyword frequency across all indexed videos in a niche over time — surfaces topics that are appearing more frequently in the past 30/60/90 days
- Declining topic detector: flags topics that used to appear frequently but are dropping off
- Emerging format detector: detects shifts in video length distribution, title structure, or thumbnail style across the niche over time
- Cross-channel trend: if 3+ competitors have posted on the same topic within 14 days and all performed above their averages, it's flagged as a trend spike

### 4.2 Successful Strategy Identification
- High-performing title formula extractor: clusters titles of top-quartile videos by performance and identifies shared linguistic patterns — "titles starting with a number followed by an adjective noun phrase average 2.1× channel baseline"
- Thumbnail success pattern: correlates thumbnail features (face presence, text count, color contrast) with view performance across all videos in the niche
- Upload timing correlation: correlates day-of-week and time-of-day of upload with first-48h view velocity
- Length-retention correlation: for each niche, identifies the video length range that maximizes estimated retention
- Consistency reward detection: measures whether channels with lower variance in upload cadence show higher subscriber growth rate

### 4.3 Anomaly Detection
- Viral outlier flagging: any video performing >2.5× the channel's 90-day average is flagged as a viral outlier and analyzed for distinguishing features
- Sudden growth spike: detects channels whose subscriber or view growth rate has accelerated significantly in the past 30 days — possible indicator of a successful new strategy
- Engagement drop anomaly: detects videos or periods where engagement rate drops significantly below the channel's norm, potentially indicating audience mismatch
- Content pivot detection: detects when a channel's niche distribution shifts significantly over a 90-day window — signals a strategic change worth noting

### 4.4 Comparative Pattern Analysis
- You vs. niche average: for every metric, your channel is benchmarked against the niche average derived from all indexed competitors
- Your outliers: which of your own videos are your viral outliers, and what do they have in common?
- Competitor pattern extraction: for each competitor, a strategy fingerprint is generated — dominant niche, avg length, upload cadence, thumbnail style, title formula, engagement tier

---

## 5. Strategy Generation System
*A system producing actionable recommendations based on analysis.*

### 5.1 Channel Strategy Report
A synthesized, AI-generated strategy document produced after full analysis. Structured in sections:

**Niche Mix Recommendation**
- Current niche distribution vs. recommended distribution
- Based on: which niches drive the most views per upload, which niches are growing in the competitive landscape, which niches have the least competition but high audience demand
- Presented as two block charts side by side: current mix vs. suggested mix
- Reasoning per niche: "Increase Linux & OS from 38% to 45% — it generates 41% of your views on 38% of your uploads, and audience demand signals show unmet requests in NixOS and Wayland content"

**30 / 60 / 90-Day Roadmap**
- Broken into three phases with specific actions per phase
- Phase 1 (0–30 days): quick wins — optimize existing video titles, fix upload cadence, post on best-performing day
- Phase 2 (31–60 days): content shifts — start producing in the highest-opportunity subniche, test new thumbnail style in one niche
- Phase 3 (61–90 days): strategic bets — move into a competitor's gap topic, experiment with a new format identified by the pattern engine

---

### 5.2 Future Video Idea Generator
- Inputs: your niche mix, competitor gap analysis, audience asks, trending topics from pattern engine, your best-performing title formulas
- Output: a list of 10–20 specific video ideas, each with:
  - Working title (following your best-performing formula)
  - Target niche and subniche
  - Rationale: why this video, why now (trend signal, competitor gap, or audience demand)
  - Estimated competition level (low / medium / high) based on how many competitors have covered it
  - Suggested video length based on niche retention data
  - Urgency tag: Evergreen / Trending (post within 2 weeks) / Timely (post within 48h)
- Filterable by: niche, urgency, competition level

---

### 5.3 Title Optimizer
- Input: paste any existing video title (or select from your channel's video list)
- Output: 5 rewritten title variants, each following a different high-performing formula detected for your niche
- For each variant: predicted relative reach score (normalized index), formula used ("number + adjective + noun", "How I + verb + result"), character count, word count
- A/B suggestion: which two variants to test against each other, and why
- Bulk mode: run all your existing videos through the optimizer and surface the top 10 titles with the highest improvement potential

---

### 5.4 Thumbnail Suggestion System
- Input: video title and niche (optionally: a script summary)
- Output: 3 thumbnail concept briefs, each specifying:
  - Recommended background approach (clean vs. busy, suggested dominant color from niche's high-performing palette)
  - Face recommendation: present or absent, expression type (surprised, intense, neutral)
  - Text overlay: suggested text (3–5 words max), font weight recommendation (bold vs. regular)
  - Composition: subject placement (left/center/right), any recommended prop or visual element
  - Rationale: "This concept mirrors the thumbnail style of your top 3 Hardware Review videos, which averaged 1.8× your channel baseline"
- Visual reference: links or tags pointing to competitor thumbnails that follow this pattern (as reference only)
- If image generation is available: produce a rough mock using the concept brief as a generation prompt

---

### 5.5 Video Posting Strategy
- Best day and time to post per niche: derived from your own upload-performance correlation and competitor performance data
- Recommended weekly schedule: a concrete posting calendar — "Post Linux content Tuesday 10am IST, Hardware content Thursday 2pm IST"
- Shorts strategy (if applicable): whether the channel should incorporate Shorts, at what frequency, and which niches translate best to the format
- Notification priming: recommendation on whether to post a community tab update before major videos based on engagement data
- Consistency score target: a specific consistency index to aim for, with the projected impact on subscriber growth rate

---

### 5.6 Video Performance Simulator
- Input: a video title, target niche, planned length, and optionally a brief script summary (200 words max)
- Output: a projected performance trajectory shown as a line graph — estimated views over 30 days post-upload, with three scenario lines: conservative, base, optimistic
- Graph annotations: day 1 velocity estimate, day 7 plateau estimate, day 30 long-tail estimate
- Confidence score: how reliable the projection is, based on how many similar videos exist in the training set
- Sensitivity analysis: "If you post on Tuesday instead of Friday, the base estimate increases by ~22%"; "Adding a number to the title shifts the base estimate up ~15%"
- Comparison overlay: overlay the projected line against your actual top-performing video in the same niche for visual calibration
- Script-aware adjustment: if a script summary is provided, the LLM identifies whether the topic is trend-aligned or evergreen and adjusts the trajectory shape accordingly (trend content spikes early then drops; evergreen content grows slowly but has a long tail)