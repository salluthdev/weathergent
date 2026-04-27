# Weathergent API Documentation

Welcome to the Weathergent API. This API provides access to historical weather observations and high-resolution forecasts for 40+ global cities, synchronized from multiple premium sources (Weather Underground & Aviation Weather).

## Base URL

All API requests should be made to:
`https://weathergent.aixbet.app/api`

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
      "longitude": -73.87,
      "current_date": "20240424"
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

| Parameter | Type   | Required | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| `city`    | string | Yes      | The city slug (e.g., `london`, `tokyo`). |
| `date`    | string | Yes      | Target date in `YYYYMMDD` format.        |

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
      "wuTemperatureHistory": {
        "temp": 28,
        "condition": "Partly Cloudy",
        "wuExactTime": 1713916740,
        "wuSyncedAt": "2024-04-24T00:02:15Z"
      },
      "aviationTemperatureHistory": {
        "temp": 28.1,
        "aviationExactTime": 1713916800,
        "aviationSyncedAt": "2024-04-24T00:05:00Z"
      },
      "wuForecast": {
        "temp": 29,
        "condition": "Scattered Clouds",
        "updated_at": "2024-04-24T00:00:00Z",
        "wuForecastHistory": []
      }
    }
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
