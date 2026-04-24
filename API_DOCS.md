# Weathergent API Documentation

Welcome to the Weathergent API. This API provides access to historical weather observations and high-resolution forecasts for 40+ global cities, synchronized from multiple premium sources (Weather Underground & Aviation Weather).

## Base URL
All API requests should be made to:
`https://weathergent.io/api` (or `http://localhost:3000/api` for local development)

---

## 1. Cities List
Retrieve a list of all cities currently tracked by the system.

### Endpoint
`GET /cities`

### Response Example
```json
{
  "success": true,
  "cities": [
    {
      "name": "New York",
      "slug": "new-york",
      "icao": "KLGA",
      "station": "KLGA:9:US",
      "timezone": "America/New_York",
      "latitude": 40.77,
      "longitude": -73.87
    }
  ]
}
```

---

## 2. Weather Data
Fetch detailed hourly observations and forecasts for a specific city on a specific date.

### Endpoint
`GET /weather?city={slug}&date={YYYYMMDD}`

### Parameters
| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `city`    | string | Yes      | The city slug (e.g., `london`, `tokyo`). |
| `date`    | string | Yes      | Target date in `YYYYMMDD` format. |

### Response Example
```json
{
  "success": true,
  "city": "Singapore",
  "icao": "WSSS",
  "date": "20240424",
  "timezone": "Asia/Singapore",
  "data": [
    {
      "timestamp": 1713916800,
      "wuHistory": {
        "temp": 28,
        "condition": "Partly Cloudy",
        "precip_rate": 0
      },
      "wuForecast": {
        "temp": 29,
        "phrase": "Scattered Clouds"
      },
      "aviationHistory": {
        "temp": 28.1,
        "altim": 1010
      },
      "wuExactTime": 1713916740,
      "wuSyncedAt": "2024-04-24T00:02:15Z"
    }
  ]
}
```

---

## 3. Global Sync (Internal/Cron)
Trigger a background synchronization for all cities. This endpoint is typically called by a GitHub Action or Vercel Cron.

### Endpoint
`GET /cron/sync`

### Authentication
Requires a Bearer token in the `Authorization` header.
`Authorization: Bearer <CRON_SECRET>`

### Response Example
```json
{
  "success": true,
  "timestamp": "2024-04-24T02:00:00.000Z",
  "results": [
    { "city": "Singapore", "success": true, "records": 48 },
    { "city": "London", "success": true, "records": 48 }
  ]
}
```

---

## Error Handling
The API uses standard HTTP status codes:
- `200 OK`: Request was successful.
- `400 Bad Request`: Missing required parameters.
- `401 Unauthorized`: Missing or invalid Bearer token.
- `404 Not Found`: City or date not found in the database.
- `500 Internal Server Error`: Unexpected database or API error.

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message description",
  "hint": "Optional troubleshooting hint"
}
```
