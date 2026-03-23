import { useState, useEffect, useMemo } from "react";
import { format, subDays } from "date-fns";

// Types for our data
export interface ReachDataPoint {
  date: Date;
  reach: number;
  level: 0 | 1 | 2 | 3 | 4; 
}

export default function ReachCalendar({ data = [] }: { data?: ReachDataPoint[] }) {
  const calendarData = useMemo(() => {
    if (data.length > 0) return data;

    const mock: ReachDataPoint[] = [];
    const today = new Date();
    
    const pseudoRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    for (let i = 364; i >= 0; i--) {
      const d = subDays(today, i);
      const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      
      const isPostDay = pseudoRandom(seed) > 0.75;
      let reach = 0;
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      
      if (isPostDay) {
        const r = pseudoRandom(seed * 2); 
        if (r > 0.90) { reach = Math.floor(pseudoRandom(seed * 3) * 500000 + 100000); level = 4; }
        else if (r > 0.70) { reach = Math.floor(pseudoRandom(seed * 3) * 80000 + 20000); level = 3; }
        else if (r > 0.40) { reach = Math.floor(pseudoRandom(seed * 3) * 15000 + 5000); level = 2; }
        else { reach = Math.floor(pseudoRandom(seed * 3) * 4000 + 1000); level = 1; }
      }

      mock.push({ date: d, reach, level });
    }
    return mock;
  }, [data]);

  const weeks = useMemo(() => {
      const wks: ReachDataPoint[][] = [];
      let currentWeek: ReachDataPoint[] = [];

      calendarData.forEach((day, i) => {
        if (i === 0 && day.date.getDay() !== 0) {
           for (let pad = 0; pad < day.date.getDay(); pad++) {
             currentWeek.push({ date: subDays(day.date, day.date.getDay() - pad), reach: 0, level: 0 });
           }
        }
        
        currentWeek.push(day);
        
        if (day.date.getDay() === 6 || i === calendarData.length - 1) {
          wks.push(currentWeek);
          currentWeek = [];
        }
      });
      return wks;
  }, [calendarData]);

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return "bg-primary/30 border-primary/20";
      case 2: return "bg-primary/50 border-primary/40";
      case 3: return "bg-primary/80 border-primary/60";
      case 4: return "bg-primary border-primary/80 shadow-[0_0_8px_var(--primary)]";
      default: return "bg-card border-border/50"; 
    }
  };

  return (
    <div className="flex flex-col space-y-3 p-5 rounded-xl border border-border bg-card shadow-sm w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              Reach Heatmap 
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">Daily audience reach over the last 365 days</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground hidden sm:flex bg-background/50 px-3 py-1.5 rounded-full border border-border">
          <span>Less</span>
          <div className="w-3.5 h-3.5 rounded-[3px] bg-card border border-border/50"></div>
          <div className="w-3.5 h-3.5 rounded-[3px] bg-primary/30 border border-primary/20"></div>
          <div className="w-3.5 h-3.5 rounded-[3px] bg-primary/50 border border-primary/40"></div>
          <div className="w-3.5 h-3.5 rounded-[3px] bg-primary/80 border border-primary/60"></div>
          <div className="w-3.5 h-3.5 rounded-[3px] bg-primary border border-primary/80 shadow-[0_0_8px_var(--primary)]"></div>
          <span>More</span>
        </div>
      </div>

      <div className="relative flex overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {/* Days of week labels */}
        <div className="flex flex-col space-y-1.5 mr-3 text-[11px] font-medium text-muted-foreground justify-between py-1 sticky left-0 bg-card z-10 pr-2">
          <span className="h-3.5 flex items-center invisible">Sun</span>
          <span className="h-3.5 flex items-center">Mon</span>
          <span className="h-3.5 flex items-center invisible">Tue</span>
          <span className="h-3.5 flex items-center">Wed</span>
          <span className="h-3.5 flex items-center invisible">Thu</span>
          <span className="h-3.5 flex items-center">Fri</span>
          <span className="h-3.5 flex items-center invisible">Sat</span>
        </div>

        {/* Calendar grid */}
        <div className="flex space-x-1.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col space-y-1.5">
            {week.map((day, dayIndex) => {
                const isRealDay = calendarData.some(d => d.date.toDateString() === day.date.toDateString());
                const isBlank = !isRealDay && day.level === 0;
                
                return (
                  <div
                    key={dayIndex}
                    className={`w-3.5 h-3.5 rounded-[3px] border group relative transition-all duration-300 ${getLevelColor(day.level)} hover:scale-125 hover:z-20 hover:border-foreground/50 cursor-pointer ${isBlank ? "opacity-0 cursor-default" : ""}`}
                  >
                    {/* Tooltip */}
                    {isRealDay && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-[100] w-max px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-xl border border-border">
                        <span className="font-bold text-sm tracking-tight">{day.reach > 0 ? `${day.reach.toLocaleString()} reach` : "No reach"}</span>
                        <span className="text-muted-foreground mt-0.5">{format(day.date, "MMM d, yyyy")}</span>
                        {/* Triangle pointing down */}
                        <div className="absolute -top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-b border-r border-border rotate-45 translate-y-[2.2rem]"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
