import requests

# 2026 Holiday Calendar [all govt holidays]
HOLIDAYS_2026 = {
    "2026-01-01": "New Year's Day",
    "2026-01-15": "Makara Sankranti",
    "2026-01-26": "Republic Day",
    "2026-02-15": "Maha Shivratri",
    "2026-03-19": "Ugadi",
    "2026-03-21": "Khutub-E-Ramzan",
    "2026-03-31": "Mahaveera Jayanti",
    "2026-04-01": "Annual Bank Closing",
    "2026-04-03": "Good Friday",
    "2026-04-14": "Dr. B.R. Ambedkar Jayanti",
    "2026-04-20": "Basava Jayanti",
    "2026-05-01": "May Day",
    "2026-05-28": "Bakrid",
    "2026-06-26": "Last Day of Moharram",
    "2026-08-15": "Independence Day",
    "2026-08-26": "Eid-e-Milad",
    "2026-09-14": "Varasiddhi Vinayaka Vrata",
    "2026-10-02": "Mahatma Gandhi Jayanti",
    "2026-10-20": "Mahanavami / Ayudha Pooja",
    "2026-10-21": "Vijayadashami",
    "2026-11-10": "Deepavali",
    "2026-11-27": "Kanakadasa Jayanti",
    "2026-12-25": "Christmas Day"
}

def get_coords(zone_name):
    # Using openstreetmap nominatim (custom user agent to avoid 403 blocks)
    headers = {"User-Agent": "LastMile_MVP/0.1"}
    url = f"https://nominatim.openstreetmap.org/search?q={zone_name}&format=json&limit=1"

    try:
        res = requests.get(url, headers=headers, timeout=2)
        data = res.json()
        if not data:
            return None, None
        return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print(f"geocoding failed for {zone_name}: {e}")
        return None, None

def _to_list(value, fallback=0.0):
    if isinstance(value, list):
        return value
    if value is None:
        return []
    return [value] if value != fallback else []

def get_weekly_risk(lat, lon):
    """
    Forecast-based weekly risk for pricing.
    Uses the coming week's forecast, not current conditions.
    """
    status = {
        "rain_days": 0,
        "aqi_days": 0,
        "heat_days": 0,
        "risk_multiplier": 0.0
    }

    if lat is None or lon is None:
        return status

    try:
        w_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}"
            f"&daily=precipitation_sum,temperature_2m_max,wind_speed_10m_max"
            f"&forecast_days=7&timezone=auto"
        )
        w_json = requests.get(w_url, timeout=2).json()
        w_daily = w_json.get("daily", {})

        aqi_url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality?"
            f"latitude={lat}&longitude={lon}"
            f"&daily=pm2_5_max"
            f"&forecast_days=7&timezone=auto"
        )
        aqi_json = requests.get(aqi_url, timeout=2).json()
        aqi_daily = aqi_json.get("daily", {})

        rain_vals = _to_list(w_daily.get("precipitation_sum"))
        temp_vals = _to_list(w_daily.get("temperature_2m_max"))
        wind_vals = _to_list(w_daily.get("wind_speed_10m_max"))
        aqi_vals = _to_list(aqi_daily.get("pm2_5_max"))

        day_count = max(len(rain_vals), len(temp_vals), len(wind_vals), len(aqi_vals), 7)

        for i in range(day_count):
            rain = rain_vals[i] if i < len(rain_vals) else 0
            temp = temp_vals[i] if i < len(temp_vals) else 0
            wind = wind_vals[i] if i < len(wind_vals) else 0
            pm25 = aqi_vals[i] if i < len(aqi_vals) else 0

            if rain > 10.0:
                status["rain_days"] += 1

            if pm25 > 150:
                status["aqi_days"] += 1

            if temp > 35.0:
                status["heat_days"] += 1

            if wind > 30.0:
                # wind is a smaller but real disruption signal
                status["risk_multiplier"] += 0.01

        # weekly risk contribution from forecast signals
        rain_risk = (status["rain_days"] / max(day_count, 1)) * 0.15
        aqi_risk = (status["aqi_days"] / max(day_count, 1)) * 0.10
        heat_risk = (status["heat_days"] / max(day_count, 1)) * 0.08

        status["risk_multiplier"] = round(
            min(rain_risk + aqi_risk + heat_risk + status["risk_multiplier"], 1.0),
            2
        )

    except Exception as e:
        print("forecast error:", e)

    return status

def check_current_conditions(lat, lon):
    """
    Real-time trigger check for payouts.
    Uses current conditions only, which is correct for payout triggers.
    """
    status = {"weather": "normal", "aqi": "normal", "trigger": False}

    if lat is None or lon is None:
        return status

    try:
        w_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&current=precipitation"
        )
        rain = requests.get(w_url, timeout=2).json().get("current", {}).get("precipitation", 0)

        aqi_url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality?"
            f"latitude={lat}&longitude={lon}&current=pm2_5"
        )
        pm25 = requests.get(aqi_url, timeout=2).json().get("current", {}).get("pm2_5", 0)

        if rain > 10.0:
            status["weather"] = "heavy_rain"
            status["trigger"] = True

        if pm25 > 150:
            status["aqi"] = "severe"
            status["trigger"] = True

    except Exception as e:
        print("trigger error:", e)

    return status

def get_festival(dt_str):
    # Returns the name of the festival if it exists, otherwise None
    return HOLIDAYS_2026.get(dt_str)
