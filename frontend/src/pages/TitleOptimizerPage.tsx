import { useState } from "react";
import { niches } from "@/data/mockData";
import { Wand2, Copy } from "lucide-react";

const sampleTitles = [
  { original: "My NixOS Setup", variants: [
    { title: "7 NixOS Modules That Will Transform Your System", formula: "Number + Noun + Outcome", reach: 92, chars: 49, words: 8 },
    { title: "How I Built the Perfect NixOS Config in 2025", formula: "How I + Verb + Result", reach: 85, chars: 46, words: 9 },
    { title: "NixOS Setup Guide — Everything You Need to Know", formula: "Topic + Comprehensive Tag", reach: 78, chars: 49, words: 8 },
    { title: "Is NixOS Worth It? My Honest 6-Month Review", formula: "Question + Time Frame", reach: 88, chars: 45, words: 9 },
    { title: "I Switched to NixOS and Can't Go Back", formula: "Personal Story + Hook", reach: 95, chars: 38, words: 9 },
  ]},
];

export default function TitleOptimizerPage() {
  const [input, setInput] = useState("");
  const [showResults, setShowResults] = useState(true);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Title Optimizer</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate high-performing title variants using proven formulas</p>
      </div>

      <div className="stat-card">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a video title to optimize..."
            className="flex-1 bg-accent border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={() => setShowResults(true)}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Optimize
          </button>
        </div>
      </div>

      {showResults && sampleTitles.map((sample) => (
        <div key={sample.original} className="stat-card">
          <p className="text-xs text-muted-foreground mb-1">ORIGINAL</p>
          <p className="text-sm font-medium text-foreground mb-4">{sample.original}</p>
          <p className="text-xs text-muted-foreground mb-3">OPTIMIZED VARIANTS</p>
          <div className="space-y-3">
            {sample.variants.map((v, i) => (
              <div key={i} className="bg-accent/50 rounded-lg p-3 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{v.title}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Formula: {v.formula}</span>
                    <span>{v.chars} chars</span>
                    <span>{v.words} words</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${v.reach}%` }} />
                    </div>
                    <span className="text-xs font-medium text-primary">{v.reach}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">reach score</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-accent/30 rounded-lg p-3">
            <p className="text-xs font-medium text-foreground mb-1">A/B Test Suggestion</p>
            <p className="text-xs text-muted-foreground">Test variant #5 vs #1 — personal story hooks consistently outperform number-based titles in your Linux niche by ~12%.</p>
          </div>
        </div>
      ))}
    </div>
  );
}
