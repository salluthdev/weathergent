import * as dotenv from "dotenv";
import path from "path";
import { Client } from "pg";

// Load .env from the root directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function migrate() {
  console.log("Starting History columns migration...");
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not defined in environment variables!");
    return;
  }

  // Masking for logging
  const masked = connectionString.replace(/:([^@]+)@/, ":****@");
  console.log("Using connection string:", masked);

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
      ADD COLUMN IF NOT EXISTS history_wu JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS history_aviation JSONB DEFAULT '[]'::jsonb;
    `);
    
    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
