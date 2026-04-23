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
  const [dateTime, setDateTime] = useState({ time: "", date: "" });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDateTime({
        time: now.toLocaleTimeString("en-US", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        date: now.toLocaleDateString("en-US", {
          timeZone: timezone,
          month: "short",
          day: "numeric",
        }),
      });
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className="flex flex-col items-end leading-none">
      <span className="text-[10px] font-black text-[#3d5516] opacity-30">
        {dateTime.time}
      </span>
      <span className="text-[9px] font-bold text-[#3d5516] opacity-20 uppercase tracking-tight mt-0.5">
        {dateTime.date}
      </span>
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");

  const filteredCities = useMemo(() => {
    return CITIES.filter(
      (city) =>
        city.name.toLowerCase().includes(search.toLowerCase()) ||
        city.icao.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  const groupedCities = useMemo(() => {
    const groups: Record<string, typeof CITIES> = {};
    filteredCities.forEach((city) => {
      let region = city.timezone.split("/")[0] || "Other";
      // Clean up common region names
      if (region === "America") region = "Americas";
      if (!groups[region]) groups[region] = [];
      groups[region].push(city);
    });
    // Sort regions alphabetically
    return Object.keys(groups)
      .sort()
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
            Settlement Intelligence
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
        {Object.entries(groupedCities).map(([region, cities]) => (
          <div key={region} className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#3d5516] opacity-40">
                {region}
              </h2>
              <div className="h-px flex-1 bg-[#3d5516]/5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cities.map((city) => (
                <div
                  key={city.slug}
                  className="p-6 rounded-2xl bg-white border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(61,85,22,0.1)] hover:border-[#3d5516]/10 transition-all duration-300 flex justify-between items-center gap-6 group"
                >
                  <Link
                    href={`/city/${city.slug}`}
                    className="flex flex-col flex-1"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-xl text-[#3d5516] group-hover:text-[#3d5516] transition-colors">
                        {city.name}
                      </p>
                      <CityDateTime timezone={city.timezone} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c8ea8e]"></span>
                      <p className="text-xs font-bold text-[#3d5516]/40 uppercase tracking-wider">
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
                      className="p-3 rounded-xl bg-[#f0f4e8] hover:bg-[#c8ea8e]/40 transition-all duration-300 shadow-sm hover:scale-105 active:scale-95"
                      title="View on Polymarket"
                    >
                      <Image
                        src={"/img/polymarket.webp"}
                        width={24}
                        height={24}
                        alt="Polymarket"
                        className="rounded-sm grayscale hover:grayscale-0 transition-all duration-300"
                      />
                    </Link>
                  </div>
                </div>
              ))}
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
