import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import DateFilter from "@/app/components/DateFilter";
import { getCityBySlug } from "@/lib/config";
import { getWeatherFromDb, syncCityData } from "@/lib/weather-service";
import ForecastHistoryPopup from "@/app/components/ForecastHistoryPopup";
import ObservationDetailPopup from "@/app/components/ObservationDetailPopup";
import TemperatureChart from "@/app/components/TemperatureChart";

const API_KEY = "e1f10a1e78da46f5b10a1e78da96f525";

async function getHistoricalWeather(station: string, date: string) {
  const url = `https://api.weather.com/v1/location/${station}/observations/historical.json?apiKey=${API_KEY}&units=m&startDate=${date}&endDate=${date}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

async function getDailyForecast(icao: string) {
  const url = `https://api.weather.com/v3/wx/forecast/daily/3day?apiKey=${API_KEY}&icaoCode=${icao}&units=m&language=en-US&format=json`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

async function getHourlyForecast(icao: string) {
  const url = `https://api.weather.com/v3/wx/forecast/hourly/2day?apiKey=${API_KEY}&icaoCode=${icao}&units=m&language=en-US&format=json`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

async function getAviationHistory(icao: string) {
  const url = `https://aviationweather.gov/api/data/metar?ids=${icao}&format=json&hours=240`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

export default async function CityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const { date: queryDate } = await searchParams;
  const cityData = getCityBySlug(slug);

  if (!cityData) {
    notFound();
  }

  // Default to the current date in the city's timezone if no date provided
  const targetDate =
    queryDate ||
    (() => {
      const now = new Date().toLocaleString("en-US", {
        timeZone: cityData.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const [m, d, y] = now.split("/");
      return `${y}${m}${d}`;
    })();

  // Use DB-First strategy
  const dbResult = await getWeatherFromDb(cityData, targetDate);

  let hourlyReport = dbResult?.hourlyReport || [];
  let baseTime = dbResult?.baseTime || 0;
  
  // Consider it a 'DB hit' only if it has the full 30-min resolution (48 slots)
  // This forces an upgrade for older 24-slot records.
  let isFromDb = !!dbResult && hourlyReport.length >= 48;

  // If loading from DB, ensure we have a full 48-slot (30-min) timeline
  if (isFromDb && hourlyReport.length > 0) {
    const fullTimeline = Array.from({ length: 48 }, (_, i) => {
      const slotTimestamp = baseTime + i * 1800;
      const existing = hourlyReport.find((r: any) => r.timestamp === slotTimestamp);
      
      // Inheritance logic: If no forecast for this slot, look at the previous slot's forecast
      let inheritedForecast = existing?.wuForecast || null;
      if (!inheritedForecast && i > 0) {
        // Look back up to 2 slots (1 hour) to find a forecast to inherit
        const prevSlot = hourlyReport.find((r: any) => r.timestamp === slotTimestamp - 1800);
        if (prevSlot?.wuForecast) {
          inheritedForecast = prevSlot.wuForecast;
        }
      }

      return existing || {
        timestamp: slotTimestamp,
        wuHistory: null,
        wuForecast: inheritedForecast,
        aviationHistory: null,
        forecastHistoryWu: [],
        forecastUpdatedAtWu: null,
        wuExactTime: null,
        wuSyncedAt: null,
        aviationExactTime: null,
        aviationSyncedAt: null,
      };
    });
    hourlyReport = fullTimeline;
  }

  // Fallback to Live API if no database data found (or if it needs an upgrade)
  if (!isFromDb) {
    console.log(
      `[UI] Syncing/Upgrading data for ${cityData.name} on ${targetDate}...`,
    );
    const syncResult = await syncCityData(cityData, targetDate);
    if (syncResult.success) {
      // Re-fetch from DB to get the newly synced/upserted records
      const updatedDbResult = await getWeatherFromDb(cityData, targetDate);
      if (updatedDbResult) {
        hourlyReport = updatedDbResult.hourlyReport;
        baseTime = updatedDbResult.baseTime;
        isFromDb = true;
      }
    }
  }

  // If still no data after sync attempt, we handle it in the UI
  if (hourlyReport.length === 0) {
    // This part should technically be redundant if syncCityData works,
    // but we keep it as a safety measure for the UI layout.
    hourlyReport = Array.from({ length: 48 }, (_, i) => ({
      timestamp: baseTime + i * 1800,
      wuHistory: null,
      wuForecast: null,
      aviationHistory: null,
      forecastHistoryWu: [],
      forecastUpdatedAtWu: null,
      wuExactTime: null,
      wuSyncedAt: null,
      aviationExactTime: null,
      aviationSyncedAt: null,
    }));
  }

  // Common UI State Logic (Unified for both DB and API sources)
  const cityObservations = hourlyReport
    .filter((h: any) => h.wuHistory)
    .map((h: any) => ({ ...h.wuHistory, valid_time_gmt: h.timestamp }));

  const hasData = cityObservations.length > 0;
  const temps = cityObservations.map((obs: any) => obs.temp);
  const maxTemp =
    hourlyReport.length > 0
      ? Math.max(
          ...hourlyReport.map((h: any) => h.wuHistory?.temp ?? -Infinity),
        )
      : null;
  const minTemp =
    hourlyReport.length > 0
      ? Math.min(...hourlyReport.map((h: any) => h.wuHistory?.temp ?? Infinity))
      : null;

  const forecastMax =
    hourlyReport.length > 0
      ? Math.max(
          ...hourlyReport.map((h: any) => h.wuForecast?.temp ?? -Infinity),
        )
      : null;
  const forecastMin =
    hourlyReport.length > 0
      ? Math.min(
          ...hourlyReport.map((h: any) => h.wuForecast?.temp ?? Infinity),
        )
      : null;

  const toF = (c: number) => parseFloat(((c * 9) / 5 + 32).toFixed(1));

  const formatTemp = (c: number | null) => {
    if (c === null) return "-";
    return cityData.preferredUnit === "F" ? `${toF(c)}°F` : `${c}°C`;
  };

  // Find the last occurrence of max values for highlighting
  const lastMaxHistoryIdx = hourlyReport.reduce((acc, curr, idx) => 
    (curr.wuHistory?.temp === maxTemp && maxTemp !== null) ? idx : acc, -1);
    
  const lastMaxForecastIdx = hourlyReport.reduce((acc, curr, idx) => 
    (curr.wuForecast?.temp === forecastMax && forecastMax !== null) ? idx : acc, -1);

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8 gap-8 animate-in fade-in duration-700 pb-20!">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-full bg-white/50 group-hover:bg-white transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </div>
            <span className="font-medium text-[#3d5516]/80 group-hover:text-[#3d5516]">
              Back
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-[#3d5516]">
              {cityData.name}
            </h1>
            <div className="px-3 py-1 rounded-full bg-[#3d5516] text-[#c8ea8e] text-xs font-bold uppercase tracking-widest">
              {cityData.icao}
            </div>
            {isFromDb && (
              <span className="text-[10px] font-black text-[#3d5516]/30 uppercase bg-white/40 px-2 py-0.5 rounded border border-black/5">
                Verified Record
              </span>
            )}
          </div>
        </div>
        <DateFilter initialDate={targetDate} />
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Summary Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-white/40 backdrop-blur-md border border-white/20 shadow-xl flex flex-col gap-4 text-[#3d5516]">
            <h2 className="text-lg font-bold opacity-60 uppercase tracking-tight">
              {hasData
                ? new Date(
                    cityObservations[0].valid_time_gmt * 1000,
                  ).toLocaleDateString("en-US", {
                    weekday: "long",
                    timeZone: cityData.timezone,
                  })
                : "Summary"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/60">
                <p className="text-[10px] font-black opacity-40 uppercase mb-1">
                  Max History (WU)
                </p>
                <p className="text-lg font-bold">
                  {formatTemp(maxTemp)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/60">
                <p className="text-[10px] font-black opacity-40 uppercase mb-1">
                  Min History (WU)
                </p>
                <p className="text-lg font-bold">
                  {formatTemp(minTemp)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#c8ea8e] shadow-sm">
                <p className="text-[10px] font-black opacity-40 uppercase mb-1">
                  Max Forecast (WU)
                </p>
                <p className="text-lg font-bold">
                  {formatTemp(forecastMax)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#c8ea8e] shadow-sm">
                <p className="text-[10px] font-black opacity-40 uppercase mb-1">
                  Min Forecast (WU)
                </p>
                <p className="text-lg font-bold">
                  {formatTemp(forecastMin)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white/40 backdrop-blur-md border border-white/20 shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#3d5516]">
              24h Temperature Trend {hasData ? "" : "(No Data Available)"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#3d5516]"></span>
              <span className="text-xs font-medium text-[#3d5516]/60">
                {cityData.preferredUnit === "F" ? "Fahrenheit" : "Celsius"}
              </span>
            </div>
          </div>

          <TemperatureChart 
            data={cityObservations}
            minTemp={minTemp}
            maxTemp={maxTemp}
            timezone={cityData.timezone}
            preferredUnit={cityData.preferredUnit}
          />
        </div>
      </main>

      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-bold text-[#3d5516]">
          Detailed Observations
        </h2>
        <div className="overflow-hidden rounded-2xl bg-white/40 backdrop-blur-md border border-white/20 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#3d5516] text-[#c8ea8e]">
                  <th className="p-4 font-semibold">City Time</th>
                  <th className="p-4 font-semibold">WIB Time</th>
                  <th className="p-4 font-semibold">Temp. History (WU)</th>
                  <th className="p-4 font-semibold">
                    Temp. History (Aviation)
                  </th>
                  <th className="p-4 font-semibold">Temp. Forecast (WU)</th>
                  <th className="p-4 font-semibold">Condition History (WU)</th>
                  <th className="p-4 font-semibold">Condition Forecast (WU)</th>
                  <th className="p-4 font-semibold text-orange-200 text-right">
                    WU History vs Aviation History
                  </th>
                  <th className="p-4 font-semibold text-orange-200 text-right">
                    WU History vs WU Forecast
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d5516]/10">
                {hourlyReport.length > 0 ? (
                  hourlyReport.map((item: any, idx: number) => (
                    <tr
                      key={idx}
                      className="hover:bg-white/40 transition-colors"
                    >
                      <td className="p-4 text-[#3d5516] font-medium text-xs">
                        {new Date(item.timestamp * 1000).toLocaleString(
                          "en-US",
                          {
                            timeZone: cityData.timezone,
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          },
                        )}
                      </td>
                      <td className="p-4 text-[#3d5516]/60 text-xs">
                        {(() => {
                          const date = new Date(item.timestamp * 1000);
                          const standard = date.toLocaleString("en-US", {
                            timeZone: "Asia/Jakarta",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          const twentyFourHour = date.toLocaleString("en-US", {
                            timeZone: "Asia/Jakarta",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          });
                          return `${standard} (${twentyFourHour} WIB)`;
                        })()}
                      </td>
                      <td className={`p-4 font-bold text-[#3d5516] transition-all ${idx === lastMaxHistoryIdx ? "bg-orange-400/20 ring-1 ring-orange-400/30 rounded-sm" : ""}`}>
                        <div className="flex items-center gap-1">
                          <span>
                            {formatTemp(item.wuHistory?.temp ?? null)}
                          </span>
                          {item.wuHistory && (
                            <ObservationDetailPopup 
                              temp={item.wuHistory.temp}
                              exactTime={item.wuExactTime}
                              syncedAt={item.wuSyncedAt}
                              source="WU"
                              preferredUnit={cityData.preferredUnit}
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-[#3d5516] bg-blue-500/5">
                        <div className="flex items-center gap-1">
                          <span>
                            {formatTemp(item.aviationHistory?.temp ?? null)}
                          </span>
                          {item.aviationHistory && (
                            <ObservationDetailPopup 
                              temp={item.aviationHistory.temp}
                              exactTime={item.aviationExactTime}
                              syncedAt={item.aviationSyncedAt}
                              source="Aviation"
                              preferredUnit={cityData.preferredUnit}
                            />
                          )}
                        </div>
                      </td>
                      <td className={`p-4 text-[#3d5516]/70 font-bold transition-all ${idx === lastMaxForecastIdx ? "bg-orange-400/30 ring-1 ring-orange-400/40 rounded-sm" : "bg-[#c8ea8e]/10"}`}>
                        <div className="flex items-center gap-1">
                          <span>
                            {formatTemp(item.wuForecast?.temp ?? null)}
                          </span>
                          <ForecastHistoryPopup
                            history={item.forecastHistoryWu}
                            current={item.wuForecast}
                            updatedAt={item.forecastUpdatedAtWu}
                            timezone={cityData.timezone}
                            cityName={cityData.name}
                            preferredUnit={cityData.preferredUnit}
                          />
                        </div>
                      </td>
                      <td className="p-4 text-[#3d5516]/80 text-sm">
                        {item.wuHistory?.condition ||
                          item.wuHistory?.wx_phrase ||
                          "-"}
                      </td>
                      <td className="p-4 text-[#3d5516]/80 text-sm italic opacity-70">
                        {item.wuForecast?.condition ||
                          item.wuForecast?.phrase ||
                          "-"}
                      </td>
                      <td className="p-4 font-bold text-[#3d5516]/80 bg-orange-500/5 text-right">
                        {item.wuHistory && item.aviationHistory
                          ? (() => {
                              const diff = (
                                item.wuHistory.temp - item.aviationHistory.temp
                              ).toFixed(1);
                              const prefix = parseFloat(diff) > 0 ? "+" : "";
                              return `${prefix}${diff}°C`;
                            })()
                          : "-"}
                      </td>
                      <td className="p-4 font-bold text-[#3d5516]/80 bg-orange-500/5 text-right">
                        {item.wuHistory && item.wuForecast
                          ? (() => {
                              const diff = (
                                item.wuHistory.temp - item.wuForecast.temp
                              ).toFixed(1);
                              const prefix = parseFloat(diff) > 0 ? "+" : "";
                              return `${prefix}${diff}°C`;
                            })()
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-12 text-center text-[#3d5516]/40 italic font-medium"
                    >
                      No historical or forecast data found for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
