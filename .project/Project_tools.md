# Competitor Spy — Technical Implementation Stack

*Hackathon-optimized: free-first, local where possible, minimal spend.*

---

## Guiding Principles

Before the stack — three rules for hackathon survival:

**Mock aggressively.** YouTube's Data API has a 10,000 unit daily quota. A single channel fetch + 50 videos + comments burns ~3,000 units. Build a mock data layer from day one so the demo never fails due to quota exhaustion.

**One LLM call does many jobs.** Every LLM call should return structured JSON with multiple fields — niche label + sentiment summary + strategy insight in one shot — not three separate calls.

**Local models for inference, APIs for data.** Run embedding and classification locally (free, unlimited). Use APIs only for data you genuinely cannot generate yourself.

---

## 1. Channel Analysis Engine

### Data Acquisition
for channel analytics of the creator themselves we prefere the analysis api with oauth
YouTube Analytics API (official, free)This is a separate API from the Data API that most people don't know exists. It requires the channel owner to OAuth authenticate with your app. Once they do, you get:
viewerPercentage by age group and gender — actual demographics
country breakdown of views
averageViewDuration and averageViewPercentage — real retention numbers
estimatedRevenue (if monetized)
subscribersGained and subscribersLost per video
trafficSource breakdown — how viewers found the video
deviceType breakdown
sharesType — where it was share

**YouTube Data API v3** — free, 10,000 units/day quota

Endpoints needed:
- `channels.list` — fetch channel metadata (1 unit)
- `playlistItems.list` — get all video IDs from uploads playlist (1 unit per page of 50)
- `videos.list` — batch fetch metadata for up to 50 videos per call (1 unit per call)
- `commentThreads.list` — fetch top-level comments (1 unit per page of 100)

Quota math for a 300-video channel: ~6 playlist pages (6 units) + 6 video batch calls (6 units) + 10 comment pages across top videos (10 units) = ~22 units total. Very manageable.

**YouTube Transcript API** — free, no quota, no auth required

Python library `youtube-transcript-api`. Fetches auto-generated captions for any public video. Used for hook type detection, CTA analysis, and topic classification. No API key needed.

**yt-dlp** — free, open source, local

Used as fallback for thumbnail downloading when direct URL construction fails. Run locally, no rate limits beyond YouTube's own.

Thumbnail URL construction (no API call needed):
```
https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg
```

---

### Niche Clustering

**Sentence Transformers** — free, runs locally

Model: `all-MiniLM-L6-v2` (90MB, runs on CPU in ~50ms per embedding)

Input per video: concatenation of title + description (first 200 chars) + top 5 tags

Clustering algorithm: HDBSCAN via `hdbscan` Python library. Better than k-means for this use case because you don't need to specify k in advance — the number of niches is discovered from the data.

Subniche detection: run a second HDBSCAN pass within each cluster using a smaller `min_cluster_size`.

**Niche label generation:** Once clusters are formed, take the 5 most central videos per cluster (closest to centroid) and pass their titles to an LLM with a prompt: "Given these video titles, what is the single best 2–4 word label for this content cluster?" Returns the niche name.

---

### Sentiment & Audience Signal Analysis

**Primary: Gemini 1.5 Flash** — free tier, 15 RPM, 1M tokens/day

Use for: comment batch sentiment analysis, viewer ask extraction, praise/complaint extraction, qualitative niche summaries. Pass 50–100 sampled comments per video batch in a single call, request structured JSON output with sentiment scores, recurring questions, praise tags, complaint tags.

**Fallback (zero cost, offline): VADER**

Python library `vaderSentiment`. Rule-based, no model download, runs in microseconds. Use for per-comment sentiment scoring when you need fast classification of large comment volumes. Less nuanced than LLM but good enough for the positive/neutral/critical breakdown.

**Age and country data:** Not available via public YouTube API without channel ownership (YouTube Studio only). For the hackathon, use a combination of:
- Comment language detection via `langdetect` (free Python library) → proxy for geographic distribution
- Commenter profile heuristics (username patterns, comment language) → rough age signal
- Clearly label these as "estimated" in the UI. Judges will respect honesty over fabricated precision.

---

### Performance Metrics & Health Score

All computed locally from API data. No external service needed.

Retention estimation: YouTube doesn't expose retention for non-owned channels. Proxy formula:
```
estimated_retention = (comment_count / view_count) * engagement_weight 
                    + (like_count / view_count) * like_weight
```
Normalized against niche average. Label as "estimated retention signal" not "retention %".

Health score: weighted composite of normalized metrics computed in Python. Weights can be tuned but a reasonable starting set: content engagement rate (30%), view/sub ratio vs. niche avg (25%), upload consistency index (20%), growth trajectory (15%), comment sentiment (10%).

---

### Libraries Summary — Channel Analysis Engine

| Purpose | Tool | Cost |
|---|---|---|
| YouTube metadata | YouTube Data API v3 | Free (quota) |
| Transcripts | youtube-transcript-api | Free |
| Thumbnails | Direct URL / yt-dlp | Free |
| Text embeddings | sentence-transformers (MiniLM) | Free, local |
| Clustering | hdbscan | Free, local |
| Sentiment (fast) | vaderSentiment | Free, local |
| Sentiment (quality) | Gemini 1.5 Flash | Free tier |
| Niche labeling | Gemini 1.5 Flash | Free tier |
| Language detection | langdetect | Free, local |
| Data processing | pandas, numpy | Free, local |

---

## 2. Competitor Discovery Module

### Competitor Identification

**YouTube Search API** — part of YouTube Data API v3, costs 100 units per search call

This is your most expensive operation. Budget carefully. Strategy: run 3–4 targeted searches using keywords extracted from the analyzed channel's top video titles. Each search returns 50 results. 4 searches = 400 units.

Search query construction: extract the top 8 TF-IDF keywords from your channel's video titles and descriptions (using `sklearn.feature_extraction.text.TfidfVectorizer` locally). Construct search queries from these keywords, filtered by `type=channel`.

**Niche-based discovery:** For each niche cluster, take the top 3 performing videos' titles, extract keywords, search for channels posting similar content. Deduplicate results across niches.

**Subscriber bracket filtering:** Use `channels.list` to check each discovered channel's subscriber count. Filter to channels within 0.1× to 10× your channel's subscriber count (configurable). This costs 1 unit per batch of 50 channels.

**Alternative free discovery: SerpAPI free tier** — 100 searches/month free

Use Google search queries like `site:youtube.com "linux tutorials" -TechMorph` to discover channels without burning YouTube quota. Parse results for channel URLs. Fragile but quota-free.

---

### Similarity Scoring

All computed locally from data already fetched.

**Content similarity score** breakdown:
- Niche overlap: Jaccard similarity between your niche tag set and competitor's niche tag set (computed from their video embeddings against your cluster centroids)
- Title formula overlap: cosine similarity between TF-IDF vectors of your title corpus vs. theirs
- Keyword density overlap: intersection of top-50 keywords normalized by union size
- Subscriber bracket proximity: normalized score based on how close subscriber counts are

Combine with configurable weights → single 0–100 score. Pure Python, no API calls.

**Embedding comparison for video similarity:**

For "similar videos" comparison — embed all your videos and all competitor videos using the same `all-MiniLM-L6-v2` model. For each of your videos, find the 3 nearest competitor videos by cosine similarity. This gives you the "similar videos" pairs without any API calls.

---

### Thumbnail Analysis

**Primary: Google Cloud Vision API** — free tier: 1,000 units/month

Features used: `FACE_DETECTION`, `TEXT_DETECTION`, `IMAGE_PROPERTIES` (dominant colors), `SAFE_SEARCH_DETECTION`.

For a hackathon demo with ~20 competitor channels × 10 thumbnails each = 200 thumbnail analyses. Well within the free tier.

**Alternative: local models (zero cost, unlimited)**

Face detection: `face_recognition` Python library (uses dlib). Or `mediapipe` from Google — fully local, runs on CPU, detects faces with bounding boxes and landmark positions.

Text detection: `pytesseract` (Tesseract OCR, free, local). Less accurate than Cloud Vision but good enough for extracting the 3–5 word text that appears on YouTube thumbnails.

Color extraction: `colorthief` Python library — extracts dominant color palette from any image locally. Free, no API.

Recommended approach for hackathon: use local tools (mediapipe + pytesseract + colorthief) for everything. Skip Cloud Vision entirely. The accuracy difference won't matter in a demo.

---

### Viral Pattern Detection

Pure computation on fetched data. No additional API or model needed.

Algorithm:
1. For each competitor channel, compute their 90-day rolling average view count
2. Flag any video with views > 2.5× that average as a viral outlier
3. Extract features of flagged videos: title structure, length bucket, thumbnail style tags, upload day, upload time, niche tag
4. Cluster the viral outliers using the same HDBSCAN pipeline
5. Generate a natural-language pattern description using Gemini Flash: "Given these viral video titles and their features, describe in 2 sentences what they have in common"

---

### Competitive Landscape Map

Computed entirely from fetched data. Rendered in the frontend using a scatter plot library (Recharts if React, Chart.js otherwise). No API calls needed.

X-axis: subscriber count (log scale)
Y-axis: engagement rate = (likes + comments) / views, averaged across last 20 videos

---

### Libraries Summary — Competitor Discovery Module

| Purpose | Tool | Cost |
|---|---|---|
| Competitor search | YouTube Data API v3 (search.list) | 100 units/search |
| Alternative discovery | SerpAPI free tier | Free (100/mo) |
| Similarity scoring | sentence-transformers + sklearn | Free, local |
| Thumbnail face detection | mediapipe | Free, local |
| Thumbnail text extraction | pytesseract / Tesseract | Free, local |
| Thumbnail color analysis | colorthief | Free, local |
| Viral pattern description | Gemini 1.5 Flash | Free tier |
| Landscape map | Recharts / Chart.js | Free |

---

## 3. Data Extraction & Structuring Layer

### Storage

**Primary: SQLite** — zero cost, zero setup, runs locally

For a hackathon, a single SQLite file is all you need. Schema maps directly to the data models described in the spec. Use `sqlite3` or `SQLAlchemy` in Python.

Tables: `channels`, `videos`, `transcripts`, `thumbnail_features`, `comments`, `audience_signals`, `competitor_relationships`, `niche_clusters`, `video_embeddings`.

**Caching layer: diskcache or joblib.Memory** — free, local

Cache expensive computations (embeddings, cluster assignments, API responses) to disk so re-runs don't re-fetch or re-compute. Critical for a hackathon where you're iterating quickly.

**For production (post-hackathon):** migrate to PostgreSQL + pgvector for vector similarity search at scale.

---

### Pipeline Orchestration

**Prefect (free open-source version)** or simply Python `asyncio`

For a hackathon, `asyncio` + `aiohttp` for concurrent API calls is sufficient. No orchestration framework needed. Run the pipeline as a script triggered by the frontend via a FastAPI endpoint.

---

### Incomplete Data Handling

- Missing like counts (hidden by creator): estimate using niche average like/view ratio
- Missing comment counts: estimate using niche average comment/view ratio
- No transcript available: fall back to title + description only for that video's embedding
- Private videos showing in playlist: catch 403 errors, skip gracefully, log count

All estimates are flagged in the database with an `is_estimated: bool` field and surfaced as a disclaimer in the UI.

---

### API Rate Management

YouTube Data API:
- Daily quota: 10,000 units
- Strategy: fetch channel + videos on first load, cache results, only re-fetch on explicit "Re-analyse" button press
- Quota tracker: maintain a running count in the session, display remaining quota in the developer panel

Gemini API:
- Free tier: 15 requests per minute, 1,500 requests per day
- Strategy: batch all LLM tasks (sentiment + labeling + summary) into single requests with multi-task prompts
- Queue LLM calls with a 4-second delay between them to stay under RPM limit

---

### Libraries Summary — Data Extraction Layer

| Purpose | Tool | Cost |
|---|---|---|
| Database | SQLite + SQLAlchemy | Free, local |
| Caching | diskcache | Free, local |
| Async HTTP | aiohttp | Free, local |
| Data wrangling | pandas | Free, local |
| TF-IDF keyword extraction | sklearn | Free, local |
| Transcript fetching | youtube-transcript-api | Free |
| Backend API | FastAPI | Free, local |

---

## 4. Pattern Recognition Engine

### Trend Detection

**Time-series analysis: pandas + scipy** — free, local

For rising/declining topic detection: group videos by niche and month, count keyword frequency per month, fit a linear regression to the keyword frequency time series using `scipy.stats.linregress`. Positive slope = rising, negative = declining.

Threshold: flag as "rising" if slope > 0.2 (normalized) and r² > 0.6 (statistically meaningful trend).

**Cross-channel trend spike:** group competitor videos by topic tag and upload week. If 3+ competitors post on the same topic within a 14-day window and those videos average >1.5× their respective channel baselines, flag as a trend spike. Pure pandas groupby operations.

---

### Success Pattern Identification

**Title formula clustering:**

All video titles → TF-IDF vectors → cluster with HDBSCAN → for each cluster, identify the shared structural pattern using regex and part-of-speech tagging via `spaCy` (free, local, `en_core_web_sm` model, 12MB).

spaCy is used to identify: whether the title starts with a number, whether it contains an imperative verb, whether it's a question, the noun phrase structure. This produces interpretable formula labels without any LLM call.

**Thumbnail success correlation:**

Join thumbnail feature table with video performance table. Run `scipy.stats.pointbiserialr` for binary features (face present: yes/no) vs. view count. Run `scipy.stats.pearsonr` for continuous features (text word count) vs. view count. Surface correlations with p < 0.05 as significant findings.

**Upload timing correlation:**

Group videos by day of week and hour of day. Compute mean view count per bucket. Identify peak bucket. Simple groupby + mean, no model needed.

---

### Anomaly Detection

**Viral outlier flagging:** rolling 90-day mean + 2.5× threshold. Implemented with pandas rolling window.

**Sudden growth spike:** compare 30-day avg views (recent) vs. 90-day avg views (baseline). If ratio > 1.8, flag as growth spike. Fetch subscriber count at two time points is not possible with the free API (YouTube doesn't expose historical subscriber data), so use view velocity as the proxy.

**Content pivot detection:** compare niche distribution (% of uploads per niche) between the first 6 months of data and the most recent 3 months. If any niche shifts by more than 15 percentage points, flag as a potential pivot. Pure pandas, no model.

---

### LLM-Powered Insight Generation

**Gemini 1.5 Flash** for all natural-language insight generation in this module.

Prompts are constructed from structured data (not raw text) so they're short and deterministic:

Example prompt structure for viral pattern description:
```
These videos outperformed the channel average by >2.5x:
[list of title, niche, length, upload_day, thumbnail_style]
In 2 sentences, describe what pattern makes these videos successful.
Respond only with the 2 sentences, no preamble.
```

This produces a ~50-token output. Costs essentially nothing on the free tier.

---

### Libraries Summary — Pattern Recognition Engine

| Purpose | Tool | Cost |
|---|---|---|
| Time series / stats | pandas + scipy | Free, local |
| NLP / POS tagging | spaCy (en_core_web_sm) | Free, local |
| Correlation analysis | scipy.stats | Free, local |
| Anomaly / rolling stats | pandas | Free, local |
| Pattern description | Gemini 1.5 Flash | Free tier |

---

## 5. Strategy Generation System

### Core Strategy & Roadmap

**Gemini 1.5 Flash** — primary model for all strategy text generation

The key is prompt engineering, not model choice. All the heavy analytical work (which niches to grow, which topics are underserved, which competitors have gaps) is done by the Python pipeline and passed to the LLM as structured inputs. The LLM's job is to convert a structured analysis object into coherent, readable strategy text.

Example input to LLM for niche mix recommendation:
```json
{
  "current_mix": {"linux": 38, "hardware": 27, "devtools": 21, "opinion": 14},
  "view_efficiency": {"linux": +3, "hardware": +11, "devtools": -7, "opinion": -7},
  "niche_growth_trend": {"linux": "rising", "hardware": "stable", "devtools": "rising", "opinion": "declining"},
  "competitor_gap": {"linux": "NixOS underserved", "devtools": "Neovim heavily saturated"},
  "audience_demand": {"linux": ["NixOS", "Wayland"], "devtools": ["tmux", "dotfiles"]}
}
```

The LLM receives this and generates the recommendation section. The block chart comparison (current vs. suggested mix) is computed from the LLM's output, rendered by the frontend.

**For hackathon:** pre-compute the structured analysis object from all previous pipeline stages, cache it, pass it to Gemini in one large context call. Request all strategy sections in a single call with a JSON schema output format. Use Gemini's `response_mime_type: "application/json"` to enforce structured output.

---

### Video Idea Generator

**Input construction (all local computation):**
1. Competitor gap topics: topics where competitors have high-performing videos but you have zero coverage — from the similarity + gap analysis in module 2
2. Audience demand signals: top recurring viewer asks from comment analysis — from module 1
3. Rising topics: from the trend detection in module 4
4. Your best title formulas: from pattern recognition in module 4
5. Your retention-optimal length per niche: from pattern recognition

**LLM call (Gemini 1.5 Flash):**
Pass all five inputs in a single prompt. Request 15 video ideas as a JSON array, each with: `title`, `niche`, `subniche`, `rationale`, `competition_level`, `suggested_length`, `urgency_tag`.

Rationale field is the most valuable — it must cite a specific signal ("3 competitors posted NixOS videos last week, all performed >2× their baseline"). Enforce this in the prompt.

---

### Title Optimizer

**Local component:** parse the existing title using spaCy to identify its current formula. Compute its predicted performance index based on the correlation analysis from module 4 (e.g. this title has a number: +15% lift signal, but it's 12 words: -8% lift signal). Display current predicted index before optimization.

**LLM component (Gemini 1.5 Flash):** pass the original title + the top 3 performing title formulas for that niche + 5 examples of high-performing titles in that niche. Request 5 rewritten variants in JSON, each specifying: `title`, `formula_used`, `word_count`, `character_count`, `predicted_lift_reason`.

**Bulk mode:** run all existing video titles through the local scoring component first (no LLM needed). Rank by optimization potential. Only call the LLM for the top 10 to stay within rate limits.

---

### Thumbnail Suggestion System

**Input:** video title + niche + optional script summary

**Local analysis:** query the database for the top-performing thumbnails in that niche (by view count). Retrieve their extracted features (face %, text count, dominant colors, composition). Compute the modal style: the most common feature combination among top performers.

**LLM call (Gemini 1.5 Flash):** pass the modal style + the video title + 3 examples of high-performing competitor thumbnail descriptions. Request 3 thumbnail concept briefs in JSON: `background_approach`, `face_recommendation`, `expression`, `text_overlay`, `text_word_count`, `composition`, `dominant_color_hex`, `rationale`.

**Image generation (optional brownie points):**

**Stable Diffusion via Automatic1111 (local, free)** or **Replicate free tier** (limited free credits).

If running locally: use the thumbnail concept brief as a generation prompt. Model: `stable-diffusion-xl-base-1.0`. The output won't be a polished YouTube thumbnail but it's a strong demo moment.

If not running local SD: use **Canva's free API** (they have a developer tier) or simply display the concept brief as a structured card and call it a "concept specification" rather than a generated image.

---

### Performance Simulator

**Model: linear regression trained on your own fetched data** — free, local, runs in milliseconds

Features: niche (one-hot), video length (numeric), upload day (one-hot), title has number (binary), title word count (numeric), thumbnail has face (binary), channel subscriber count at time of upload.

Target: view count at day 7 (proxy for performance).

Train on: all indexed videos from the channel + competitors where you have actual view data. With 300 videos per channel and 10 competitors, that's ~3,000 training examples. Enough for a reasonable regression.

Library: `sklearn.linear_model.Ridge` (regularized to handle small dataset). Train once, cache the model with `joblib.dump`. Inference is instant.

**Three scenario lines:** conservative = 0.7× predicted, base = 1.0× predicted, optimistic = 1.4× predicted.

**Script-aware adjustment (LLM component):** if a script summary is provided, pass it to Gemini Flash with this prompt: "Is this video topic evergreen, trending, or time-sensitive? Answer with one word: evergreen / trending / timesensitive." Use the response to adjust the trajectory shape: trending content gets a steep early spike with fast decay; evergreen gets a slower ramp with a longer flat tail. The shape adjustment is applied as a multiplier curve over the 30-day projection, not a change to the final value.

**Graph rendering:** Recharts `LineChart` in the frontend. Three lines (conservative / base / optimistic), annotations at day 1, day 7, day 30. No backend chart library needed.

---

### Libraries Summary — Strategy Generation System

| Purpose | Tool | Cost |
|---|---|---|
| Strategy text generation | Gemini 1.5 Flash | Free tier |
| Structured JSON output | Gemini `response_mime_type` | Free tier |
| Title formula parsing | spaCy | Free, local |
| Performance regression model | sklearn Ridge | Free, local |
| Model persistence | joblib | Free, local |
| Trajectory shape adjustment | Gemini 1.5 Flash | Free tier |
| Chart rendering | Recharts | Free |
| Optional image generation | Stable Diffusion (local) / Replicate | Free / limited credits |

---

## Full Stack Summary

### Backend
- **Language:** Python 3.11
- **API framework:** FastAPI — lightweight, async-native, auto-generates OpenAPI docs
- **Task queue:** none needed for hackathon — run pipeline synchronously on request, stream progress updates to frontend via Server-Sent Events (SSE)

### Frontend
- **Framework:** React (Vite for fast dev setup)
- **Charts:** Recharts
- **Styling:** Tailwind CSS

### Infrastructure
- **Run everything locally** for the hackathon demo — no cloud hosting costs
- **ngrok** (free tier) to expose the local FastAPI server to the internet if needed for a live demo URL
- **Single machine requirement:** the full stack (FastAPI + SQLite + local models) runs comfortably on a machine with 8GB RAM and a mid-range CPU. No GPU required for any of the local models used.

---

## Master Dependency List

```
# Data acquisition
google-api-python-client      # YouTube Data API
youtube-transcript-api        # Transcripts
yt-dlp                        # Thumbnail fallback

# NLP and ML
sentence-transformers         # Text embeddings (MiniLM)
hdbscan                       # Clustering
scikit-learn                  # TF-IDF, Ridge regression
spacy                         # POS tagging, formula detection
vaderSentiment                # Fast sentiment
langdetect                    # Language detection

# Computer vision (local)
mediapipe                     # Face detection
pytesseract                   # OCR for thumbnail text
colorthief                    # Dominant color extraction
Pillow                        # Image processing

# LLM
google-generativeai           # Gemini 1.5 Flash

# Data and storage
pandas
numpy
scipy
sqlalchemy
sqlite3                       # stdlib
diskcache                     # Caching
joblib                        # Model persistence

# Backend
fastapi
uvicorn
aiohttp
pydantic

# Dev
python-dotenv
tqdm                          # Progress bars in pipeline
```

**Total API cost for a full hackathon demo run: $0.**
The only thing that costs money is if you exceed Gemini's free tier (unlikely with batched calls) or choose to use Replicate for image generation (give yourself a $5 credit just in case).