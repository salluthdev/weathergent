import pool from "../lib/db";

async function migrate() {
  console.log("Starting History columns migration...");
  try {
    await pool.query(`
      ALTER TABLE weather_records 
      ADD COLUMN IF NOT EXISTS history_wu JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS history_aviation JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
