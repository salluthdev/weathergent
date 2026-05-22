"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface DateFilterProps {
  initialDate: string;
  timezone: string;
  citySlug: string;
  preferredUnit: "C" | "F";
}

interface DailyMax {
  maxC: number;
  timestamp: number;
}

export default function DateFilter({
  initialDate,
  timezone,
  citySlug,
  preferredUnit,
}: DateFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialRefDate = () => {
    const y = parseInt(initialDate.slice(0, 4));
    const m = parseInt(initialDate.slice(4, 6)) - 1;
    return new Date(y, m, 1);
  };

  const [viewDate, setViewDate] = useState(getInitialRefDate());
  const [dailyMax, setDailyMax] = useState<Record<string, DailyMax>>({});
  const [loading, setLoading] = useState(false);

  const monthKey = `${viewDate.getFullYear()}${(viewDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/city-daily-max?city=${citySlug}&month=${monthKey}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.success) {
          setDailyMax(data.days || {});
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [citySlug, monthKey]);

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

  const toF = (c: number) => parseFloat(((c * 9) / 5 + 32).toFixed(1));
  const formatTemp = (c: number) =>
    preferredUnit === "F" ? `${toF(c)}°` : `${c}°`;

  const formatHourLocal = (ts: number) =>
    new Date(ts * 1000).toLocaleString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const formatFullLocal = (ts: number) =>
    new Date(ts * 1000).toLocaleString("en-US", {
      timeZone: timezone,
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

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
      days.push(<div key={`empty-${i}`} className="h-14 w-full" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const currentMonth = (viewDate.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const currentDay = d.toString().padStart(2, "0");
      const dateStr = `${year}${currentMonth}${currentDay}`;

      const isSelected = dateStr === initialDate;
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const stat = dailyMax[dateStr];

      const title = stat
        ? `Max ${formatTemp(stat.maxC)} at ${formatFullLocal(stat.timestamp)}`
        : undefined;

      days.push(
        <button
          key={d}
          onClick={() => handleDateSelect(dateStr)}
          title={title}
          className={`h-14 w-full rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 leading-none px-1
            ${
              isSelected
                ? "bg-[#3d5516] text-[#c8ea8e] shadow-md scale-105 z-10"
                : isToday
                  ? "bg-[#c8ea8e] text-[#3d5516] ring-1 ring-[#3d5516]/20"
                  : "hover:bg-[#3d5516]/10 text-[#3d5516] hover:text-[#3d5516]"
            }
          `}
        >
          <span
            className={`text-sm font-black ${
              isSelected ? "" : "text-[#3d5516]"
            }`}
          >
            {d}
          </span>
          {isPast && stat ? (
            <span
              className={`text-[11px] font-black ${
                isSelected ? "opacity-90" : "opacity-80"
              }`}
            >
              {formatTemp(stat.maxC)}
            </span>
          ) : isPast && !loading ? (
            <span className="text-[10px] font-bold opacity-20">—</span>
          ) : null}
          {isPast && stat ? (
            <span
              className={`text-[9px] font-semibold tracking-wide ${
                isSelected ? "opacity-70" : "opacity-50"
              }`}
            >
              {formatHourLocal(stat.timestamp)}
            </span>
          ) : null}
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

          <span className="font-black text-[#3d5516] text-xs uppercase tracking-widest opacity-50">
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
        <div className="grid grid-cols-7 gap-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div
              key={`${day}-${i}`}
              className="h-6 w-full flex items-center justify-center text-[10px] font-black text-[#3d5516]/30 uppercase"
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
