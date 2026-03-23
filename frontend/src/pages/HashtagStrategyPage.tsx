import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, Clock, Copy, Loader2, Sparkles, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AnalysisLoader } from "@/components/shared/AnalysisLoader";

export default function HashtagStrategyPage() {
  const { hashtag } = useParams();
  const [searchParams] = useSearchParams();
  const nicheId = searchParams.get("niche") || "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["hashtag_strategy", hashtag, nicheId],
    queryFn: async () => {
      const res = await apiFetch(`/api/hashtags/${encodeURIComponent(hashtag || "")}/strategy?niche_id=${encodeURIComponent(nicheId)}`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to generate strategy");
      return res.json();
    },
    enabled: !!hashtag && !!nicheId,
    staleTime: Infinity,
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app we'd use a toast here
  };

  if (isLoading) {
    return (
      <AnalysisLoader
        className="min-h-[60vh]"
        eyebrow="Trend Strategy Engine"
        title={`Synthesizing strategy for #${hashtag}`}
        subtitle="The engine is analyzing your channel constraints, audience fit, and the specific viral mechanics of this trend."
        steps={[
          "Profiling trend velocity and audience demographics",
          "Cross-referencing with your channel's historical performance",
          "Generating optimized title structures and descriptions",
          "Calculating expected reach lift and best posting window",
        ]}
      />
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-destructive">
        Failed to load strategy. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2 text-muted-foreground">
          <Link to="/app">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <span className="text-primary">#{hashtag}</span> Strategy
            </h1>
            <p className="text-muted-foreground mt-1">Personalized action plan for {nicheId} niche.</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {data.urgency_banner}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="stat-card">
            <h3 className="section-header">Execution Plan</h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {data.steps?.map((step: any, index: number) => (
                <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-accent text-accent-foreground font-semibold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {step.step_number}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        step.priority === 'high' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.time_required}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-2">{step.action}</p>
                    <p className="text-xs text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="stat-card">
            <h3 className="section-header flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Expected Impact
            </h3>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-foreground mb-1">{data.expected_reach_lift}</p>
              <p className="text-sm text-muted-foreground">Estimated Reach Lift</p>
            </div>
            <div className="border-t border-border/50 pt-4 mt-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Optimal Posting Window</p>
              <p className="text-sm font-semibold">{data.optimal_post_day} at {data.optimal_post_time}</p>
            </div>
          </div>

          <div className="stat-card">
            <h3 className="section-header flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Title Suggestions
            </h3>
            <div className="space-y-2 mt-3">
              {data.title_suggestions?.map((title: string, i: number) => (
                <div key={i} className="group relative flex items-center justify-between p-3 rounded-md bg-accent/40 hover:bg-accent/60 transition-colors">
                  <p className="text-sm text-foreground pr-8">{title}</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopy(title)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card">
            <h3 className="section-header">Description Template</h3>
            <div className="relative mt-3">
              <pre className="p-3 rounded-md bg-accent/40 text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {data.description_template}
              </pre>
              <Button variant="outline" size="sm" className="absolute top-2 right-2 h-7 px-2" onClick={() => handleCopy(data.description_template)}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          </div>

          <div className="stat-card">
            <h3 className="section-header">Hashtag Cluster</h3>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-primary/20 text-primary border border-primary/30">#{hashtag}</span>
              {data.hashtag_cluster?.map((tag: string) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded bg-accent text-muted-foreground">
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
