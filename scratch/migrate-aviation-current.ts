import * as dotenv from "dotenv";
import path from "path";
import { Client } from "pg";

// Load .env from the root directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function migrate() {
  console.log("Starting Current Aviation Temp columns migration...");
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not defined in environment variables!");
    return;
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("Successfully connected to the database.");

    await client.query(`
      ALTER TABLE weather_records 
      ADD COLUMN IF NOT EXISTS temp_c_aviation_current FLOAT,
      ADD COLUMN IF NOT EXISTS aviation_current_exact_time BIGINT,
      ADD COLUMN IF NOT EXISTS aviation_current_synced_at TEXT,
      ADD COLUMN IF NOT EXISTS history_aviation_current JSONB DEFAULT '[]';
    `);
    
    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
