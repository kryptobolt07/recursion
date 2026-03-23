import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Loader2, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HashtagReasoningDrawer({ 
  hashtag, 
  nicheId, 
  open, 
  onOpenChange 
}: { 
  hashtag: string | null; 
  nicheId: string | null;
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["hashtag_reasoning", hashtag, nicheId],
    queryFn: async () => {
      if (!hashtag || !nicheId) return null;
      const res = await apiFetch(`/api/hashtags/${encodeURIComponent(hashtag.replace("#", ""))}/reasoning?niche_id=${encodeURIComponent(nicheId)}`);
      if (!res.ok) throw new Error("Failed to load reasoning");
      return res.json();
    },
    enabled: !!hashtag && !!nicheId && open,
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="w-[300px] mt-0 h-full fixed bottom-0 right-0 left-auto rounded-none border-l overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle className="text-xl">{hashtag}</DrawerTitle>
          <DrawerDescription>Niche: {nicheId}</DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-6 flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing trend signals...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-destructive/10 rounded-md text-destructive text-sm">
              Failed to load trend analysis.
            </div>
          ) : data && data.key_signals ? (
            <>
              {/* Reasoning */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Why it's trending</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{data.reasoning}</p>
              </div>

              {/* Signals */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Key Signals</h4>
                <div className="space-y-2">
                  {data.key_signals.key_signals?.map((signal: any, idx: number) => (
                    <div key={idx} className="bg-accent/40 rounded p-2 text-xs">
                      <span className="font-semibold text-foreground block">{signal.signal}</span>
                      <span className="text-muted-foreground">{signal.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-accent/40 rounded p-2 flex flex-col items-center justify-center text-center">
                  <TrendingUp className="h-4 w-4 mb-1 text-info" />
                  <span className="text-[10px] uppercase text-muted-foreground">Momentum</span>
                  <span className="text-xs font-semibold">{data.key_signals.momentum}</span>
                </div>
                <div className="bg-accent/40 rounded p-2 flex flex-col items-center justify-center text-center">
                  <Clock className="h-4 w-4 mb-1 text-warning" />
                  <span className="text-[10px] uppercase text-muted-foreground">Sensitivity</span>
                  <span className="text-xs font-semibold text-center">{data.key_signals.time_sensitivity}</span>
                </div>
              </div>

              <div className="bg-accent/40 rounded p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold block text-primary mb-1">Trend Type</span>
                  <span className="text-muted-foreground">{data.key_signals.trend_type?.replace(/_/g, " ")}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <DrawerFooter className="pt-2 border-t border-border/50">
          <Button 
            disabled={isLoading || !data}
            onClick={() => {
              onOpenChange(false);
              navigate(`/app/strategy/hashtag/${encodeURIComponent(hashtag?.replace("#", "") || "")}?niche=${encodeURIComponent(nicheId || "")}`);
            }}
          >
            Get Full Strategy &rarr;
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
