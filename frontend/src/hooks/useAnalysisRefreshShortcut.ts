import { useEffect } from "react";
import { toast } from "sonner";

interface UseAnalysisRefreshShortcutOptions {
  label: string;
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
}

export function useAnalysisRefreshShortcut({ label, onRefresh, enabled = true }: UseAnalysisRefreshShortcutOptions) {
  useEffect(() => {
    if (!enabled) return undefined;

    const handler = async (event: KeyboardEvent) => {
      if ((!event.ctrlKey && !event.metaKey) || event.key.toLowerCase() !== "g") {
        return;
      }

      event.preventDefault();
      const toastId = `refresh-${label}`;
      toast.loading(`Regenerating ${label}...`, { id: toastId });

      try {
        await onRefresh();
        toast.success(`${label} regenerated`, { id: toastId });
      } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to regenerate ${label}`;
        toast.error(message, { id: toastId });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, label, onRefresh]);
}
