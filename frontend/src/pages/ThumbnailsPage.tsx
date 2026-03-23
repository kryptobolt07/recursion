import { Image } from "lucide-react";

export default function ThumbnailsPage() {
  const concepts = [
    { id: 1, bg: "Clean dark background with red accent glow", face: "Present — intense/focused expression", text: "3 bold words: 'NIXOS CHANGED EVERYTHING'", composition: "Face left, terminal screenshot right", rationale: "Mirrors your top 3 Linux videos which averaged 1.8× baseline. Red/dark contrast drives highest CTR in your niche." },
    { id: 2, bg: "Split comparison layout — dark vs light", face: "Absent — product/screen focused", text: "2 words: 'VS BATTLE' with competitor logos", composition: "50/50 split, logos centered", rationale: "Comparison thumbnails in Hardware niche average 1.4× more clicks. HW Unboxed uses this pattern for 65% of viral content." },
    { id: 3, bg: "Gradient purple-to-dark with tech elements", face: "Present — surprised/excited", text: "4 words: 'THIS AI IS INSANE'", composition: "Face center-right, AI visualization left", rationale: "AI niche thumbnails with faces see 28% higher CTR. Purple gradient is underused in your channel but dominant in AI Forge's top videos." },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Thumbnail Suggestions</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-generated thumbnail concepts based on your niche's winning patterns</p>
      </div>

      <div className="stat-card">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter video title for thumbnail concepts..."
            className="flex-1 bg-accent border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Image className="w-4 h-4" />
            Generate
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {concepts.map((c) => (
          <div key={c.id} className="stat-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{c.id}</span>
              <h3 className="text-sm font-medium text-foreground">Concept {c.id}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Background</p><p className="text-foreground">{c.bg}</p></div>
              <div><p className="text-xs text-muted-foreground">Face</p><p className="text-foreground">{c.face}</p></div>
              <div><p className="text-xs text-muted-foreground">Text Overlay</p><p className="text-foreground">{c.text}</p></div>
              <div><p className="text-xs text-muted-foreground">Composition</p><p className="text-foreground">{c.composition}</p></div>
            </div>
            <div className="mt-3 bg-accent/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{c.rationale}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
