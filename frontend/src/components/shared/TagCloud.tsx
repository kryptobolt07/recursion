interface TagCloudProps {
  tags: string[];
  variant?: "default" | "positive" | "negative";
}

export default function TagCloud({ tags, variant = "default" }: TagCloudProps) {
  const colorClass =
    variant === "positive"
      ? "bg-success/10 text-success border-success/20"
      : variant === "negative"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-accent text-accent-foreground border-border";

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`px-2 py-1 text-xs rounded-md border ${colorClass}`}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
