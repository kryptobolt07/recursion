import { useEffect } from "react";

import { apiFetch } from "@/lib/api";
import { demoCreatorChannelId } from "@/lib/demo";

const WARMUP_SESSION_KEY = `analysis-warmup:${demoCreatorChannelId}`;

export function AnalysisWarmup() {
  useEffect(() => {
    const lastRun = window.sessionStorage.getItem(WARMUP_SESSION_KEY);
    if (lastRun) return;

    window.sessionStorage.setItem(WARMUP_SESSION_KEY, String(Date.now()));
    void apiFetch(`/analysis/preload/${demoCreatorChannelId}`, { method: "POST" }).catch(() => {
      window.sessionStorage.removeItem(WARMUP_SESSION_KEY);
    });
  }, []);

  return null;
}
