import { useState } from "react";
import { Image, Loader2 } from "lucide-react";

import { AnalysisLoader } from "@/components/shared/AnalysisLoader";
import { apiFetch } from "@/lib/api";
import { demoCreatorChannelId } from "@/lib/demo";
import { useAnalysisRefreshShortcut } from "@/hooks/useAnalysisRefreshShortcut";

interface ThumbnailConcept {
  id: number;
  bg: string;
  face: string;
  text: string;
  composition: string;
  rationale: string;
}

interface ThumbnailResponse {
  niche: string;
  modalStyle: {
    dominantColors: string[];
    primaryFormula: string;
    compositionBias: string;
    faceBias: string;
  };
  referenceVideos: { title: string; channel: string; views: number; thumbnailUrl?: string }[];
  concepts: ThumbnailConcept[];
}

const nicheOptions = [
  "",
  "Linux & OS",
  "Hardware Reviews",
  "Dev Tools & Workflow",
  "Privacy & Security",
  "AI & Machine Learning",
];

export default function ThumbnailsPage() {
  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState("");
  const [result, setResult] = useState<ThumbnailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (force = false) => {
    if (!title.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const forceSuffix = force ? "?force=true" : "";
      const res = await apiFetch(`/thumbnails/suggest${forceSuffix}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          niche,
          channel_id: demoCreatorChannelId,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate thumbnail concepts");
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate thumbnail concepts");
    } finally {
      setIsLoading(false);
    }
  };
  useAnalysisRefreshShortcut({
    label: "thumbnail analysis",
    onRefresh: async () => {
      if (title.trim()) {
        await handleGenerate(true);
      }
    },
    enabled: !!title.trim(),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Thumbnail Suggestions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Concepts are grounded in real competitor palettes, packaging patterns, and winning reference videos.</p>
      </div>

      <div className="stat-card">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter video title for thumbnail concepts..."
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
            onClick={handleGenerate}
            disabled={isLoading || !title.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
            Generate
          </button>
        </div>
      </div>

      {error && (
        <div className="stat-card border border-destructive/30 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {isLoading && (
        <AnalysisLoader
          compact
          eyebrow="Thumbnail Lab"
          title="Mapping real thumbnail patterns from matched competitors"
          subtitle="The engine is extracting palette, composition, text density, and reference-video packaging before it suggests concepts."
          steps={[
            "Fetching winning public thumbnails",
            "Reading palette and composition bias",
            "Comparing overlay text patterns",
            "Writing concept directions",
          ]}
        />
      )}

      {result && (
        <>
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="stat-card">
              <h3 className="section-header">Detected Style</h3>
              <div className="space-y-3">
                <div className="rounded-lg bg-accent/20 p-3">
                  <p className="text-xs text-muted-foreground">Niche</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{result.niche}</p>
                </div>
                <div className="rounded-lg bg-accent/20 p-3">
                  <p className="text-xs text-muted-foreground">Primary Formula</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{result.modalStyle.primaryFormula}</p>
                </div>
                <div className="rounded-lg bg-accent/20 p-3">
                  <p className="text-xs text-muted-foreground">Composition Bias</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{result.modalStyle.compositionBias}</p>
                </div>
                <div className="rounded-lg bg-accent/20 p-3">
                  <p className="text-xs text-muted-foreground">Face Bias</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{result.modalStyle.faceBias}</p>
                </div>
                <div className="rounded-lg bg-accent/20 p-3">
                  <p className="text-xs text-muted-foreground">Dominant Colors</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.modalStyle.dominantColors.map((color) => (
                      <div key={color} className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-2 py-1 text-xs text-foreground">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                        {color}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <h3 className="section-header">Winning References</h3>
              <div className="space-y-3">
                {result.referenceVideos.map((video) => (
                  <div key={`${video.channel}-${video.title}`} className="flex gap-3 rounded-lg bg-accent/20 p-3">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} className="h-16 w-28 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-16 w-28 items-center justify-center rounded-md bg-primary/10">
                        <Image className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{video.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{video.channel}</p>
                      <p className="mt-1 text-xs text-primary">{video.views.toLocaleString()} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {result.concepts.map((concept) => (
              <div key={concept.id} className="stat-card">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {concept.id}
                  </span>
                  <h3 className="text-sm font-medium text-foreground">Concept {concept.id}</h3>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Background</p>
                    <p className="text-foreground">{concept.bg}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Face</p>
                    <p className="text-foreground">{concept.face}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Text Overlay</p>
                    <p className="text-foreground">{concept.text}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Composition</p>
                    <p className="text-foreground">{concept.composition}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-lg bg-accent/30 p-3">
                  <p className="text-xs leading-5 text-muted-foreground">{concept.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
