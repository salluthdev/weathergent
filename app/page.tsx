"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { CITIES } from "@/lib/config";

function getDynamicPolymarketUrl(polySlug: string, timezone: string) {
  const now = new Date().toLocaleString("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const parts = now.replace(",", "").split(" ");
  const month = parts[0].toLowerCase();
  const day = parts[1];
  const year = parts[2];

  return `https://polymarket.com/event/highest-temperature-in-${polySlug}-on-${month}-${day}-${year}`;
}

function CityDateTime({ timezone }: { timezone: string }) {
  const [data, setData] = useState({
    time: "",
    date: "",
    countdown: "",
    timeOfDay: "",
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();

      // Get local time string
      const timeStr = now.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Get local date string
      const dateStr = now.toLocaleDateString("en-US", {
        timeZone: timezone,
        month: "short",
        day: "numeric",
      });

      // Calculate countdown to midnight
      const localNow = new Date(
        now.toLocaleString("en-US", { timeZone: timezone }),
      );
      const midnight = new Date(localNow);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - localNow.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const countdownStr = `${hours}h ${minutes}m`;

      // Determine Time of Day (Simplified to 3)
      const hour24 = localNow.getHours();
      let tod = "night";
      if (hour24 >= 6 && hour24 < 17) tod = "morning";
      else if (hour24 >= 17 && hour24 < 21) tod = "evening";

      setData({
        time: timeStr,
        date: dateStr,
        countdown: countdownStr,
        timeOfDay: tod,
      });
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [timezone]);

  const isNight = data.timeOfDay === "night";

  return (
    <div className="flex flex-col items-end leading-none gap-1">
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${isNight ? "bg-white/10" : "bg-black/5"}`}
      >
        <span
          className={`text-[10px] font-black text-right ${isNight ? "text-[#c8ea8e]" : "text-[#3d5516] opacity-60"}`}
        >
          {data.time}
        </span>
        <span className="text-[10px]" title={data.timeOfDay}>
          {data.timeOfDay === "morning"
            ? "☀️"
            : data.timeOfDay === "evening"
              ? "🌅"
              : "🌙"}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span
          className={`text-[9px] font-black uppercase text-right tracking-tighter ${isNight ? "text-[#c8ea8e]/80" : "text-red-600/60"}`}
        >
          Ends in: {data.countdown}
        </span>
        <span
          className={`text-[9px] font-bold uppercase tracking-tight mt-0.5 ${isNight ? "text-[#c8ea8e]/30" : "text-[#3d5516] opacity-20"}`}
        >
          {data.date}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");

  const filteredCities = useMemo(() => {
    const list = CITIES.filter(
      (city) =>
        city.name.toLowerCase().includes(search.toLowerCase()) ||
        city.icao.toLowerCase().includes(search.toLowerCase()),
    );

    // Sort by current local time descending (almost end of day first)
    return [...list].sort((a, b) => {
      const getOffset = (tz: string) => {
        const now = new Date();
        const local = new Date(now.toLocaleString("en-US", { timeZone: tz }));
        const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
        return local.getTime() - utc.getTime();
      };
      return getOffset(b.timezone) - getOffset(a.timezone);
    });
  }, [search]);

  const groupedCities = useMemo(() => {
    const groups: Record<string, typeof CITIES> = {};

    filteredCities.forEach((city) => {
      const now = new Date();
      const local = new Date(
        now.toLocaleString("en-US", { timeZone: city.timezone }),
      );
      const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
      const offsetHours = Math.round(
        (local.getTime() - utc.getTime()) / (1000 * 60 * 60),
      );
      const offsetKey =
        offsetHours >= 0 ? `UTC+${offsetHours}` : `UTC${offsetHours}`;

      if (!groups[offsetKey]) groups[offsetKey] = [];
      groups[offsetKey].push(city);
    });

    // Sort groups so that the earliest ending timezones (UTC+14 etc) come first
    return Object.keys(groups)
      .sort((a, b) => {
        const parseOffset = (key: string) => parseInt(key.replace("UTC", ""));
        return parseOffset(b) - parseOffset(a);
      })
      .reduce(
        (acc, key) => {
          acc[key] = groups[key];
          return acc;
        },
        {} as Record<string, typeof CITIES>,
      );
  }, [filteredCities]);

  return (
    <div className="flex flex-col gap-12 p-4 md:p-8 min-h-screen bg-[#f8faf4]">
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-[#3d5516] tracking-tight">
            WEATHERGENT
          </h1>
          <div className="text-sm font-bold text-[#3d5516]/40 uppercase tracking-widest">
            Timezone Timeline
          </div>
        </div>

        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-[#3d5516]/30 group-focus-within:text-[#3d5516] transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search City or Station..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#3d5516]/5 rounded-2xl text-[#3d5516] placeholder-[#3d5516]/30 focus:outline-none focus:ring-2 focus:ring-[#c8ea8e] focus:border-transparent shadow-sm transition-all duration-300 font-medium"
          />
        </div>
      </div>

      <div className="flex flex-col gap-16 px-4">
        {Object.entries(groupedCities).map(([offset, cities]) => (
          <div key={offset} className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#3d5516] opacity-40">
                {offset} Group
              </h2>
              <div className="h-px flex-1 bg-[#3d5516]/5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cities.map((city) => {
                // Calculate color class based on time
                const localNow = new Date(
                  new Date().toLocaleString("en-US", {
                    timeZone: city.timezone,
                  }),
                );
                const h = localNow.getHours();
                let cardStyle = "bg-white border-white";
                let textStyle = "text-[#3d5516]";
                let subStyle = "text-[#3d5516]/40";

                if (h >= 6 && h < 17) {
                  cardStyle =
                    "bg-amber-50/40 border-amber-200/20 shadow-amber-900/5";
                } else if (h >= 17 && h < 21) {
                  cardStyle =
                    "bg-orange-50/50 border-orange-200/30 shadow-orange-900/5";
                } else {
                  cardStyle =
                    "bg-[#1a2c08] border-[#3d5516]/20 shadow-black/20";
                  textStyle = "text-[#c8ea8e]";
                  subStyle = "text-[#c8ea8e]/40";
                }

                return (
                  <div
                    key={city.slug}
                    className={`p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 flex justify-between items-center gap-6 group ${cardStyle}`}
                  >
                    <Link
                      href={`/city/${city.slug}`}
                      className="flex flex-col flex-1"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p
                          className={`font-bold text-xl transition-colors ${textStyle}`}
                        >
                          {city.name}
                        </p>
                        <CityDateTime timezone={city.timezone} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c8ea8e]"></span>
                        <p
                          className={`text-xs font-bold uppercase tracking-wider ${subStyle}`}
                        >
                          {city.station} Station
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center">
                      <Link
                        href={getDynamicPolymarketUrl(
                          city.polySlug,
                          city.timezone,
                        )}
                        target="_blank"
                        className={`p-3 rounded-xl transition-all duration-300 shadow-sm hover:scale-105 active:scale-95 ${h >= 21 || h < 6 ? "bg-white/10 hover:bg-white/20" : "bg-white/60 hover:bg-white"}`}
                        title="View on Polymarket"
                      >
                        <Image
                          src={"/img/polymarket.webp"}
                          width={24}
                          height={24}
                          alt="Polymarket"
                          className={`rounded-sm transition-all duration-300 ${h >= 21 || h < 6 ? "" : "grayscale hover:grayscale-0"}`}
                        />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredCities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-[#3d5516]/40">
          <svg
            className="w-16 h-16 mb-4 opacity-20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p className="text-lg font-bold uppercase tracking-widest">
            No Cities Found
          </p>
          <p className="text-sm">
            Try searching for a different city or airport code.
          </p>
        </div>
      )}
    </div>
  );
}
