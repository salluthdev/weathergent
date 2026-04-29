import { NextRequest, NextResponse } from "next/server";
import { getCityBySlug } from "@/lib/config";
import { getWeatherFromDb } from "@/lib/weather-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("city");
  const date = searchParams.get("date");

  if (!slug || !date) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required parameters: city and date (YYYYMMDD)",
      },
      { status: 400 },
    );
  }

  const city = getCityBySlug(slug);
  if (!city) {
    return NextResponse.json(
      { success: false, error: `City not found: ${slug}` },
      { status: 404 },
    );
  }

  try {
    const result = await getWeatherFromDb(city, date);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "No data available for this city and date in the database.",
          hint: "Try visiting the city page on the dashboard to trigger a live sync.",
        },
        { status: 404 },
      );
    }

    const isJakarta = city.slug === "jakarta";

    const maxHistory = result.hourlyReport.reduce((max: number | null, item: any) => {
      const temp = item.wuHistory?.temp;
      if (temp === undefined || temp === null) return max;
      return max === null ? temp : Math.max(max, temp);
    }, null);

    const maxForecast = result.hourlyReport.reduce((max: number | null, item: any) => {
      const temp = item.wuForecast?.temp;
      if (temp === undefined || temp === null) return max;
      return max === null ? temp : Math.max(max, temp);
    }, null);

    const bmkgMaxHistory = isJakarta ? result.hourlyReport.reduce((max: number | null, item: any) => {
      const temp = item.bmkgHistory?.temp;
      if (temp === undefined || temp === null) return max;
      return max === null ? temp : Math.max(max, temp);
    }, null) : null;

    const bmkgMaxForecast = isJakarta ? result.hourlyReport.reduce((max: number | null, item: any) => {
      const temp = item.bmkgForecast?.temp;
      if (temp === undefined || temp === null) return max;
      return max === null ? temp : Math.max(max, temp);
    }, null) : null;

    return NextResponse.json({
      success: true,
      city: city.name,
      icao: city.icao,
      date: date,
      timezone: city.timezone,
      today_max_history_wu: maxHistory,
      today_max_forecast_wu: maxForecast,
      today_max_history_bmkg: bmkgMaxHistory,
      today_max_forecast_bmkg: bmkgMaxForecast,
      data: result.hourlyReport.map((item: any) => ({
        timestamp: item.timestamp,
        wuTemperatureHistory: item.wuHistory
          ? {
              ...item.wuHistory,
              wuExactTime: item.wuExactTime,
              wuSyncedAt: item.wuSyncedAt,
              wuHistory: item.wuHistoryList || [],
            }
          : null,
        aviationTemperatureHistory: item.aviationHistory
          ? {
              ...item.aviationHistory,
              aviationExactTime: item.aviationExactTime,
              aviationSyncedAt: item.aviationSyncedAt,
              aviationHistory: item.aviationHistoryList || [],
            }
          : null,
        wuForecast: item.wuForecast
          ? {
              ...item.wuForecast,
              updated_at: item.forecastUpdatedAtWu,
              wuForecastHistory: item.forecastHistoryWu || [],
            }
          : null,
        bmkgTemperatureHistory: item.bmkgHistory ? { temp: item.bmkgHistory.temp } : null,
        bmkgForecast: item.bmkgForecast ? { temp: item.bmkgForecast.temp } : null,
      })),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
