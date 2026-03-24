# Recursion 7.0: Competitor Spy

**Competitor Spy** is an AI-powered intelligence platform for YouTube creators. It analyzes competitors in real-time to discover what works, identifies market gaps, and provides actionable strategies for growth.

## 🚀 Core Features

- **Competitor Discovery & Similarity Scoring**: Identify creators in your niche and see how closely their audience matches yours.
- **Strategic Roadmaps**: Generate 30-60-90 day execution plans based on competitor performance and viewer demand.
- **Title Optimizer**: Get high-reach title variants using proven psychological formulas (e.g., "Comparison", "Numbered List", "Personal Story").
- **Thumbnail Concept Generator**: AI-generated visual concepts based on visual trend analysis (OCR, color palettes, and composition bias).
- **Video Idea Generator**: Discover high-potential topics by analyzing competitor outliers and common viewer questions.
- **Market Niche Breakdown**: Visualize your current content mix vs. high-opportunity growth lanes.

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.14+)
- **LLM Integration**: Google Gemini & Groq (Llama 3)
- **Database/Cache**: SQLite with [aiosqlite](https://github.com/omnilib/aiosqlite)
- **Image Analysis**: Pillow, ColorThief, Mediapipe (Face Detection), Pytesseract (OCR)
- **Data Ingestion**: custom YouTube scrapers and Data API integration

### Frontend
- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest)
- **Charts**: [Recharts](https://recharts.org/)

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.14+
- Node.js & npm
- [uv](https://github.com/astral-sh/uv) (recommended for Python package management)

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
3. Add your API keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, etc.) to `.env`.
4. Install dependencies and start the server:
   ```bash
   uv sync
   uv run uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 💾 Caching
The system employs a multi-layer caching strategy to ensure fast responses and minimize LLM costs:
- **In-Memory Cache**: LRU cache for frequent request data.
- **Persistent Cache**: SQLite-backed storage in `.cache/analysis.sqlite3` with TTL support for:
  - Title and Thumbnail optimization results (24-hour TTL)
  - Thumbnail visual features (1-week TTL)
  - Competitor discovery results

## 📝 License
Proprietary - Developed for Recursion 7.0 AI-ML Problem Statement.
