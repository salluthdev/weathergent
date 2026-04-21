import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import DateFilter from "@/app/components/DateFilter";
import { getCityBySlug } from "@/lib/config";
import { getWeatherFromSupabase } from "@/lib/weather-service";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

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

  // Use Supabase-First strategy
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const dbResult = await getWeatherFromSupabase(cityData, targetDate, supabase);

  let hourlyReport = dbResult?.hourlyReport || [];
  let baseTime = dbResult?.baseTime || 0;
  let isFromDb = !!dbResult;

  // Fallback to Live API if no database data found
  if (!isFromDb) {
    console.log(`[UI] Falling back to live API for ${cityData.name} on ${targetDate}`);
    // Fetch Historical, Daily Forecast, and Hourly Forecast in parallel
    const [historyData, dailyForecast, hourlyForecast] = await Promise.all([
      getHistoricalWeather(cityData.station, targetDate),
      getDailyForecast(cityData.icao),
      getHourlyForecast(cityData.icao),
    ]);

    const observations = historyData?.observations || [];

    // Calculate baseTime manually if fallback
    baseTime = (() => {
      const utcMidnight = Date.UTC(
        parseInt(targetDate.slice(0, 4)),
        parseInt(targetDate.slice(4, 6)) - 1,
        parseInt(targetDate.slice(6, 8))
      );
      const localTimeStr = new Date(utcMidnight).toLocaleString("en-US", {
        timeZone: cityData.timezone,
        hour12: false,
      });
      const [_, time] = localTimeStr.split(", ");
      const [h, m, s] = time.split(":").map(Number);
      const offsetSeconds = h * 3600 + m * 60 + s;
      let diff = offsetSeconds;
      if (diff > 43200) diff -= 86400;
      return (utcMidnight - diff * 1000) / 1000;
    })();

    const cityObservations = observations.filter(
      (obs: any) => obs.valid_time_gmt >= baseTime && obs.valid_time_gmt < baseTime + 86400
    );

    const getHourlyForecastEntry = (timestamp: number) => {
      if (!hourlyForecast?.validTimeUtc) return null;
      const hourIdx = hourlyForecast.validTimeUtc.findIndex(
        (t: number) => Math.abs(t - timestamp) < 1800
      );
      return hourIdx !== -1
        ? {
            temp: hourlyForecast.temperature[hourIdx],
            phrase: hourlyForecast.wxPhraseShort[hourIdx],
          }
        : null;
    };

    hourlyReport = Array.from({ length: 24 }, (_, i) => {
      const hourTimestamp = baseTime + i * 3600;
      const historyEntry = cityObservations.find(
        (obs: any) => Math.abs(obs.valid_time_gmt - hourTimestamp) < 1800
      );
      const forecastEntry = getHourlyForecastEntry(hourTimestamp);
      return { timestamp: hourTimestamp, history: historyEntry, forecast: forecastEntry };
    }).filter((h) => h.history || h.forecast);
  }

  // Common UI State Logic (Unified for both DB and API sources)
  const cityObservations = hourlyReport
    .filter((h: any) => h.history)
    .map((h: any) => ({ ...h.history, valid_time_gmt: h.timestamp }));

  const hasData = cityObservations.length > 0;
  const temps = cityObservations.map((obs: any) => obs.temp);
  const maxTemp = hasData ? Math.max(...temps) : null;
  const minTemp = hasData ? Math.min(...temps) : null;

  const targetDayForecasts = hourlyReport
    .filter((h: any) => h.forecast)
    .map((h: any) => h.forecast.temp);

  const forecastMax = targetDayForecasts.length > 0 ? Math.max(...targetDayForecasts) : null;
  const forecastMin = targetDayForecasts.length > 0 ? Math.min(...targetDayForecasts) : null;

  const toF = (c: number) => Math.round((c * 9) / 5 + 32);

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8 gap-8 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-full bg-white/50 group-hover:bg-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </div>
            <span className="font-medium text-[#3d5516]/80 group-hover:text-[#3d5516]">Back</span>
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-[#3d5516]">{cityData.name}</h1>
            <div className="px-3 py-1 rounded-full bg-[#3d5516] text-[#c8ea8e] text-xs font-bold uppercase tracking-widest">{cityData.icao}</div>
            {isFromDb && <span className="text-[10px] font-black text-[#3d5516]/30 uppercase bg-white/40 px-2 py-0.5 rounded border border-black/5">Verified Record</span>}
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
                  Max History
                </p>
                <p className="text-lg font-bold">
                  {maxTemp !== null ? `${maxTemp}°C / ${toF(maxTemp)}°F` : "-"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/60">
                <p className="text-[10px] font-black opacity-40 uppercase mb-1">
                  Min History
                </p>
                <p className="text-lg font-bold">
                  {minTemp !== null ? `${minTemp}°C / ${toF(minTemp)}°F` : "-"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#c8ea8e] shadow-sm">
                <p className="text-[10px] font-black opacity-40 uppercase mb-1">
                  Max Forecast
                </p>
                <p className="text-lg font-bold">
                  {forecastMax !== null
                    ? `${forecastMax}°C / ${toF(forecastMax)}°F`
                    : "-"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#c8ea8e] shadow-sm">
                <p className="text-[10px] font-black opacity-40 uppercase mb-1">
                  Min Forecast
                </p>
                <p className="text-lg font-bold">
                  {forecastMin !== null
                    ? `${forecastMin}°C / ${toF(forecastMin)}°F`
                    : "-"}
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
                Celsius
              </span>
            </div>
          </div>

          {/* Custom SVG Chart */}
          <div className="h-64 w-full relative group">
            <svg
              viewBox="0 0 1000 200"
              className="w-full h-full preserve-3d"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3d5516" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3d5516" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={i * 50 + 25}
                  x2="1000"
                  y2={i * 50 + 25}
                  stroke="#3d5516"
                  strokeOpacity="0.1"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Data Path */}
              {hasData && (
                <>
                  <path
                    d={`M ${cityObservations
                      .map((obs: any, i: number) => {
                        const x =
                          cityObservations.length > 1
                            ? (i / (cityObservations.length - 1)) * 1000
                            : 500;
                        const y =
                          180 -
                          ((obs.temp - (minTemp || 0)) /
                            ((maxTemp || 1) - (minTemp || 0) || 1)) *
                            140;
                        return `${x},${y}`;
                      })
                      .join(" L ")} L 1000,200 L 0,200 Z`}
                    fill="url(#gradient)"
                    className="opacity-40"
                  />
                  <path
                    d={`M ${cityObservations
                      .map((obs: any, i: number) => {
                        const x =
                          cityObservations.length > 1
                            ? (i / (cityObservations.length - 1)) * 1000
                            : 500;
                        const y =
                          180 -
                          ((obs.temp - (minTemp || 0)) /
                            ((maxTemp || 1) - (minTemp || 0) || 1)) *
                            140;
                        return `${x},${y}`;
                      })
                      .join(" L ")}`}
                    fill="none"
                    stroke="#3d5516"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-lg"
                  />
                </>
              )}

              {/* Data Points */}
              {hasData &&
                cityObservations.map((obs: any, i: number) => {
                  const x =
                    cityObservations.length > 1
                      ? (i / (cityObservations.length - 1)) * 1000
                      : 500;
                  const y =
                    180 -
                    ((obs.temp - (minTemp || 0)) /
                      ((maxTemp || 1) - (minTemp || 0) || 1)) *
                      140;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="white"
                      stroke="#3d5516"
                      strokeWidth="2"
                      className="hover:r-6 transition-all cursor-pointer"
                    >
                      <title>{`${new Date(obs.valid_time_gmt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: cityData.timezone })}: ${obs.temp}°C`}</title>
                    </circle>
                  );
                })}
            </svg>
          </div>
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
                  <th className="p-4 font-semibold">Temp. History</th>
                  <th className="p-4 font-semibold">Temp. Forecast</th>
                  <th className="p-4 font-semibold">Condition History</th>
                  <th className="p-4 font-semibold">Condition Forecast</th>
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
                      <td className="p-4 font-bold text-[#3d5516]">
                        {item.history
                          ? `${item.history.temp}°C / ${toF(item.history.temp)}°F`
                          : "-"}
                      </td>
                      <td className="p-4 text-[#3d5516]/70 font-bold bg-[#c8ea8e]/10">
                        {item.forecast
                          ? `${item.forecast.temp}°C / ${toF(item.forecast.temp)}°F`
                          : "-"}
                      </td>
                      <td className="p-4 text-[#3d5516]/80 text-sm">
                        {item.history?.wx_phrase || "-"}
                      </td>
                      <td className="p-4 text-[#3d5516]/80 text-sm bg-[#c8ea8e]/5">
                        {item.forecast?.phrase || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
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
