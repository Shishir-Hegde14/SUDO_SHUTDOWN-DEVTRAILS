from flask import Flask, request, jsonify
from datetime import datetime, timedelta
from uuid import uuid4

import trigger_engine as triggers
from pricing_engine import calculate_premium, generate_plans

app = Flask(__name__)

quotes = {}
policies = {}
user_policies = {}

def parse_time_to_minutes(time_str):
    if time_str is None:
        return None

    text = str(time_str).strip()
    for fmt in ("%H:%M", "%H:%M:%S", "%I:%M %p", "%I:%M%p"):
        try:
            parsed = datetime.strptime(text, fmt)
            return parsed.hour * 60 + parsed.minute
        except ValueError:
            continue
    return None

def split_shift_interval(start_minutes, end_minutes):
    if start_minutes is None or end_minutes is None:
        return []
    if end_minutes > start_minutes:
        return [(start_minutes, end_minutes)]
    if end_minutes == start_minutes:
        return []
    return [(start_minutes, 1440), (0, end_minutes)]

def overlap_minutes(a_start, a_end, b_start, b_end):
    return max(0, min(a_end, b_end) - max(a_start, b_start))

def get_week_start(date_str):
    dt = datetime.strptime(date_str, "%Y-%m-%d").date()
    monday = dt - timedelta(days=dt.weekday())
    return monday.isoformat()

def classify_risk(risk_score):
    if risk_score < 0.10:
        return "Low"
    if risk_score < 0.25:
        return "Medium"
    return "High"

def compute_shift_adjustment(shift_start=None, shift_end=None, working_days_per_week=6):
    default = {
        "shift_hours": None,
        "peak_overlap_hours": 0.0,
        "shift_exposure_multiplier": 1.0,
        "shift_risk_modifier": 0.0,
    }

    if shift_start is None and shift_end is None:
        return default

    if shift_start is None or shift_end is None:
        raise ValueError("shift_start and shift_end must both be provided")

    start_minutes = parse_time_to_minutes(shift_start)
    end_minutes = parse_time_to_minutes(shift_end)

    if start_minutes is None or end_minutes is None:
        raise ValueError("shift_start and shift_end must be valid times like 18:00 or 6:00 PM")

    if not isinstance(working_days_per_week, int):
        raise ValueError("working_days_per_week must be an integer between 1 and 7")

    if working_days_per_week < 1 or working_days_per_week > 7:
        raise ValueError("working_days_per_week must be between 1 and 7")

    intervals = split_shift_interval(start_minutes, end_minutes)
    shift_minutes = sum(end - start for start, end in intervals)

    if shift_minutes <= 0:
        return default

    # Lunch peak and dinner peak windows
    peak_windows = [(12 * 60, 14 * 60), (18 * 60, 22 * 60)]
    peak_overlap = 0

    for shift_start_min, shift_end_min in intervals:
        for peak_start_min, peak_end_min in peak_windows:
            peak_overlap += overlap_minutes(shift_start_min, shift_end_min, peak_start_min, peak_end_min)

    shift_hours = shift_minutes / 60.0
    peak_overlap_hours = peak_overlap / 60.0
    peak_fraction = peak_overlap / shift_minutes if shift_minutes else 0.0

    hours_factor = min(max(shift_hours / 8.0, 0.75), 1.25)
    peak_factor = 1.0 + min(max(peak_fraction, 0.0), 1.0) * 0.15
    days_factor = min(max(working_days_per_week / 6.0, 0.85), 1.15)

    shift_exposure_multiplier = round(hours_factor * peak_factor * days_factor, 2)

    shift_risk_modifier = (
        max(shift_hours - 8.0, 0.0) * 0.01
        + peak_fraction * 0.05
        + max(working_days_per_week - 6, 0) * 0.01
    )
    shift_risk_modifier = round(min(shift_risk_modifier, 0.15), 2)

    return {
        "shift_hours": round(shift_hours, 2),
        "peak_overlap_hours": round(peak_overlap_hours, 2),
        "shift_exposure_multiplier": shift_exposure_multiplier,
        "shift_risk_modifier": shift_risk_modifier,
    }

def build_quote(lat, lon, date, weekly_earnings, shift_start=None, shift_end=None, working_days_per_week=6):
    try:
        week_start = get_week_start(date)
    except ValueError:
        raise ValueError("date must be in YYYY-MM-DD format")

    festival_name = triggers.get_festival(date)
    is_fest = bool(festival_name)

    weekly_risk = triggers.get_weekly_risk(lat, lon)
    shift_data = compute_shift_adjustment(shift_start, shift_end, working_days_per_week)

    combined_risk_mod = min(weekly_risk["risk_multiplier"] + shift_data["shift_risk_modifier"], 1.0)
    zone_risk_score = min(combined_risk_mod + (0.05 if is_fest else 0.0), 1.0)
    zone_risk_label = classify_risk(zone_risk_score)

    effective_weekly_earnings = round(weekly_earnings * shift_data["shift_exposure_multiplier"], 2)

    base_premium = calculate_premium(
        base_earnings=effective_weekly_earnings,
        prob=0.08,
        severity=0.20,
        is_fest=is_fest,
        env_risk_mod=combined_risk_mod
    )

    plans = generate_plans(base_premium, weekly_earnings)

    risk_factors = []
    if weekly_risk["rain_days"] > 0:
        risk_factors.append("forecast_rain")
    if weekly_risk["aqi_days"] > 0:
        risk_factors.append("forecast_aqi")
    if weekly_risk["heat_days"] > 0:
        risk_factors.append("forecast_heat")
    if is_fest:
        risk_factors.append(festival_name)
    if shift_data["shift_risk_modifier"] > 0:
        risk_factors.append("shift_timing_risk")

    quote_id = str(uuid4())
    quote = {
        "quote_id": quote_id,
        "lat": lat,
        "lon": lon,
        "date": date,
        "week_start": week_start,
        "weekly_earnings": round(weekly_earnings, 2),
        "effective_weekly_earnings": effective_weekly_earnings,
        "shift_start": shift_start,
        "shift_end": shift_end,
        "working_days_per_week": working_days_per_week,
        "shift_hours": shift_data["shift_hours"],
        "peak_overlap_hours": shift_data["peak_overlap_hours"],
        "shift_exposure_multiplier": shift_data["shift_exposure_multiplier"],
        "festival": festival_name,
        "zone_risk_score": round(zone_risk_score, 2),
        "zone_risk_label": zone_risk_label,
        "rain_days_next_week": weekly_risk["rain_days"],
        "aqi_days_next_week": weekly_risk["aqi_days"],
        "heat_days_next_week": weekly_risk["heat_days"],
        "risk_multiplier": round(weekly_risk["risk_multiplier"], 2),
        "shift_risk_modifier": shift_data["shift_risk_modifier"],
        "combined_risk_modifier": round(combined_risk_mod, 2),
        "risk_factors": risk_factors,
        "base_premium": base_premium,
        "plans": plans,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    quotes[quote_id] = quote
    return quote

def pick_plan(plans, selected_plan_name=None, selected_plan_index=None):
    if selected_plan_index is not None:
        try:
            idx = int(selected_plan_index)
            if 0 <= idx < len(plans):
                return plans[idx]
        except (TypeError, ValueError):
            pass

    if selected_plan_name:
        for plan in plans:
            if plan["name"].lower() == str(selected_plan_name).lower():
                return plan

    return None

def test_quote(lat, lon, date, weekly_earnings=5000, shift_start="18:00", shift_end="23:00", working_days_per_week=6):
    print(f"\n>> running quote for: ({lat}, {lon}) | date: {date}")

    quote = build_quote(lat, lon, date, weekly_earnings, shift_start, shift_end, working_days_per_week)

    fest_str = quote["festival"] if quote["festival"] else "None"
    print(f"conditions -> rain_days: {quote['rain_days_next_week']}, aqi_days: {quote['aqi_days_next_week']}, heat_days: {quote['heat_days_next_week']}, holiday: {fest_str}")
    print(f"shift -> hours: {quote['shift_hours']} | peak overlap hours: {quote['peak_overlap_hours']}")
    print(f"zone risk -> score: {quote['zone_risk_score']} | label: {quote['zone_risk_label']}")
    print(f"BASE PREMIUM: Rs. {quote['base_premium']}")

    print("\nAVAILABLE PLANS:")
    for i, plan in enumerate(quote["plans"], start=1):
        print(f"{i}. {plan['name']} → Premium: Rs.{plan['premium']} | Coverage: Rs.{plan['coverage']}")

@app.get("/")
def home():
    return jsonify({
        "status": "ok",
        "message": "LastMile pricing API is running. Use /health, POST /quote, POST /trigger/check, or POST /policy/create."
    }), 200

@app.get("/health")
def health():
    return jsonify({"status": "ok"}), 200

@app.post("/quote")
def create_quote():
    data = request.get_json(silent=True) or {}

    try:
        lat = float(data.get("lat"))
        lon = float(data.get("lon"))
    except (TypeError, ValueError):
        return jsonify({"error": "lat and lon are required and must be numbers"}), 400

    date = data.get("date")
    if not date:
        return jsonify({"error": "date is required"}), 400
    date = str(date)

    weekly_earnings_value = data.get("weekly_earnings", data.get("earnings"))
    try:
        weekly_earnings = float(weekly_earnings_value)
    except (TypeError, ValueError):
        return jsonify({"error": "weekly_earnings (or earnings) is required and must be a number"}), 400

    shift_start = data.get("shift_start")
    shift_end = data.get("shift_end")

    if (shift_start is None) ^ (shift_end is None):
        return jsonify({"error": "shift_start and shift_end must either both be provided or both be omitted"}), 400

    working_days_per_week = data.get("working_days_per_week", 6)
    try:
        working_days_per_week = int(working_days_per_week)
    except (TypeError, ValueError):
        return jsonify({"error": "working_days_per_week must be an integer between 1 and 7"}), 400

    try:
        quote = build_quote(
            lat=lat,
            lon=lon,
            date=date,
            weekly_earnings=weekly_earnings,
            shift_start=shift_start,
            shift_end=shift_end,
            working_days_per_week=working_days_per_week
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify(quote), 200

@app.get("/quote/<quote_id>")
def get_quote(quote_id):
    quote = quotes.get(quote_id)
    if not quote:
        return jsonify({"error": "quote not found"}), 404
    return jsonify(quote), 200

@app.post("/trigger/check")
def trigger_check():
    data = request.get_json(silent=True) or {}

    try:
        lat = float(data.get("lat"))
        lon = float(data.get("lon"))
    except (TypeError, ValueError):
        return jsonify({"error": "lat and lon are required and must be numbers"}), 400

    status = triggers.check_current_conditions(lat, lon)
    return jsonify(status), 200

@app.post("/policy/create")
def create_policy():
    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    if user_id is None or str(user_id).strip() == "":
        return jsonify({"error": "user_id is required"}), 400

    quote = None

    quote_id = data.get("quote_id")
    if quote_id:
        quote = quotes.get(str(quote_id))
        if not quote:
            return jsonify({"error": "quote_id not found"}), 404
    else:
        try:
            lat = float(data.get("lat"))
            lon = float(data.get("lon"))
        except (TypeError, ValueError):
            return jsonify({"error": "lat and lon are required and must be numbers if quote_id is not provided"}), 400

        date = data.get("date")
        if not date:
            return jsonify({"error": "date is required if quote_id is not provided"}), 400
        date = str(date)

        weekly_earnings_value = data.get("weekly_earnings", data.get("earnings"))
        try:
            weekly_earnings = float(weekly_earnings_value)
        except (TypeError, ValueError):
            return jsonify({"error": "weekly_earnings (or earnings) is required and must be a number if quote_id is not provided"}), 400

        shift_start = data.get("shift_start")
        shift_end = data.get("shift_end")
        if (shift_start is None) ^ (shift_end is None):
            return jsonify({"error": "shift_start and shift_end must either both be provided or both be omitted"}), 400

        working_days_per_week = data.get("working_days_per_week", 6)
        try:
            working_days_per_week = int(working_days_per_week)
        except (TypeError, ValueError):
            return jsonify({"error": "working_days_per_week must be an integer between 1 and 7"}), 400

        try:
            quote = build_quote(
                lat=lat,
                lon=lon,
                date=date,
                weekly_earnings=weekly_earnings,
                shift_start=shift_start,
                shift_end=shift_end,
                working_days_per_week=working_days_per_week
            )
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    selected_plan = pick_plan(
        quote["plans"],
        selected_plan_name=data.get("selected_plan_name"),
        selected_plan_index=data.get("selected_plan_index")
    )

    if not selected_plan:
        return jsonify({
            "error": "selected_plan_name (or selected_plan_index) is required and must match one of the quote plans"
        }), 400

    policy_id = str(uuid4())
    policy = {
        "policy_id": policy_id,
        "user_id": str(user_id),
        "quote_id": quote["quote_id"],
        "week_start": quote["week_start"],
        "plan_name": selected_plan["name"],
        "premium": selected_plan["premium"],
        "coverage": selected_plan["coverage"],
        "status": "active",
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    policies[policy_id] = policy
    user_policies[str(user_id)] = policy

    return jsonify(policy), 201

@app.get("/policy/<user_id>")
def get_policy(user_id):
    policy = user_policies.get(str(user_id))
    if not policy:
        return jsonify({"error": "policy not found"}), 404
    return jsonify(policy), 200

@app.get("/policy/id/<policy_id>")
def get_policy_by_id(policy_id):
    policy = policies.get(policy_id)
    if not policy:
        return jsonify({"error": "policy not found"}), 404
    return jsonify(policy), 200
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)