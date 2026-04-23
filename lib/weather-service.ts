import { CityConfig } from "./config";
import pool from "./db";

const API_KEY = "e1f10a1e78da46f5b10a1e78da96f525";

export interface HourlyReportItem {
  timestamp: number;
  wuHistory?: any;
  wuForecast?: any;
  aviationHistory?: any;
  forecastHistoryWu?: any[];
  forecastUpdatedAtWu?: string | null;
  wuExactTime?: number | null;
  wuSyncedAt?: string | null;
  aviationExactTime?: number | null;
  aviationSyncedAt?: string | null;
}

const toF = (c: number) => parseFloat(((c * 9) / 5 + 32).toFixed(1));

export async function syncCityData(city: CityConfig, targetDate: string) {
  console.log(`[Sync] Starting sync for ${city.name} (${targetDate})...`);

  try {
    const cacheBuster = Date.now();
    const commonHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache"
    };

    const [historyRes, hourlyRes, metarRes, currentRes] = await Promise.all([
      fetch(
        `https://api.weather.com/v1/location/${city.station}/observations/historical.json?apiKey=${API_KEY}&units=m&startDate=${targetDate}&endDate=${targetDate}`,
        { headers: commonHeaders }
      ),
      fetch(
        `https://api.weather.com/v3/wx/forecast/hourly/2day?apiKey=${API_KEY}&icaoCode=${city.icao}&units=m&language=en-US&format=json`,
        { headers: commonHeaders }
      ),
      fetch(
        `https://aviationweather.gov/api/data/metar?ids=${city.icao}&format=json&hours=24`,
        { headers: commonHeaders }
      ),
      fetch(
        `https://api.weather.com/v3/wx/observations/current?apiKey=${API_KEY}&icaoCode=${city.icao}&units=m&language=en-US&format=json`,
        { headers: commonHeaders }
      ),
    ]);

    const historyData = await historyRes.json();
    const hourlyForecast = await hourlyRes.json();
    const metarData = await metarRes.json();
    const currentData = await currentRes.json();

    // 1. Fetch existing records from DB to prevent overwriting with nulls
    const dbResult = await getWeatherFromDb(city, targetDate);
    const existingRecords = dbResult?.hourlyReport || [];

    // Calculate local timeline
    const year = parseInt(targetDate.substring(0, 4));
    const month = parseInt(targetDate.substring(4, 6)) - 1;
    const day = parseInt(targetDate.substring(6, 8));

    // Robust local midnight calculation:
    const cityDate = new Date(new Date(year, month, day).toLocaleString("en-US", { timeZone: city.timezone }));
    const utcDate = new Date(year, month, day);
    const tzOffsetSeconds = (cityDate.getTime() - utcDate.getTime()) / 1000;
    const finalBaseTime = Math.floor(utcDate.getTime() / 1000) - tzOffsetSeconds;

    const hours = Array.from({ length: 48 }, (_, i) => finalBaseTime + i * 1800);

    const hourlyReport: HourlyReportItem[] = hours.map((timestamp) => {
      // Find existing data for this slot if any
      const existing = existingRecords.find((r: any) => r.timestamp === timestamp);

      // New API data for history
      const historyMatches = (historyData.observations || []).filter((obs: any) => {
        const obsTime = obs.valid_time_gmt;
        return Math.abs(obsTime - timestamp) <= 1200; // 20 minutes tolerance
      });
      
      const historyEntry = historyMatches.length > 0 
        ? historyMatches.reduce((max: any, obs: any) => (obs.temp > (max.temp ?? -Infinity) ? obs : max))
        : null;

      let history = historyEntry 
        ? { temp: historyEntry.temp, condition: historyEntry.wx_phrase || historyEntry.phrase_32char } 
        : (existing?.wuHistory || null);
      
      let wuExactTime = historyEntry?.valid_time_gmt || existing?.wuExactTime || null;
      let wuSyncedAt = historyEntry ? new Date().toISOString() : (existing?.wuSyncedAt || null);

      // Fallback: If this is a very recent slot (within the last 45 mins) and history is still null,
      // try to use the "Current Conditions" API data.
      const nowGmt = Math.floor(Date.now() / 1000);
      if (!history && Math.abs(nowGmt - timestamp) < 2700) {
        if (currentData?.validTimeUtc && Math.abs(currentData.validTimeUtc - timestamp) < 1200) {
          console.log(`[Sync] Using Live Fallback for ${city.name} at ${timestamp}: ${currentData.temperature}°C`);
          history = {
            temp: currentData.temperature,
            condition: currentData.wxPhraseShort || currentData.wxPhraseMedium
          };
          wuExactTime = currentData.validTimeUtc;
          wuSyncedAt = new Date().toISOString();
        }
      }

      // New API data for forecast
      let forecastIndex = hourlyForecast.validTimeUtc?.findIndex(
        (t: number) => Math.abs(t - timestamp) < 1200
      );

      // Fallback: If no exact/near match for 30-min slot, look for the preceding hourly forecast
      if ((forecastIndex === undefined || forecastIndex === -1) && hourlyForecast.validTimeUtc) {
        forecastIndex = hourlyForecast.validTimeUtc.findIndex(
          (t: number) => timestamp - t > 0 && timestamp - t <= 2700 // Up to 45 mins prior
        );
      }

      let forecast = null;
      if (forecastIndex !== undefined && forecastIndex !== -1) {
        forecast = {
          temp: hourlyForecast.temperature[forecastIndex],
          condition: hourlyForecast.wxPhraseShort[forecastIndex],
        };
      } else if (existing?.wuForecast) {
        forecast = existing.wuForecast;
      }

      // New API data for Aviation History (METAR)
      const aviationHistoryMatches = metarData?.filter((obs: any) => {
        const reportTimeStr = obs.reportTime || obs.obsTime;
        if (!reportTimeStr) return false;
        const reportTimestamp = Math.floor(new Date(reportTimeStr).getTime() / 1000);
        return Math.abs(reportTimestamp - timestamp) <= 1200;
      });

      const aviationEntry = (aviationHistoryMatches?.length || 0) > 0
        ? aviationHistoryMatches.reduce((max: any, obs: any) => (obs.temp > (max.temp ?? -Infinity) ? obs : max))
        : null;

      const aviationHistory = aviationEntry 
        ? { temp: aviationEntry.temp } 
        : (existing?.aviationHistory || null);
      
      const aviationExactTime = aviationEntry 
        ? Math.floor(new Date(aviationEntry.reportTime || aviationEntry.obsTime).getTime() / 1000) 
        : (existing?.aviationExactTime || null);
      const aviationSyncedAt = aviationEntry ? new Date().toISOString() : (existing?.aviationSyncedAt || null);

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
        wuHistory: history, 
        wuForecast: forecast,
        aviationHistory: aviationHistory,
        forecastHistoryWu,
        forecastUpdatedAtWu,
        wuExactTime,
        wuSyncedAt,
        aviationExactTime,
        aviationSyncedAt
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
      wu_exact_time: item.wuExactTime,
      wu_synced_at: item.wuSyncedAt,
      aviation_exact_time: item.aviationExactTime,
      aviation_synced_at: item.aviationSyncedAt,
      diff_wu_history_aviation_history: (item.wuHistory && item.aviationHistory) 
        ? parseFloat((item.wuHistory.temp - item.aviationHistory.temp).toFixed(1)) 
        : null,
      diff_wu_history_wu_forecast: (item.wuHistory && item.wuForecast) 
        ? parseFloat((item.wuHistory.temp - item.wuForecast.temp).toFixed(1)) 
        : null,
    }));

    for (const record of recordsToUpsert) {
      await pool.query(`
        INSERT INTO weather_records (
          city_name, station_id, timestamp_gmt, city_time, wib_time, 
          temp_c_wu, temp_f_wu, forecast_c_wu, forecast_f_wu, 
          history_c_aviation, history_f_aviation, condition_history_wu, 
          condition_forecast_wu, forecast_history_wu, forecast_updated_at_wu, 
          wu_exact_time, wu_synced_at, aviation_exact_time, aviation_synced_at, 
          diff_wu_history_aviation_history, diff_wu_history_wu_forecast
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (city_name, timestamp_gmt) 
        DO UPDATE SET 
          station_id = EXCLUDED.station_id,
          city_time = EXCLUDED.city_time,
          wib_time = EXCLUDED.wib_time,
          temp_c_wu = EXCLUDED.temp_c_wu,
          temp_f_wu = EXCLUDED.temp_f_wu,
          forecast_c_wu = EXCLUDED.forecast_c_wu,
          forecast_f_wu = EXCLUDED.forecast_f_wu,
          history_c_aviation = EXCLUDED.history_c_aviation,
          history_f_aviation = EXCLUDED.history_f_aviation,
          condition_history_wu = EXCLUDED.condition_history_wu,
          condition_forecast_wu = EXCLUDED.condition_forecast_wu,
          forecast_history_wu = EXCLUDED.forecast_history_wu,
          forecast_updated_at_wu = EXCLUDED.forecast_updated_at_wu,
          wu_exact_time = EXCLUDED.wu_exact_time,
          wu_synced_at = COALESCE(weather_records.wu_synced_at, EXCLUDED.wu_synced_at),
          aviation_exact_time = EXCLUDED.aviation_exact_time,
          aviation_synced_at = COALESCE(weather_records.aviation_synced_at, EXCLUDED.aviation_synced_at),
          diff_wu_history_aviation_history = EXCLUDED.diff_wu_history_aviation_history,
          diff_wu_history_wu_forecast = EXCLUDED.diff_wu_history_wu_forecast
      `, [
        record.city_name, record.station_id, record.timestamp_gmt, record.city_time, record.wib_time,
        record.temp_c_wu, record.temp_f_wu, record.forecast_c_wu, record.forecast_f_wu,
        record.history_c_aviation, record.history_f_aviation, record.condition_history_wu,
        record.condition_forecast_wu, JSON.stringify(record.forecast_history_wu), record.forecast_updated_at_wu,
        record.wu_exact_time, record.wu_synced_at, record.aviation_exact_time, record.aviation_synced_at,
        record.diff_wu_history_aviation_history, record.diff_wu_history_wu_forecast
      ]);
    }

    console.log(`[Sync] Successfully synced ${recordsToUpsert.length} records for ${city.name}.`);
    return { success: true, count: recordsToUpsert.length };
  } catch (err: any) {
    console.error(`[Sync] Failed to sync ${city.name}:`, err.message);
    return { success: false, error: err.message };
  }
}

export async function getWeatherFromDb(city: CityConfig, targetDate: string) {
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

    const result = await pool.query(`
      SELECT * FROM weather_records 
      WHERE city_name = $1 
      AND timestamp_gmt >= $2 
      AND timestamp_gmt < $3
      ORDER BY timestamp_gmt ASC
    `, [city.slug, baseTime, baseTime + 86400]);

    const data = result.rows;
    if (!data || data.length === 0) return null;

    // Map database records back to the HourlyReportItem format used by the UI
    const hourlyReport = data.map((record: any) => ({
      timestamp: Number(record.timestamp_gmt),
      wuHistory: record.temp_c_wu !== null ? { 
        temp: Number(record.temp_c_wu), 
        condition: record.condition_history_wu 
      } : null,
      wuForecast: record.forecast_c_wu !== null ? { 
        temp: Number(record.forecast_c_wu), 
        condition: record.condition_forecast_wu 
      } : null,
      aviationHistory: record.history_c_aviation !== null ? { 
        temp: Number(record.history_c_aviation) 
      } : null,
      forecastHistoryWu: record.forecast_history_wu || [],
      forecastUpdatedAtWu: record.forecast_updated_at_wu || null,
      wuExactTime: record.wu_exact_time ? Number(record.wu_exact_time) : null,
      wuSyncedAt: record.wu_synced_at || null,
      aviationExactTime: record.aviation_exact_time ? Number(record.aviation_exact_time) : null,
      aviationSyncedAt: record.aviation_synced_at || null
    }));

    return { 
      hourlyReport,
      baseTime: baseTime 
    };
  } catch (err) {
    console.error("[Service] Failed to fetch from Db:", err);
    return null;
  }
}
