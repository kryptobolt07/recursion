import { useNavigate } from "react-router-dom";
import { niches, formatNumber } from "@/data/mockData";

export default function NicheBlockChart() {
  const navigate = useNavigate();

  const nicheColorClasses: Record<number, string> = {
    1: "from-red-600 to-red-700",
    2: "from-blue-600 to-blue-700",
    3: "from-green-600 to-green-700",
    4: "from-amber-600 to-amber-700",
    5: "from-purple-600 to-purple-700",
  };

  return (
    <div>
      <h2 className="section-header">Niche Distribution</h2>
      <div className="flex gap-2 h-40">
        {niches.map((niche) => (
          <div
            key={niche.id}
            onClick={() => navigate(`/app/niche/${niche.id}`)}
            className={`niche-block bg-gradient-to-b ${nicheColorClasses[niche.colorIndex] || "from-gray-600 to-gray-700"} flex flex-col justify-between relative overflow-hidden`}
            style={{ flex: niche.uploadShare }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="relative z-10">
              <p className="text-sm font-bold text-primary-foreground">{niche.name}</p>
              <p className="text-xs text-primary-foreground/80">{niche.uploadShare}% of uploads</p>
            </div>
            <div className="relative z-10">
              <p className="text-lg font-bold text-primary-foreground">{formatNumber(niche.avgViews)}</p>
              <p className="text-[10px] text-primary-foreground/70">avg views</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
