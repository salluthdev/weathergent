import { CityConfig } from "./config";

const API_KEY = "e1f10a1e78da46f5b10a1e78da96f525";

export interface HourlyReportItem {
  timestamp: number;
  history?: any;
  forecast?: any;
}

const toF = (c: number) => Math.round((c * 9) / 5 + 32);

export async function syncCityData(city: CityConfig, targetDate: string, supabase: any) {
  console.log(`[Sync] Starting sync for ${city.name} (${targetDate})...`);

  try {
    // Fetch Historical, Daily Forecast, and Hourly Forecast in parallel
    const [historyRes, hourlyRes] = await Promise.all([
      fetch(
        `https://api.weather.com/v1/location/${city.station}/observations/historical.json?apiKey=${API_KEY}&units=m&startDate=${targetDate}&endDate=${targetDate}`
      ),
      fetch(
        `https://api.weather.com/v3/wx/forecast/hourly/2day?apiKey=${API_KEY}&icaoCode=${city.icao}&units=m&language=en-US&format=json`
      ),
    ]);

    const historyData = await historyRes.json();
    const hourlyForecast = await hourlyRes.json();

    // 1. Fetch existing records from Supabase to prevent overwriting with nulls
    const dbResult = await getWeatherFromSupabase(city, targetDate, supabase);
    const existingRecords = dbResult?.hourlyReport || [];

    // Calculate local timeline
    const year = parseInt(targetDate.substring(0, 4));
    const month = parseInt(targetDate.substring(4, 6)) - 1;
    const day = parseInt(targetDate.substring(6, 8));

    const cityLocalMidnight = new Date(
      new Date(year, month, day).toLocaleString("en-US", {
        timeZone: city.timezone,
      })
    );
    const offset =
      new Date(year, month, day).getTime() - cityLocalMidnight.getTime();
    const baseTime = Math.floor((new Date(year, month, day).getTime() + offset) / 1000);

    const hours = Array.from({ length: 24 }, (_, i) => baseTime + i * 3600);

    const hourlyReport: HourlyReportItem[] = hours.map((timestamp) => {
      // Find existing data for this hour if any
      const existing = existingRecords.find(r => r.timestamp === timestamp);

      // New API data for history
      const history = historyData.observations?.find((obs: any) => {
        const obsTime = obs.valid_time_gmt;
        return Math.abs(obsTime - timestamp) < 1800;
      });

      // New API data for forecast
      const forecastIndex = hourlyForecast.validTimeUtc?.findIndex(
        (t: number) => Math.abs(t - timestamp) < 1800
      );

      let forecast = null;
      if (forecastIndex !== undefined && forecastIndex !== -1) {
        forecast = {
          temp: hourlyForecast.temperature[forecastIndex],
          phrase: hourlyForecast.wxPhraseShort[forecastIndex],
        };
      }

      // SMART MERGE: Keep existing data if API is null
      return { 
        timestamp, 
        history: history || existing?.history || null, 
        forecast: forecast || existing?.forecast || null 
      };
    }).filter(h => h.history || h.forecast);

    if (hourlyReport.length === 0) {
      console.log(`[Sync] No data found for ${city.name} on ${targetDate}.`);
      return { success: true, count: 0 };
    }

    const recordsToUpsert = hourlyReport.map((item) => ({
      city_name: city.slug,
      station_id: city.icao,
      timestamp_gmt: item.timestamp,
      city_time: new Date(item.timestamp * 1000).toLocaleString("en-US", {
        timeZone: city.timezone,
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      wib_time: (() => {
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
      })(),
      temp_c: item.history?.temp ?? null,
      temp_f: item.history?.temp !== undefined ? toF(item.history.temp) : null,
      forecast_c: item.forecast?.temp ?? null,
      forecast_f: item.forecast?.temp !== undefined ? toF(item.forecast.temp) : null,
      condition_history: item.history?.wx_phrase ?? null,
      condition_forecast: item.forecast?.phrase ?? null,
    }));

    const { error } = await supabase
      .from("weather_records")
      .upsert(recordsToUpsert, { onConflict: "city_name,timestamp_gmt" });


    if (error) {
      console.error(`[Sync] Supabase Error for ${city.name}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Sync] Successfully synced ${recordsToUpsert.length} records for ${city.name}.`);
    return { success: true, count: recordsToUpsert.length };
  } catch (err: any) {
    console.error(`[Sync] Failed to sync ${city.name}:`, err.message);
    return { success: false, error: err.message };
  }
}

export async function getWeatherFromSupabase(city: CityConfig, targetDate: string, supabase: any) {
  try {
    // Calculate local midnight timestamp (baseTime)
    const year = parseInt(targetDate.substring(0, 4));
    const month = parseInt(targetDate.substring(4, 6)) - 1;
    const day = parseInt(targetDate.substring(6, 8));

    const cityLocalMidnight = new Date(
      new Date(year, month, day).toLocaleString("en-US", {
        timeZone: city.timezone,
      })
    );
    const offset =
      new Date(year, month, day).getTime() - cityLocalMidnight.getTime();
    const baseTime = Math.floor((new Date(year, month, day).getTime() + offset) / 1000);

    const { data, error } = await supabase
      .from("weather_records")
      .select("*")
      .eq("city_name", city.slug)
      .gte("timestamp_gmt", baseTime)
      .lt("timestamp_gmt", baseTime + 86400)
      .order("timestamp_gmt", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    // Map database records back to the HourlyReportItem format used by the UI
    const hourlyReport = data.map((record: any) => ({
      timestamp: record.timestamp_gmt,
      history: record.temp_c !== null ? { 
        temp: record.temp_c, 
        wx_phrase: record.condition_history 
      } : null,
      forecast: record.forecast_c !== null ? { 
        temp: record.forecast_c, 
        phrase: record.condition_forecast 
      } : null,
    }));

    return { hourlyReport, baseTime };
  } catch (err) {
    console.error("[Service] Failed to fetch from Supabase:", err);
    return null;
  }
}

