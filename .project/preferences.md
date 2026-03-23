Backend — .env
bash# ── Supabase ──────────────────────────────────────────
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Service role key — never expose to frontend
# Found in: Supabase Dashboard → Settings → API → service_role

# ── Google OAuth (YouTube) ────────────────────────────
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
# Found in: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client

# ── YouTube Data API (public/competitor data) ─────────
YOUTUBE_API_KEY=AIzaSyxxxxxxxxxxxx
# Found in: Google Cloud Console → APIs & Services → Credentials → API Keys
# Restrict to: YouTube Data API v3

# ── Gemini ────────────────────────────────────────────
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxx
# Found in: Google AI Studio → Get API Key (aistudio.google.com)
# Free tier: 15 RPM, 1500 req/day, 1M tokens/day

# ── App URLs ──────────────────────────────────────────
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
# Change both to ngrok URL for demo:
# BACKEND_URL=https://xxxx.ngrok-free.app
# FRONTEND_URL=https://xxxx.ngrok-free.app

# ── Environment ───────────────────────────────────────
ENVIRONMENT=development
# Set to "production" when running demo via ngrok

Frontend — .env.local
bash# ── Supabase (safe to expose — anon key only) ─────────
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Found in: Supabase Dashboard → Settings → API → anon public

# ── Backend ───────────────────────────────────────────
VITE_BACKEND_URL=http://localhost:8000
# Change to ngrok URL for demo:
# VITE_BACKEND_URL=https://xxxx.ngrok-free.app

.gitignore additions
bash# Environment files — never commit these
.env
.env.local
.env.production

# Google OAuth secrets
client_secrets.json

# Local ML cache and model artifacts
.cache/
embeddings_cache/
*.npy
*.joblib
*.pkl

# Database
*.db
*.sqlite

# Python
__pycache__/
*.pyc
.venv/

# Node
node_modules/
dist/

Full Tech Stack
Frontend
PackageVersionWhat it doesreact18UI frameworkreact-dom18DOM renderervite5Dev server, bundler, HMRreact-router-domv6Client-side routingtailwindcssv3Utility CSS for new componentsrechartslatestAll charts — bar, line, scatter, area@supabase/supabase-jsv2Auth client, DB queries, session management
bashnpm create vite@latest frontend -- --template react
cd frontend
npm install react-router-dom recharts @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

Backend
Web & API
PackageWhat it doesfastapiWeb framework — async, auto-docs at /docsuvicorn[standard]ASGI serverpython-dotenvLoads .env into os.environpydanticRequest/response schema validation (v2, ships with FastAPI)
Auth & Supabase
PackageWhat it doessupabaseSupabase Python client — DB reads/writes, auth verificationgoogle-authVerifies and refreshes Google OAuth tokensgoogle-auth-oauthlibHandles the OAuth 2.0 flow (code → tokens)google-auth-httplib2HTTP adapter for google-auth
YouTube Data
PackageWhat it doesgoogle-api-python-clientYouTube Data API v3 + YouTube Analytics APIyoutube-transcript-apiFetches auto-captions — no quota, no authscrapetubeGets all video IDs from any channel — no API key, no quotaaiohttpAsync HTTP for scraping ytInitialData, Noxinfluenceryt-dlpFallback thumbnail fetching, video metadata
AI & LLM
PackageWhat it doesgoogle-generativeaiGemini 1.5 Flash — niche labeling, strategy, insights
NLP & ML
PackageWhat it doessentence-transformersText embeddings — all-MiniLM-L6-v2 model (90MB, CPU)hdbscanDensity-based clustering — discovers niches automaticallyscikit-learnTF-IDF keyword extraction, Ridge regression (performance simulator)spacyPOS tagging, title formula detection — en_core_web_sm modelvaderSentimentRule-based sentiment — fast, no API, handles comment slanglangdetectLanguage detection from comment text
Computer Vision (Thumbnail Analysis)
PackageWhat it doesmediapipeFace detection in thumbnails — local, no APIpytesseractOCR to extract text from thumbnailscolorthiefExtracts dominant color palette from any imagePillowImage loading, resizing, format conversion
Data & Storage
PackageWhat it doespandasData wrangling, time-series analysis, groupby operationsnumpyNumerical ops, embedding arraysscipyStatistical correlation, linear regression for trend detectionsqlalchemyORM — used alongside Supabase for any local-only tablesaiosqliteAsync SQLite driver if needed for local caching tablesdiskcachePersistent disk cache for pipeline results between runsjoblibSaves/loads trained sklearn models and embedding matrices
Dev Utilities
PackageWhat it doestqdmProgress bars in the pipeline — useful during developmenthttpxSync/async HTTP client — cleaner than requests for FastAPI context
bash# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

pip install fastapi "uvicorn[standard]" python-dotenv
pip install supabase google-auth google-auth-oauthlib google-auth-httplib2
pip install google-api-python-client
pip install youtube-transcript-api scrapetube aiohttp yt-dlp
pip install google-generativeai
pip install sentence-transformers hdbscan scikit-learn
pip install spacy vaderSentiment langdetect
pip install mediapipe pytesseract colorthief Pillow
pip install pandas numpy scipy sqlalchemy aiosqlite
pip install diskcache joblib
pip install tqdm httpx

# Download spaCy model
python -m spacy download en_core_web_sm

# Save exact versions
pip freeze > requirements.txt