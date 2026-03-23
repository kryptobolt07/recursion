import { formatNumber, getNicheColor } from "@/data/mockData";

interface StatStripProps {
  stats: { label: string; value: string | number; suffix?: string }[];
}

export default function StatStrip({ stats }: StatStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <p className="stat-value">
            {typeof stat.value === "number" ? formatNumber(stat.value) : stat.value}
            {stat.suffix && <span className="text-sm text-muted-foreground ml-1">{stat.suffix}</span>}
          </p>
          <p className="stat-label">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
