const API_KEY = "e1f10a1e78da46f5b10a1e78da96f525";
const station = "WIHH:9:ID";
const targetDate = "20260423";

async function checkApi() {
  const url = `https://api.weather.com/v1/location/${station}/observations/historical.json?apiKey=${API_KEY}&units=m&startDate=${targetDate}&endDate=${targetDate}`;
  const res = await fetch(url);
  const data = await res.json();
  
  const obs = data.observations || [];
  console.log(`Total observations: ${obs.length}`);
  
  if (obs.length > 0) {
    const latest = obs[obs.length - 1];
    const date = new Date(latest.valid_time_gmt * 1000);
    console.log(`Latest Observation (WIB): ${date.toLocaleString("en-US", {timeZone: "Asia/Jakarta"})}`);
    console.log(`Temp: ${latest.temp}°C`);
  }
}

checkApi();
