import pool from "../lib/db";

async function cleanup() {
  console.log("Starting DB cleanup...");
  try {
    await pool.query(`
      ALTER TABLE weather_records 
      DROP COLUMN IF EXISTS diff_wu_history_wu_forecast,
      DROP COLUMN IF EXISTS condition_history_bmkg,
      DROP COLUMN IF EXISTS condition_forecast_bmkg;
    `);
    console.log("Cleanup successful: Removed unnecessary columns.");
  } catch (err) {
    console.error("Cleanup failed:", err);
  } finally {
    await pool.end();
  }
}

cleanup();
