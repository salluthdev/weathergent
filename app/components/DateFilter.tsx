"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface DateFilterProps {
  initialDate: string;
  timezone: string;
}

export default function DateFilter({ initialDate, timezone }: DateFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCalendar, setShowCalendar] = useState(false);

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
    setShowCalendar(false);
  };

  const renderMonth = (monthOffset: number) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const monthName = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    const days = [];
    // Add empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Add actual days
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
          className={`h-8 w-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center
            ${isSelected 
              ? "bg-[#3d5516] text-[#c8ea8e] shadow-md scale-110" 
              : isToday
                ? "bg-[#c8ea8e] text-[#3d5516] ring-2 ring-[#3d5516]/20"
                : "hover:bg-[#3d5516]/10 text-[#3d5516]/70 hover:text-[#3d5516]"
            }
          `}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="flex flex-col gap-3 min-w-[180px]">
        <div className="text-center font-black text-[#3d5516] text-[10px] uppercase tracking-tighter opacity-40">
          {monthName} {year}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
            <div key={day} className="h-8 w-8 flex items-center justify-center text-[9px] font-black text-[#3d5516]/30">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  // Human readable display for the trigger button
  const displayDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return "Select Date";
    const y = dateStr.slice(0, 4);
    const m = parseInt(dateStr.slice(4, 6)) - 1;
    const d = parseInt(dateStr.slice(6, 8));
    return new Date(parseInt(y), m, d).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="flex items-center gap-3 bg-white/40 backdrop-blur-md border border-white/20 p-2 pl-4 pr-3 rounded-xl shadow-sm hover:bg-white/60 transition-all group"
      >
        <div className="flex flex-col items-start">
          <span className="text-[9px] font-black text-[#3d5516]/40 uppercase tracking-widest leading-none mb-1">
            Data Context
          </span>
          <span className="text-sm font-bold text-[#3d5516]">
            {displayDate(initialDate)}
          </span>
        </div>
        <div className="p-1.5 rounded-lg bg-[#3d5516]/5 text-[#3d5516]/40 group-hover:bg-[#3d5516]/10 group-hover:text-[#3d5516] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
      </button>

      {showCalendar && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowCalendar(false)} 
          />
          <div className="absolute right-0 top-full mt-3 z-50 p-6 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl flex flex-col md:flex-row gap-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row gap-8">
                {renderMonth(-1)}
                {renderMonth(0)}
              </div>
              <div className="pt-4 border-t border-[#3d5516]/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-[#3d5516]" />
                     <span className="text-[9px] font-bold text-[#3d5516]/40 uppercase">Selected</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-[#c8ea8e]" />
                     <span className="text-[9px] font-bold text-[#3d5516]/40 uppercase">Today</span>
                   </div>
                </div>
                <button 
                  onClick={() => handleDateSelect(todayStr)}
                  className="text-[10px] font-black text-[#3d5516] uppercase hover:underline"
                >
                  Back to Today
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
