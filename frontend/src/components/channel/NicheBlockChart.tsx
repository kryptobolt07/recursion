import { useNavigate } from "react-router-dom";
import { niches, formatNumber } from "@/data/mockData";

export default function NicheBlockChart() {
  const navigate = useNavigate();

  const nicheColorClasses: Record<number, string> = {
    1: "bg-niche-1",
    2: "bg-niche-2",
    3: "bg-niche-3",
    4: "bg-niche-4",
    5: "bg-niche-5",
    6: "bg-niche-6",
    7: "bg-niche-7",
  };

  return (
    <div>
      <h2 className="section-header">Niche Distribution</h2>
      <div className="flex gap-2 h-40">
        {niches.map((niche) => (
          <div
            key={niche.id}
            onClick={() => navigate(`/app/niche/${niche.id}`)}
            className={`niche-block ${nicheColorClasses[niche.colorIndex] || "bg-muted"} flex flex-col justify-between relative overflow-hidden group min-w-[70px] shadow-inner`}
            style={{ flex: Math.max(niche.uploadShare, 12) }}
          >
            {/* Matte finish overlays */}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
            
            <div className="relative z-10 flex flex-col gap-0.5">
              <p className="text-xs sm:text-sm font-bold text-white leading-tight line-clamp-3 md:line-clamp-2 break-words drop-shadow-sm" title={niche.name}>
                {niche.name}
              </p>
              <p className="text-[10px] sm:text-xs text-white/80 mt-0.5 opacity-90 truncate">
                <span className="hidden sm:inline">{niche.uploadShare}% of uploads</span>
                <span className="sm:hidden">{niche.uploadShare}%</span>
              </p>
            </div>
            
            <div className="relative z-10 mt-auto pt-2">
              <p className="text-sm sm:text-lg font-bold text-white truncate tracking-tight drop-shadow-sm">
                {formatNumber(niche.avgViews)}
              </p>
              <p className="text-[9px] sm:text-[10px] text-white/70 truncate leading-none">
                <span className="hidden sm:inline">avg views</span>
                <span className="sm:hidden">views</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
