import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Loader2, Wand2 } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { demoCreatorChannelId } from "@/lib/demo";

interface TitleVariant {
  title: string;
  formula: string;
  reach: number;
  chars: number;
  words: number;
  whyItWorks: string;
}

interface OptimizeResponse {
  original: string;
  niche: string;
  variants: TitleVariant[];
  abTestSuggestion: string;
  referenceTitles: string[];
}

interface BulkResponse {
  optimizable: { original: string; topVariant: string; bestFormula: string; reach: number }[];
}

const nicheOptions = [
  "",
  "Linux & OS",
  "Hardware Reviews",
  "Dev Tools & Workflow",
  "Privacy & Security",
  "AI & Machine Learning",
];

export default function TitleOptimizerPage() {
  const [input, setInput] = useState("");
  const [niche, setNiche] = useState("");
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const bulkQuery = useQuery<BulkResponse>({
    queryKey: ["title-bulk", demoCreatorChannelId],
    queryFn: async () => {
      const res = await apiFetch(`/titles/bulk/${demoCreatorChannelId}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to load bulk title opportunities");
      return res.json();
    },
  });

  const handleOptimize = async () => {
    if (!input.trim()) return;

    setIsOptimizing(true);
    setError(null);

    try {
      const res = await apiFetch("/titles/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.trim(),
          niche,
          channel_id: demoCreatorChannelId,
        }),
      });
      if (!res.ok) throw new Error("Failed to optimize title");
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to optimize title");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // No-op; copy failures are non-critical in this UI.
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Title Optimizer</h1>
        <p className="mt-1 text-sm text-muted-foreground">Rewrites are grounded in the winning title formulas from matched competitors.</p>
      </div>

      <div className="stat-card">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Enter a video title to optimize..."
            className="flex-1 rounded-lg border border-border bg-accent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
            className="rounded-lg border border-border bg-accent px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary lg:w-64"
          >
            <option value="">Auto-detect niche</option>
            {nicheOptions.filter(Boolean).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || !input.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isOptimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Optimize
          </button>
        </div>
      </div>

      {error && (
        <div className="stat-card border border-destructive/30 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="stat-card">
            <p className="mb-1 text-xs text-muted-foreground">ORIGINAL</p>
            <p className="text-sm font-medium text-foreground">{result.original}</p>
            <p className="mt-1 text-xs text-muted-foreground">Detected niche: {result.niche}</p>
          </div>

          <div className="stat-card">
            <p className="mb-3 text-xs text-muted-foreground">OPTIMIZED VARIANTS</p>
            <div className="space-y-3">
              {result.variants.map((variant, index) => (
                <div key={`${variant.title}-${index}`} className="rounded-lg bg-accent/50 p-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{variant.title}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>Formula: {variant.formula}</span>
                        <span>{variant.chars} chars</span>
                        <span>{variant.words} words</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{variant.whyItWorks}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${variant.reach}%` }} />
                        </div>
                        <span className="text-xs font-medium text-primary">{variant.reach}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">reach score</p>
                      <button
                        onClick={() => handleCopy(variant.title)}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-accent/30 p-3">
              <p className="mb-1 text-xs font-medium text-foreground">A/B Test Suggestion</p>
              <p className="text-xs leading-5 text-muted-foreground">{result.abTestSuggestion}</p>
            </div>
            {!!result.referenceTitles.length && (
              <div className="mt-4">
                <p className="mb-2 text-xs text-muted-foreground">Reference Titles</p>
                <div className="flex flex-wrap gap-2">
                  {result.referenceTitles.map((title) => (
                    <span key={title} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="stat-card">
        <h3 className="section-header">Bulk Opportunities</h3>
        {bulkQuery.isLoading ? (
          <div className="flex items-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading creator title opportunities...</p>
          </div>
        ) : bulkQuery.error ? (
          <p className="text-sm text-muted-foreground">Could not load bulk opportunities.</p>
        ) : (
          <div className="space-y-3">
            {(bulkQuery.data?.optimizable || []).map((item) => (
              <div key={item.original} className="rounded-lg bg-accent/20 px-3 py-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Original</p>
                    <p className="truncate text-sm font-medium text-foreground">{item.original}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Best formula: {item.bestFormula}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Suggested winner</p>
                      <p className="max-w-[320px] text-sm text-foreground">{item.topVariant}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{item.reach}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
