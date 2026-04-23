import { writeFileSync } from "fs";
import dotenv from "dotenv";
import pool from "./lib/db";

dotenv.config();

async function exportToCSV() {
  console.log("🚀 Starting export from PostgreSQL...");

  try {
    // Fetch all records
    const result = await pool.query(`
      SELECT 
        id, city_name, station_id, timestamp_gmt, city_time, wib_time, 
        temp_c_wu, temp_f_wu, forecast_c_wu, forecast_f_wu, 
        history_c_aviation, history_f_aviation, condition_history_wu, 
        condition_forecast_wu, forecast_history_wu, forecast_updated_at_wu, 
        wu_exact_time, wu_synced_at, aviation_exact_time, aviation_synced_at, 
        diff_wu_history_aviation_history, diff_wu_history_wu_forecast, created_at
      FROM weather_records
      ORDER BY timestamp_gmt DESC
    `);

    const data = result.rows;

    if (!data || data.length === 0) {
      console.log("No data found to export.");
      return;
    }

    console.log(`📦 Found ${data.length} records. Converting to CSV...`);

    // Get headers from the first object
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    // Map data to CSV rows
    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header];
        // Handle nulls and escape strings with commas
        if (val === null || val === undefined) return "";
        const stringVal = String(val);
        if (
          stringVal.includes(",") ||
          stringVal.includes('"') ||
          stringVal.includes("\n")
        ) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      });
      csvRows.push(values.join(","));
    }

    const csvContent = csvRows.join("\n");
    const fileName = "weather_data_backup_new.csv";

    writeFileSync(fileName, csvContent);
    
    console.log(`✅ Success! Data exported to ${fileName}`);
  } catch (error) {
    console.error("Error during export:", error);
  } finally {
    await pool.end();
  }
}

exportToCSV();
