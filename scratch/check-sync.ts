import { createClient } from "@supabase/supabase-js";
import { CITIES } from "../lib/config";
import { syncCityData } from "../lib/weather-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSync() {
  const city = CITIES.find(c => c.slug === "jakarta");
  if (!city) return;
  
  const targetDate = "20260423";
  const API_KEY = "e1f10a1e78da46f5b10a1e78da96f525";
  const url = `https://api.weather.com/v1/location/${city.station}/observations/historical.json?apiKey=${API_KEY}&units=m&startDate=${targetDate}&endDate=${targetDate}&_cb=${Date.now()}`;
  
  const res = await fetch(url);
  const data = await res.json();
  const obs = data.observations || [];
  
  console.log(`API total observations: ${obs.length}`);
  const target = 1776925800; // 1:30 PM WIB
  const found = obs.find((o: any) => o.valid_time_gmt === target);
  console.log(`Found 1:30 PM (1776925800) in API? ${found ? "YES" : "NO"}`);
  
  if (found) {
    console.log(`Temp in API: ${found.temp}`);
  }
  
  const { data: dbData } = await supabase
    .from("weather_records")
    .select("temp_c_wu")
    .eq("city_name", "jakarta")
    .eq("timestamp_gmt", target);
    
  console.log(`DB value for 1:30 PM: ${dbData?.[0]?.temp_c_wu}`);
}

checkSync();
