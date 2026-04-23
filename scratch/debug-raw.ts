import { createClient } from "@supabase/supabase-js";
import { CITIES } from "../lib/config";

const API_KEY = "e1f10a1e78da46f5b10a1e78da96f525";

async function debugRaw() {
  const station = "WIHH:9:ID";
  const targetDate = "20260423";
  const url = `https://api.weather.com/v1/location/${station}/observations/historical.json?apiKey=${API_KEY}&units=m&startDate=${targetDate}&endDate=${targetDate}&_cb=${Date.now()}`;
  
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Cache-Control": "no-cache"
    }
  });
  const text = await res.text();
  console.log(`URL: ${url}`);
  console.log(`Status: ${res.status}`);
  console.log(`Response Snippet: ${text.substring(0, 200)}`);
  
  try {
    const data = JSON.parse(text);
    console.log(`Observations count: ${data.observations?.length || 0}`);
    if (data.observations?.length > 0) {
      console.log(`Latest obs time: ${data.observations[data.observations.length - 1].valid_time_gmt}`);
    }
  } catch (e) {
    console.log("Failed to parse JSON");
  }
}

debugRaw();
