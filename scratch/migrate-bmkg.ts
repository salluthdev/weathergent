import pool from "../lib/db";

async function migrate() {
  console.log("Starting BMKG migration...");
  try {
    await pool.query(`
      ALTER TABLE weather_records 
      ADD COLUMN IF NOT EXISTS temp_c_bmkg DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS temp_f_bmkg DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS forecast_c_bmkg DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS forecast_f_bmkg DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS condition_history_bmkg TEXT,
      ADD COLUMN IF NOT EXISTS condition_forecast_bmkg TEXT;
    `);
    console.log("Migration successful: Added BMKG columns.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
