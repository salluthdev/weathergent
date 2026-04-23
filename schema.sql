-- Weather Records Table Schema
-- This script recreates the database structure for the Weathergent project.

CREATE TABLE IF NOT EXISTS weather_records (
    id BIGSERIAL PRIMARY KEY,
    city_name TEXT NOT NULL,
    station_id TEXT NOT NULL,
    timestamp_gmt BIGINT NOT NULL,
    city_time TEXT,
    wib_time TEXT,
    temp_c_wu NUMERIC,
    temp_f_wu NUMERIC,
    forecast_c_wu NUMERIC,
    forecast_f_wu NUMERIC,
    history_c_aviation NUMERIC,
    history_f_aviation NUMERIC,
    condition_history_wu TEXT,
    condition_forecast_wu TEXT,
    forecast_history_wu JSONB DEFAULT '[]'::jsonb,
    forecast_updated_at_wu TIMESTAMPTZ,
    wu_exact_time BIGINT,
    wu_synced_at TIMESTAMPTZ,
    aviation_exact_time BIGINT,
    aviation_synced_at TIMESTAMPTZ,
    diff_wu_history_aviation_history NUMERIC,
    diff_wu_history_wu_forecast NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique records per city and time slot
    UNIQUE(city_name, timestamp_gmt)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_weather_records_city_date ON weather_records (city_name, timestamp_gmt);

-- Comments for documentation
COMMENT ON TABLE weather_records IS 'Stores 30-minute interval weather observations and forecasts.';
COMMENT ON COLUMN weather_records.wu_exact_time IS 'Exact observation timestamp from Wunderground API';
COMMENT ON COLUMN weather_records.aviation_exact_time IS 'Exact report timestamp from METAR API';
