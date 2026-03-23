import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Loader2, Hash, Flame } from "lucide-react";
import { HashtagReasoningDrawer } from "./HashtagReasoningDrawer";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingHashtag {
  hashtag: string;
  niche_id: string;
  rank: number;
  score: number;
  video_count: number;
  velocity: string;
}

export function HashtagPanel() {
  const [selectedTag, setSelectedTag] = useState<{ hashtag: string, niche: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, error } = useQuery<{ hashtags: TrendingHashtag[], niches: string[] }>({
    queryKey: ["trending_hashtags"],
    queryFn: async () => {
      const res = await apiFetch("/api/hashtags/trending");
      if (!res.ok) throw new Error("Failed to fetch trending hashtags");
      return res.json();
    },
    // Poll every 60 minutes
    refetchInterval: 60 * 60 * 1000,
  });

  const handleTagClick = (hashtag: string, niche: string) => {
    setSelectedTag({ hashtag, niche });
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="w-[260px] shrink-0 hidden xl:flex flex-col border-l border-border/60 bg-background/50 overflow-y-auto overflow-x-hidden p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            Trending Tags
          </h2>
          {!isLoading && !error && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map(n => (
              <div key={n} className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-md">
            Unable to load trending data.
          </div>
        ) : data ? (
          <div className="space-y-6">
            {data.niches.map(niche => {
              const nicheTags = data.hashtags.filter(h => h.niche_id === niche).slice(0, 5);
              if (nicheTags.length === 0) return null;
              
              return (
                <div key={niche} className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{niche}</h3>
                  <div className="space-y-1.5">
                    {nicheTags.map((tag) => (
                      <button
                        key={tag.hashtag}
                        onClick={() => handleTagClick(tag.hashtag, tag.niche_id)}
                        className="w-full text-left p-2 rounded-md hover:bg-accent/50 transition-colors group flex items-center justify-between border border-transparent hover:border-border"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] text-muted-foreground font-medium w-3">{tag.rank}</span>
                          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{tag.hashtag}</span>
                        </div>
                        {tag.velocity === "rising" && (
                          <div className="h-1.5 w-1.5 rounded-full bg-success shrink-0" title="Rising velocity"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <HashtagReasoningDrawer 
        hashtag={selectedTag?.hashtag || null}
        nicheId={selectedTag?.niche || null}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
