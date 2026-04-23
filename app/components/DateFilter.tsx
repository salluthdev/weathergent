"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface DateFilterProps {
  initialDate: string;
  timezone: string;
}

export default function DateFilter({ initialDate, timezone }: DateFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Helper to get date string in YYYYMMDD
  const formatDateStr = (date: Date, tz: string) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    return `${y}${m}${d}`;
  };

  const todayStr = formatDateStr(new Date(), timezone);

  const handleDateSelect = (dateStr: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("date", dateStr);
    router.push(`${pathname}?${params.toString()}`);
  };

  const renderMonth = (monthOffset: number) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const monthName = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const currentMonth = (date.getMonth() + 1).toString().padStart(2, "0");
      const currentDay = d.toString().padStart(2, "0");
      const dateStr = `${year}${currentMonth}${currentDay}`;
      
      const isSelected = dateStr === initialDate;
      const isToday = dateStr === todayStr;

      days.push(
        <button
          key={d}
          onClick={() => handleDateSelect(dateStr)}
          className={`h-10 w-10 rounded-xl text-sm font-bold transition-all flex items-center justify-center
            ${isSelected 
              ? "bg-[#3d5516] text-[#c8ea8e] shadow-lg scale-110 ring-4 ring-[#3d5516]/10 z-10" 
              : isToday
                ? "bg-[#c8ea8e] text-[#3d5516] ring-2 ring-[#3d5516]/20 hover:bg-[#c8ea8e]/80"
                : "hover:bg-[#3d5516]/10 text-[#3d5516]/70 hover:text-[#3d5516]"
            }
          `}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="flex flex-col gap-4 flex-1">
        <div className="text-center font-black text-[#3d5516] text-xs uppercase tracking-widest opacity-30">
          {monthName} {year}
        </div>
        <div className="grid grid-cols-7 gap-1 place-items-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
            <div key={day} className="h-10 w-10 flex items-center justify-center text-[10px] font-black text-[#3d5516]/20">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <section className="w-full animate-in slide-in-from-bottom-4 duration-700">
      <div className="p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white/20 shadow-xl">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
            {renderMonth(-1)}
            {renderMonth(0)}
          </div>
          
          <div className="pt-6 border-t border-[#3d5516]/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-[#3d5516] shadow-sm" />
                 <span className="text-[10px] font-black text-[#3d5516]/40 uppercase tracking-wider">Selected Context</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-[#c8ea8e] shadow-sm" />
                 <span className="text-[10px] font-black text-[#3d5516]/40 uppercase tracking-wider">Today in {timezone.split('/').pop()?.replace('_', ' ')}</span>
               </div>
            </div>
            
            <button 
              onClick={() => handleDateSelect(todayStr)}
              className="px-4 py-2 rounded-xl bg-[#3d5516]/5 text-[#3d5516] text-xs font-black uppercase tracking-widest hover:bg-[#3d5516]/10 transition-all active:scale-95"
            >
              Back to Today
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
