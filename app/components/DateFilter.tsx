"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

interface DateFilterProps {
  initialDate: string;
  timezone: string;
}

export default function DateFilter({ initialDate, timezone }: DateFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track the currently viewed month in the calendar
  // Use the initialDate as the starting reference
  const getInitialRefDate = () => {
    const y = parseInt(initialDate.slice(0, 4));
    const m = parseInt(initialDate.slice(4, 6)) - 1;
    return new Date(y, m, 1);
  };

  const [viewDate, setViewDate] = useState(getInitialRefDate());

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

  const changeMonth = (offset: number) => {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1),
    );
  };

  const renderMonth = () => {
    const monthName = viewDate.toLocaleString("en-US", { month: "short" });
    const year = viewDate.getFullYear();

    const firstDay = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      1,
    ).getDay();
    const daysInMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      0,
    ).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-6 w-6" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const currentMonth = (viewDate.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const currentDay = d.toString().padStart(2, "0");
      const dateStr = `${year}${currentMonth}${currentDay}`;

      const isSelected = dateStr === initialDate;
      const isToday = dateStr === todayStr;

      days.push(
        <button
          key={d}
          onClick={() => handleDateSelect(dateStr)}
          className={`h-6 w-6 rounded-lg text-[9px] font-black transition-all flex items-center justify-center
            ${
              isSelected
                ? "bg-[#3d5516] text-[#c8ea8e] shadow-md scale-110 z-10"
                : isToday
                  ? "bg-[#c8ea8e] text-[#3d5516] ring-1 ring-[#3d5516]/20"
                  : "hover:bg-[#3d5516]/10 text-[#3d5516]/60 hover:text-[#3d5516]"
            }
          `}
        >
          {d}
        </button>,
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => changeMonth(-1)}
            className="p-1 rounded hover:bg-[#3d5516]/5 text-[#3d5516]/40 hover:text-[#3d5516] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <span className="font-black text-[#3d5516] text-[8px] uppercase tracking-widest opacity-40">
            {monthName} {year}
          </span>

          <button
            onClick={() => changeMonth(1)}
            className="p-1 rounded hover:bg-[#3d5516]/5 text-[#3d5516]/40 hover:text-[#3d5516] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 place-items-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
            <div
              key={day}
              className="h-6 w-6 flex items-center justify-center text-[7px] font-black text-[#3d5516]/20"
            >
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/20 shadow-lg flex flex-col gap-4">
      {renderMonth()}
    </div>
  );
}
