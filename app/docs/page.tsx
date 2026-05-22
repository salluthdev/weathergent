import Link from "next/link";

export default function DocsPage() {
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
              Back to Dashboard
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-[#3d5516]">
              API Documentation
            </h1>
            <div className="px-3 py-1 rounded-full bg-[#3d5516] text-[#c8ea8e] text-xs font-bold uppercase tracking-widest">
              v1.0
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full flex flex-col gap-12">
        {/* Intro */}
        <section className="p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white/20 shadow-xl">
          <p className="text-[#3d5516] text-lg leading-relaxed">
            The Weathergent API provides access to historical weather
            observations and high-resolution forecasts for 40+ global cities.
            All data is synchronized from premium sources including Weather
            Underground and Aviation Weather.
          </p>
          <div className="mt-6 p-4 rounded-2xl bg-[#3d5516]/5 border border-[#3d5516]/10">
            <p className="text-[10px] font-black text-[#3d5516]/40 uppercase tracking-widest mb-2">
              Base URL
            </p>
            <code className="text-sm font-bold text-[#3d5516] break-all">
              https://weathergent.aixbet.app/api
            </code>
          </div>
        </section>

        {/* Cities Section */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3d5516] text-[#c8ea8e] flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-2xl font-bold text-[#3d5516]">Cities List</h2>
          </div>
          <div className="p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white/20 shadow-xl flex flex-col gap-6">
            <p className="text-[#3d5516]/70">
              Retrieve a full list of all cities currently tracked by the
              system, including their ICAO codes and geographic coordinates.
            </p>

            <div className="flex items-center gap-3 p-3 bg-[#3d5516] rounded-xl text-[#c8ea8e] font-mono text-sm w-fit">
              <span className="font-black">GET</span>
              <span className="opacity-60">/cities</span>
            </div>

            <div className="bg-[#1a2b00] rounded-2xl p-6 shadow-inner overflow-x-auto">
              <pre className="text-xs text-[#c8ea8e]/80 leading-relaxed font-mono">
                {`{
  "success": true,
  "cities": [
    {
      "name": "New York",
      "slug": "new-york",
      "icao": "KLGA",
      "station": "KLGA:9:US",
      "timezone": "America/New_York",
      "latitude": 40.77,
      "longitude": -73.87,
      "current_date": "20240424"
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Weather Section */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3d5516] text-[#c8ea8e] flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-2xl font-bold text-[#3d5516]">Weather Data</h2>
          </div>
          <div className="p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white/20 shadow-xl flex flex-col gap-8">
            <p className="text-[#3d5516]/70">
              Fetch detailed hourly observations and high-resolution forecasts
              for a specific city and date context.
            </p>

            <div className="flex items-center gap-3 p-3 bg-[#3d5516] rounded-xl text-[#c8ea8e] font-mono text-sm w-fit">
              <span className="font-black">GET</span>
              <span className="opacity-60">
                /weather?city={"{slug}"}&date={"{YYYYMMDD}"}
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black text-[#3d5516]/40 uppercase tracking-widest">
                Query Parameters
              </h3>
              <div className="overflow-hidden rounded-2xl border border-[#3d5516]/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#3d5516]/5">
                    <tr>
                      <th className="p-4 font-bold text-[#3d5516]">Param</th>
                      <th className="p-4 font-bold text-[#3d5516]">Type</th>
                      <th className="p-4 font-bold text-[#3d5516]">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3d5516]/5">
                    <tr>
                      <td className="p-4 font-mono font-bold text-[#3d5516]">
                        city
                      </td>
                      <td className="p-4 text-[#3d5516]/60 italic text-xs">
                        string
                      </td>
                      <td className="p-4 text-[#3d5516]/80">
                        The city slug (e.g.,{" "}
                        <code className="bg-white/50 px-1 rounded">london</code>
                        )
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-mono font-bold text-[#3d5516]">
                        date
                      </td>
                      <td className="p-4 text-[#3d5516]/60 italic text-xs">
                        string
                      </td>
                      <td className="p-4 text-[#3d5516]/80">
                        Target date in{" "}
                        <code className="bg-white/50 px-1 rounded">
                          YYYYMMDD
                        </code>{" "}
                        format
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black text-[#3d5516]/40 uppercase tracking-widest">
                Weather Detail Fields
              </h3>
              <p className="text-[#3d5516]/70 text-sm">
                Each <code className="bg-white/50 px-1 rounded">wuTemperatureHistory</code>{" "}
                and <code className="bg-white/50 px-1 rounded">wuForecast</code>{" "}
                object includes a <code className="bg-white/50 px-1 rounded">detail</code>{" "}
                snapshot. Historical entries inside{" "}
                <code className="bg-white/50 px-1 rounded">wuHistory</code> and{" "}
                <code className="bg-white/50 px-1 rounded">wuForecastHistory</code>{" "}
                each carry their own <code className="bg-white/50 px-1 rounded">detail</code>{" "}
                at the time of capture.
              </p>
              <div className="overflow-hidden rounded-2xl border border-[#3d5516]/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#3d5516]/5">
                    <tr>
                      <th className="p-4 font-bold text-[#3d5516]">Field</th>
                      <th className="p-4 font-bold text-[#3d5516]">Source</th>
                      <th className="p-4 font-bold text-[#3d5516]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3d5516]/5 text-xs">
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#3d5516]">feelsLike</td>
                      <td className="p-3 text-[#3d5516]/60">both</td>
                      <td className="p-3 text-[#3d5516]/80">Apparent temperature (°C)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#3d5516]">precipChance</td>
                      <td className="p-3 text-[#3d5516]/60">forecast</td>
                      <td className="p-3 text-[#3d5516]/80">Probability of precipitation (%)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#3d5516]">qpf</td>
                      <td className="p-3 text-[#3d5516]/60">forecast</td>
                      <td className="p-3 text-[#3d5516]/80">Forecast precipitation amount (mm)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#3d5516]">precip</td>
                      <td className="p-3 text-[#3d5516]/60">history</td>
                      <td className="p-3 text-[#3d5516]/80">Observed precipitation (mm, hourly)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#3d5516]">cloudCover</td>
                      <td className="p-3 text-[#3d5516]/60">both</td>
                      <td className="p-3 text-[#3d5516]/80">% for forecast, METAR sky code for history</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#3d5516]">dewPoint</td>
                      <td className="p-3 text-[#3d5516]/60">both</td>
                      <td className="p-3 text-[#3d5516]/80">Dew point (°C)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#3d5516]">humidity</td>
                      <td className="p-3 text-[#3d5516]/60">both</td>
                      <td className="p-3 text-[#3d5516]/80">Relative humidity (%)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#3d5516]">windSpeed</td>
                      <td className="p-3 text-[#3d5516]/60">both</td>
                      <td className="p-3 text-[#3d5516]/80">Wind speed (km/h)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#3d5516]">windDirection</td>
                      <td className="p-3 text-[#3d5516]/60">both</td>
                      <td className="p-3 text-[#3d5516]/80">Cardinal direction (e.g., NE, SSW)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#3d5516]">pressure</td>
                      <td className="p-3 text-[#3d5516]/60">both</td>
                      <td className="p-3 text-[#3d5516]/80">Mean sea-level pressure (mb)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#1a2b00] rounded-2xl p-6 shadow-inner overflow-x-auto">
              <pre className="text-xs text-[#c8ea8e]/80 leading-relaxed font-mono">
                {`{
  "success": true,
  "city": "Singapore",
  "icao": "WSSS",
  "date": "20240424",
  "timezone": "Asia/Singapore",
  "today_max_history_wu": 28,
  "today_max_forecast_wu": 29,
  "data": [
    {
      "timestamp": 1713916800,
      "wuTemperatureHistory": {
        "temp": 28,
        "condition": "Partly Cloudy",
        "wuExactTime": 1713916740,
        "wuSyncedAt": "2024-04-24T00:02:15Z",
        "detail": {
          "feelsLike": 32,
          "precip": 0,
          "cloudCover": "SCT",
          "dewPoint": 24,
          "humidity": 78,
          "windSpeed": 11,
          "windDirection": "SE",
          "pressure": 1010
        },
        "wuHistory": []
      },
      "aviationTemperatureHistory": { "temp": 28.1, "aviationExactTime": 1713916800, "aviationSyncedAt": "2024-04-24T00:05:00Z" },
      "aviationTemperatureCurrent": null,
      "wuForecast": {
        "temp": 29,
        "condition": "Scattered Clouds",
        "updated_at": "2024-04-24T02:30:00Z",
        "detail": {
          "feelsLike": 33,
          "precipChance": 42,
          "qpf": 1.2,
          "cloudCover": 65,
          "dewPoint": 24,
          "humidity": 76,
          "windSpeed": 12,
          "windDirection": "SE",
          "pressure": 1010
        },
        "wuForecastHistory": [
          { "temp": 27, "condition": "Partly Cloudy", "updated_at": "2024-04-24T00:00:00Z", "detail": { "feelsLike": 30, "precipChance": 30, "qpf": 0.5, "cloudCover": 55, "dewPoint": 23, "humidity": 74, "windSpeed": 10, "windDirection": "S", "pressure": 1011 } },
          { "temp": 28, "condition": "Scattered Clouds", "updated_at": "2024-04-24T01:15:00Z", "detail": { "feelsLike": 31, "precipChance": 35, "qpf": 0.8, "cloudCover": 60, "dewPoint": 23, "humidity": 75, "windSpeed": 11, "windDirection": "SE", "pressure": 1010 } }
        ]
      }
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Error Section */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3d5516] text-[#c8ea8e] flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-2xl font-bold text-[#3d5516]">
              Error Handling
            </h2>
          </div>
          <div className="p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white/20 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/60">
              <p className="font-bold text-[#3d5516] mb-1">400 Bad Request</p>
              <p className="text-xs text-[#3d5516]/60">
                Missing required parameters (city or date).
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/60">
              <p className="font-bold text-[#3d5516] mb-1">404 Not Found</p>
              <p className="text-xs text-[#3d5516]/60">
                City or date not found in our database.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/60">
              <p className="font-bold text-[#3d5516] mb-1">401 Unauthorized</p>
              <p className="text-xs text-[#3d5516]/60">
                Invalid or missing API credentials (for internal routes).
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/60">
              <p className="font-bold text-[#3d5516] mb-1">500 Server Error</p>
              <p className="text-xs text-[#3d5516]/60">
                Unexpected error during data retrieval.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
