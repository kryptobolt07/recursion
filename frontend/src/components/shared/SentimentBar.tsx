interface SentimentBarProps {
  positive: number;
  neutral: number;
  critical: number;
  showLabels?: boolean;
}

export default function SentimentBar({ positive, neutral, critical, showLabels = true }: SentimentBarProps) {
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden">
        <div
          className="bg-success transition-all"
          style={{ width: `${positive}%` }}
        />
        <div
          className="bg-muted-foreground/40 transition-all"
          style={{ width: `${neutral}%` }}
        />
        <div
          className="bg-destructive transition-all"
          style={{ width: `${critical}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
          <span className="text-success">{positive}% positive</span>
          <span>{neutral}% neutral</span>
          <span className="text-destructive">{critical}% critical</span>
        </div>
      )}
    </div>
  );
}
