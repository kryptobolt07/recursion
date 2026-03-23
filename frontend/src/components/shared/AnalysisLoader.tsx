import { useEffect, useState } from "react";
import { Activity, Radar, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface AnalysisLoaderProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  steps?: string[];
  compact?: boolean;
  className?: string;
}

const defaultSteps = [
  "Scanning matched competitors",
  "Extracting packaging patterns",
  "Ranking audience-fit signals",
  "Composing grounded recommendations",
];

export function AnalysisLoader({
  eyebrow = "Live Analysis",
  title,
  subtitle,
  steps = defaultSteps,
  compact = false,
  className,
}: AnalysisLoaderProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (steps.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 1350);
    return () => window.clearInterval(timer);
  }, [steps.length]);

  return (
    <div className={cn("analysis-loader-shell", compact ? "p-4" : "p-5 md:p-7", className)}>
      <div className="analysis-loader-grid" />
      <div className="analysis-loader-beam" />

      <div className={cn("relative z-10 grid gap-5", compact ? "md:grid-cols-[176px_1fr]" : "md:grid-cols-[220px_1fr] md:gap-8")}>
        <div className="analysis-loader-visual">
          <div className="analysis-loader-orbit">
            <div className="analysis-loader-orbit-ring analysis-loader-orbit-ring-a" />
            <div className="analysis-loader-orbit-ring analysis-loader-orbit-ring-b" />
            <div className="analysis-loader-orbit-ring analysis-loader-orbit-ring-c" />
            <div className="analysis-loader-core">
              <Radar className="h-5 w-5 text-primary" />
            </div>
            <div className="analysis-loader-node analysis-loader-node-a" />
            <div className="analysis-loader-node analysis-loader-node-b" />
            <div className="analysis-loader-node analysis-loader-node-c" />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="analysis-loader-bar-wrap">
                <div className="analysis-loader-bar" style={{ animationDelay: `${index * 150}ms` }} />
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {eyebrow}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Real-time pipeline
            </span>
          </div>

          <h2 className={cn("mt-3 font-semibold tracking-tight text-foreground", compact ? "text-lg" : "text-2xl")}>{title}</h2>
          <p className={cn("mt-2 max-w-2xl text-muted-foreground", compact ? "text-sm leading-6" : "text-sm leading-7")}>{subtitle}</p>

          <div className="mt-5 grid gap-2.5">
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              return (
                <div
                  key={step}
                  className={cn(
                    "analysis-loader-step",
                    isActive && "border-primary/30 bg-primary/10 text-foreground shadow-[0_0_0_1px_rgba(239,68,68,0.1)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                      isActive ? "border-primary/35 bg-primary text-primary-foreground" : "border-border/70 bg-background/70 text-muted-foreground",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">{step}</span>
                  <span className={cn("analysis-loader-ping", isActive ? "opacity-100" : "opacity-35")} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
