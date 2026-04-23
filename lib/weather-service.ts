import { CityConfig } from "./config";

const API_KEY = "e1f10a1e78da46f5b10a1e78da96f525";

export interface HourlyReportItem {
  timestamp: number;
  wuHistory?: any;
  wuForecast?: any;
  aviationHistory?: any;
  forecastHistoryWu?: any[];
  forecastUpdatedAtWu?: string | null;
  diff_wu_history_aviation_history?: number | null;
  diff_wu_history_wu_forecast?: number | null;
}

const toF = (c: number) => parseFloat(((c * 9) / 5 + 32).toFixed(1));

export async function syncCityData(city: CityConfig, targetDate: string, supabase: any) {
  console.log(`[Sync] Starting sync for ${city.name} (${targetDate})...`);

  try {
    const [historyRes, hourlyRes, metarRes] = await Promise.all([
      fetch(
        `https://api.weather.com/v1/location/${city.station}/observations/historical.json?apiKey=${API_KEY}&units=m&startDate=${targetDate}&endDate=${targetDate}`
      ),
      fetch(
        `https://api.weather.com/v3/wx/forecast/hourly/2day?apiKey=${API_KEY}&icaoCode=${city.icao}&units=m&language=en-US&format=json`
      ),
      fetch(
        `https://aviationweather.gov/api/data/metar?ids=${city.icao}&format=json&hours=240`
      ),
    ]);

    const historyData = await historyRes.json();
    const hourlyForecast = await hourlyRes.json();
    const metarData = await metarRes.json();

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

    const hours = Array.from({ length: 48 }, (_, i) => baseTime + i * 1800);

    const hourlyReport: HourlyReportItem[] = hours.map((timestamp) => {
      // Find existing data for this slot if any
      const existing = existingRecords.find((r: any) => r.timestamp === timestamp);

      // New API data for history
      const historyMatches = (historyData.observations || []).filter((obs: any) => {
        const obsTime = obs.valid_time_gmt;
        return Math.abs(obsTime - timestamp) <= 900;
      });
      // Peak Match: Always select the highest temperature in the window
      const history = historyMatches.length > 0 
        ? historyMatches.reduce((max: any, obs: any) => (obs.temp > (max.temp ?? -Infinity) ? obs : max))
        : null;

      // New API data for forecast
      const forecastIndex = hourlyForecast.validTimeUtc?.findIndex(
        (t: number) => Math.abs(t - timestamp) < 900
      );

      let forecast = null;
      if (forecastIndex !== undefined && forecastIndex !== -1) {
        forecast = {
          temp: hourlyForecast.temperature[forecastIndex],
          condition: hourlyForecast.wxPhraseShort[forecastIndex],
        };
      }

      // New API data for Aviation History (METAR)
      const aviationHistoryMatches = metarData?.filter((obs: any) => {
        const reportTimestamp = Math.floor(new Date(obs.reportTime).getTime() / 1000);
        return Math.abs(reportTimestamp - timestamp) <= 900;
      });
      // Peak Match: Always select the highest temperature in the window
      const aviationHistory = (aviationHistoryMatches?.length || 0) > 0
        ? aviationHistoryMatches.reduce((max: any, obs: any) => (obs.temp > (max.temp ?? -Infinity) ? obs : max))
        : null;

      // Forecast History Tracking
      let forecastHistoryWu = existing?.forecastHistoryWu || [];
      let forecastUpdatedAtWu = existing?.forecastUpdatedAtWu || null;

      if (forecast) {
        if (existing?.wuForecast) {
          const oldTemp = Number(existing.wuForecast.temp);
          const newTemp = Number(forecast.temp);
          const isChanged = oldTemp !== newTemp;
          
          if (isChanged) {
            console.log(`[Sync] Temperature forecast change detected for ${city.name} at ${timestamp}: ${oldTemp}°C -> ${newTemp}°C`);
            forecastHistoryWu = [
              ...forecastHistoryWu,
              {
                temp: existing.wuForecast.temp,
                condition: existing.wuForecast.condition,
                updated_at: existing.forecastUpdatedAtWu || new Date(Date.now() - 3600000).toISOString()
              }
            ];
            forecastUpdatedAtWu = new Date().toISOString();
          }
        } else {
          // First time getting a forecast, use current time
          forecastUpdatedAtWu = new Date().toISOString();
        }
      }
        // SMART MERGE: Keep existing data if API is null
      return { 
        timestamp, 
        wuHistory: history || existing?.wuHistory || null, 
        wuForecast: forecast || existing?.wuForecast || null,
        aviationHistory: aviationHistory || existing?.aviationHistory || null,
        forecastHistoryWu,
        forecastUpdatedAtWu
      };
    });

    if (hourlyReport.length === 0) {
      console.log(`[Sync] No data found for ${city.name} on ${targetDate}.`);
      return { success: true, count: 0 };
    }

    const recordsToUpsert = hourlyReport.map((item: HourlyReportItem) => ({
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
      temp_c_wu: item.wuHistory?.temp ?? null,
      temp_f_wu: item.wuHistory?.temp !== undefined ? toF(item.wuHistory.temp) : null,
      forecast_c_wu: item.wuForecast?.temp ?? null,
      forecast_f_wu: item.wuForecast?.temp !== undefined ? toF(item.wuForecast.temp) : null,
      history_c_aviation: item.aviationHistory?.temp ?? null,
      history_f_aviation: item.aviationHistory?.temp !== undefined ? toF(item.aviationHistory.temp) : null,
      condition_history_wu: item.wuHistory?.condition ?? item.wuHistory?.wx_phrase ?? null,
      condition_forecast_wu: item.wuForecast?.condition ?? item.wuForecast?.phrase ?? null,
      forecast_history_wu: item.forecastHistoryWu,
      forecast_updated_at_wu: item.forecastUpdatedAtWu,
      diff_wu_history_aviation_history: (item.wuHistory && item.aviationHistory) 
        ? parseFloat((item.wuHistory.temp - item.aviationHistory.temp).toFixed(1)) 
        : null,
      diff_wu_history_wu_forecast: (item.wuHistory && item.wuForecast) 
        ? parseFloat((item.wuHistory.temp - item.wuForecast.temp).toFixed(1)) 
        : null,
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
      wuHistory: record.temp_c_wu !== null ? { 
        temp: record.temp_c_wu, 
        condition: record.condition_history_wu 
      } : null,
      wuForecast: record.forecast_c_wu !== null ? { 
        temp: record.forecast_c_wu, 
        condition: record.condition_forecast_wu 
      } : null,
      aviationHistory: record.history_c_aviation !== null ? {
        temp: record.history_c_aviation
      } : null,
      forecastHistoryWu: record.forecast_history_wu || [],
      forecastUpdatedAtWu: record.forecast_updated_at_wu,
      diff_wu_history_aviation_history: record.diff_wu_history_aviation_history,
      diff_wu_history_wu_forecast: record.diff_wu_history_wu_forecast,
    }));

    return { hourlyReport, baseTime };
  } catch (err) {
    console.error("[Service] Failed to fetch from Supabase:", err);
    return null;
  }
}

