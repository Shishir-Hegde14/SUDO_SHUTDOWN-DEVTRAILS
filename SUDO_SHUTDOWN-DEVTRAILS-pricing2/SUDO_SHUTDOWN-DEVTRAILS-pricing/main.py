from __future__ import annotations

import json
import os
import secrets
import sqlite3
from datetime import date as date_cls
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4

from flask import Flask, jsonify, request
from flask_cors import CORS

import area_model
import fraud_engine
import trigger_engine as triggers
from external_feeds import STATE_FUEL_BASELINE, get_fuel_context, get_holiday_context
from pricing_engine import calculate_premium, generate_plans

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # pragma: no cover
    psycopg = None
    dict_row = None

app = Flask(__name__)
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").strip()
if CORS_ORIGINS == "*" or not CORS_ORIGINS:
    CORS(app)
else:
    CORS(app, origins=[item.strip() for item in CORS_ORIGINS.split(",") if item.strip()])

DB_PATH = Path(__file__).resolve().with_name("lastmile.db")
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
USE_POSTGRES = DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://")


class _DBCursor:
    def __init__(self, cursor, use_postgres: bool):
        self._cursor = cursor
        self._use_postgres = use_postgres

    def execute(self, query: str, params=()):
        sql = query.replace("?", "%s") if self._use_postgres else query
        return self._cursor.execute(sql, params)

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def __getattr__(self, item):
        return getattr(self._cursor, item)


class _DBConn:
    def __init__(self, conn, use_postgres: bool):
        self._conn = conn
        self._use_postgres = use_postgres

    def execute(self, query: str, params=()):
        sql = query.replace("?", "%s") if self._use_postgres else query
        return self._conn.execute(sql, params)

    def cursor(self):
        return _DBCursor(self._conn.cursor(), self._use_postgres)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    def __getattr__(self, item):
        return getattr(self._conn, item)


def _db():
    if USE_POSTGRES:
        if psycopg is None:
            raise RuntimeError("DATABASE_URL is set but psycopg is not installed")
        raw = psycopg.connect(DATABASE_URL, row_factory=dict_row)
        return _DBConn(raw, True)
    raw = sqlite3.connect(DB_PATH)
    raw.row_factory = sqlite3.Row
    return _DBConn(raw, False)


def init_db():
    conn = _db()
    cur = conn.cursor()
    if USE_POSTGRES:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              name TEXT,
              created_at TEXT NOT NULL
            )
            """
        )
    else:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT UNIQUE NOT NULL,
              name TEXT,
              created_at TEXT NOT NULL
            )
            """
        )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS quotes (
          quote_id TEXT PRIMARY KEY,
          user_id INTEGER,
          payload_json TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS policies (
          policy_id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          quote_id TEXT NOT NULL,
          week_start TEXT NOT NULL,
          plan_name TEXT NOT NULL,
          premium REAL NOT NULL,
          coverage REAL NOT NULL,
          payout_date TEXT NOT NULL,
          payment_method TEXT NOT NULL,
          upi_id TEXT,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
        """
    )
    if not USE_POSTGRES:
        cols = [row["name"] for row in cur.execute("PRAGMA table_info(policies)").fetchall()]
        if "week_start" not in cols:
            cur.execute("ALTER TABLE policies ADD COLUMN week_start TEXT NOT NULL DEFAULT ''")
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS onboarding (
          user_id INTEGER PRIMARY KEY,
          data_json TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS claims (
          claim_id TEXT PRIMARY KEY,
          policy_id TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          week_start TEXT NOT NULL,
          trigger_date TEXT NOT NULL,
          trigger_reason TEXT NOT NULL,
          amount REAL NOT NULL,
          status TEXT NOT NULL,
          payout_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(policy_id, week_start)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS payouts (
          payout_id TEXT PRIMARY KEY,
          claim_id TEXT UNIQUE NOT NULL,
          policy_id TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          status TEXT NOT NULL,
          paid_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS job_runs (
          job_name TEXT PRIMARY KEY,
          last_run_date TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


init_db()


def _run_daily_claim_monitor(run_date: date_cls | None = None):
    monitor_date = run_date or date_cls.today()
    monitor_date_str = monitor_date.isoformat()
    now = datetime.utcnow().isoformat() + "Z"

    conn = _db()
    last_run = conn.execute(
        "SELECT last_run_date FROM job_runs WHERE job_name = 'daily_claim_monitor'"
    ).fetchone()
    if last_run and last_run["last_run_date"] == monitor_date_str:
        conn.close()
        return {"status": "already_ran", "date": monitor_date_str}

    scanned = 0
    claims_created = 0
    payouts_processed = 0
    policies_expired_without_trigger = 0

    active_policies = conn.execute(
        """
        SELECT p.policy_id, p.user_id, p.quote_id, p.week_start, p.coverage, p.payout_date, q.payload_json
        FROM policies p
        JOIN quotes q ON q.quote_id = p.quote_id
        WHERE p.status = 'active'
        """
    ).fetchall()

    for policy in active_policies:
        scanned += 1
        quote = json.loads(policy["payload_json"])
        lat = _optional_float(quote.get("lat"))
        lon = _optional_float(quote.get("lon"))
        if lat is None or lon is None:
            continue

        trigger_status = triggers.check_current_conditions(lat, lon)
        reasons = []
        if trigger_status.get("weather") and trigger_status.get("weather") != "normal":
            reasons.append(trigger_status["weather"])
        if trigger_status.get("aqi") and trigger_status.get("aqi") != "normal":
            reasons.append(trigger_status["aqi"])

        if trigger_status.get("trigger") and reasons:
            existing = conn.execute(
                "SELECT claim_id FROM claims WHERE policy_id = ? AND week_start = ?",
                (policy["policy_id"], policy["week_start"]),
            ).fetchone()
            if not existing:
                claim_id = str(uuid4())
                conn.execute(
                    """
                    INSERT INTO claims(claim_id, policy_id, user_id, week_start, trigger_date, trigger_reason, amount, status, payout_id, created_at, updated_at)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?)
                    """,
                    (
                        claim_id,
                        policy["policy_id"],
                        policy["user_id"],
                        policy["week_start"],
                        monitor_date_str,
                        ", ".join(reasons),
                        float(policy["coverage"]),
                        "validated",
                        None,
                        now,
                        now,
                    ),
                )
                claims_created += 1

        payout_date = datetime.strptime(policy["payout_date"], "%Y-%m-%d").date()
        if payout_date <= monitor_date:
            claim = conn.execute(
                """
                SELECT claim_id, amount, status
                FROM claims
                WHERE policy_id = ? AND week_start = ?
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (policy["policy_id"], policy["week_start"]),
            ).fetchone()

            if claim and claim["status"] in ("created", "validated"):
                payout_id = str(uuid4())
                conn.execute(
                    """
                    INSERT INTO payouts(payout_id, claim_id, policy_id, user_id, amount, status, paid_at, created_at)
                    VALUES(?,?,?,?,?,?,?,?)
                    """,
                    (
                        payout_id,
                        claim["claim_id"],
                        policy["policy_id"],
                        policy["user_id"],
                        float(claim["amount"]),
                        "completed",
                        monitor_date_str,
                        now,
                    ),
                )
                conn.execute(
                    "UPDATE claims SET status = ?, payout_id = ?, updated_at = ? WHERE claim_id = ?",
                    ("paid", payout_id, now, claim["claim_id"]),
                )
                conn.execute(
                    "UPDATE policies SET status = ? WHERE policy_id = ?",
                    ("paid_out", policy["policy_id"]),
                )
                payouts_processed += 1
            elif not claim:
                conn.execute(
                    "UPDATE policies SET status = ? WHERE policy_id = ?",
                    ("expired_no_trigger", policy["policy_id"]),
                )
                policies_expired_without_trigger += 1

    conn.execute(
        """
        INSERT INTO job_runs(job_name, last_run_date) VALUES(?,?)
        ON CONFLICT(job_name) DO UPDATE SET last_run_date = excluded.last_run_date
        """,
        ("daily_claim_monitor", monitor_date_str),
    )
    conn.commit()
    conn.close()

    return {
        "status": "ok",
        "date": monitor_date_str,
        "policies_scanned": scanned,
        "claims_created": claims_created,
        "payouts_processed": payouts_processed,
        "policies_expired_without_trigger": policies_expired_without_trigger,
    }


def _ensure_daily_monitor():
    try:
        _run_daily_claim_monitor()
    except Exception as err:
        print(f"daily monitor failed: {err}")


def _is_cron_authorized():
    secret = os.getenv("CRON_SECRET", "").strip()
    if not secret:
        return False
    provided = request.headers.get("X-Cron-Token", "").strip()
    if not provided:
        return False
    return secrets.compare_digest(provided, secret)


def _to_float(value, field_name: str):
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid number")


def _optional_float(value):
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value, field_name: str):
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid integer")


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
    if working_days_per_week < 1 or working_days_per_week > 7:
        raise ValueError("working_days_per_week must be between 1 and 7")

    intervals = split_shift_interval(start_minutes, end_minutes)
    shift_minutes = sum(end - start for start, end in intervals)
    if shift_minutes <= 0:
        return default

    peak_windows = [(12 * 60, 14 * 60), (18 * 60, 22 * 60)]
    peak_overlap = 0
    for shift_start_min, shift_end_min in intervals:
        for peak_start_min, peak_end_min in peak_windows:
            peak_overlap += overlap_minutes(shift_start_min, shift_end_min, peak_start_min, peak_end_min)

    shift_hours = shift_minutes / 60.0
    peak_overlap_hours = peak_overlap / 60.0
    peak_fraction = peak_overlap / shift_minutes if shift_minutes else 0.0

    hours_factor = min(max(shift_hours / 8.0, 0.75), 1.30)
    peak_factor = 1.0 + min(max(peak_fraction, 0.0), 1.0) * 0.15
    days_factor = min(max(working_days_per_week / 6.0, 0.85), 1.20)
    shift_exposure_multiplier = round(hours_factor * peak_factor * days_factor, 3)

    shift_risk_modifier = (
        max(shift_hours - 8.0, 0.0) * 0.01
        + peak_fraction * 0.05
        + max(working_days_per_week - 6, 0) * 0.01
    )
    shift_risk_modifier = round(min(shift_risk_modifier, 0.15), 4)

    return {
        "shift_hours": round(shift_hours, 2),
        "peak_overlap_hours": round(peak_overlap_hours, 2),
        "shift_exposure_multiplier": shift_exposure_multiplier,
        "shift_risk_modifier": shift_risk_modifier,
    }


def _extract_location(data):
    lat = _optional_float(data.get("lat", data.get("latitude")))
    lon = _optional_float(data.get("lon", data.get("longitude")))
    zone_name = (data.get("zone_name") or data.get("work_area") or data.get("area_name") or "").strip() or None
    if lat is None or lon is None:
        if zone_name:
            lat, lon = triggers.get_coords(zone_name)
        else:
            raise ValueError("Provide either latitude/longitude or a valid zone_name")
    if lat is None or lon is None:
        raise ValueError("Could not resolve coordinates from provided location input")
    return lat, lon, zone_name


def _extract_date(data):
    date_value = data.get("date")
    if not date_value:
        return date_cls.today().isoformat()
    text = str(date_value).strip()
    datetime.strptime(text, "%Y-%m-%d")
    return text


def _extract_weekly_earnings(data):
    earnings_value = data.get("weekly_earnings", data.get("earnings", data.get("base_earnings")))
    if earnings_value is None:
        raise ValueError("weekly_earnings (or earnings/base_earnings) is required")
    earnings = _to_float(earnings_value, "weekly_earnings")
    if earnings <= 0:
        raise ValueError("weekly_earnings must be greater than zero")
    return earnings


def build_quote(data):
    lat, lon, zone_name = _extract_location(data)
    date_str = _extract_date(data)
    weekly_earnings = _extract_weekly_earnings(data)

    shift_start = data.get("shift_start", data.get("work_start_time"))
    shift_end = data.get("shift_end", data.get("work_end_time"))
    if (shift_start is None) ^ (shift_end is None):
        raise ValueError("shift_start and shift_end must either both be provided or both be omitted")

    working_days = _to_int(data.get("working_days_per_week", data.get("working_days_count", 6)), "working_days_per_week")
    base_prob = min(max(_optional_float(data.get("prob")) or 0.08, 0.0), 1.0)
    severity = min(max(_optional_float(data.get("severity")) or 0.20, 0.01), 1.0)

    input_city = (data.get("city") or "").strip() or None
    input_state = (data.get("state") or data.get("work_area_state") or "").strip() or None
    work_app = (data.get("work_app") or "").strip() or None
    vehicle_type = (data.get("vehicle_type") or "").strip() or None

    week_start = get_week_start(date_str)
    weekly_risk = triggers.get_weekly_risk(lat, lon)
    weather_status = "weather_alert" if weekly_risk["rain_days"] > 0 else "stable"
    aqi_status = "air_alert" if weekly_risk["aqi_days"] > 0 else "stable"
    shift_data = compute_shift_adjustment(shift_start, shift_end, working_days)

    area_context = area_model.get_area_context(
        city=input_city,
        state=input_state,
        zone_name=zone_name,
        lat=lat,
        lon=lon,
    )
    holiday_context = get_holiday_context(date_str)
    fuel_context = get_fuel_context(area_context.get("state") or input_state, date_str)
    area_uncertainty_modifier = 0.005 if zone_name else 0.0

    combined_risk_modifier = (
        weekly_risk["risk_multiplier"]
        + shift_data["shift_risk_modifier"]
        + holiday_context["risk_modifier"]
        + fuel_context["risk_modifier"]
        + area_uncertainty_modifier
    )
    combined_risk_modifier = round(min(max(combined_risk_modifier, 0.0), 1.0), 4)

    demand_multiplier = (
        area_context["consumption_multiplier"]
        + holiday_context["demand_modifier"]
        + fuel_context["demand_modifier"]
    )
    demand_multiplier = round(min(max(demand_multiplier, 0.75), 1.80), 3)

    effective_weekly_earnings = round(
        weekly_earnings * shift_data["shift_exposure_multiplier"] * demand_multiplier,
        2,
    )
    premium = calculate_premium(
        base_earnings=effective_weekly_earnings,
        prob=base_prob,
        severity=severity,
        is_fest=holiday_context["is_holiday"],
        env_risk_mod=combined_risk_modifier,
    )
    state_baseline = 102.0
    if area_context.get("state"):
        state_baseline = STATE_FUEL_BASELINE.get(area_context["state"].strip().lower(), state_baseline)
    plans = generate_plans(
        premium,
        effective_weekly_earnings,
        fuel_price=fuel_context["fuel_price"],
        baseline_fuel_price=state_baseline,
    )
    total_probability = round(min(base_prob + combined_risk_modifier, 1.0), 4)
    zone_risk_score = round(min(combined_risk_modifier + (0.05 if holiday_context["is_holiday"] else 0.0), 1.0), 4)

    fraud_data = fraud_engine.score_quote_fraud(
        weekly_earnings=weekly_earnings,
        working_days_per_week=working_days,
        shift_hours=shift_data["shift_hours"],
        area_context=area_context,
        input_city=input_city,
        resolved_city=area_context.get("city"),
    )

    quote_id = str(uuid4())
    return {
        "quote_id": quote_id,
        "date": date_str,
        "week_start": week_start,
        "lat": lat,
        "lon": lon,
        "zone_name": zone_name,
        "city": area_context.get("city") or input_city,
        "state": area_context.get("state") or input_state,
        "work_app": work_app,
        "vehicle_type": vehicle_type,
        "working_days_per_week": working_days,
        "shift_start": shift_start,
        "shift_end": shift_end,
        "weekly_earnings": round(weekly_earnings, 2),
        "effective_weekly_earnings": effective_weekly_earnings,
        "weather": weather_status,
        "aqi": aqi_status,
        "holiday": holiday_context["holiday_name"],
        "fuel_price": fuel_context["fuel_price"],
        "fuel_price_source": fuel_context["source"],
        "risk_multiplier": combined_risk_modifier,
        "total_probability": total_probability,
        "zone_risk_score": zone_risk_score,
        "zone_risk_label": classify_risk(zone_risk_score),
        "premium": premium,
        "plans": plans,
        "fraud_score": fraud_data["fraud_score"],
        "fraud_risk_level": fraud_data["fraud_risk_level"],
        "created_at": datetime.utcnow().isoformat() + "Z",
    }


def _auth_user():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.replace("Bearer ", "", 1).strip()
    conn = _db()
    row = conn.execute(
        """
        SELECT users.id, users.email, users.name
        FROM sessions JOIN users ON sessions.user_id = users.id
        WHERE sessions.token = ?
        """,
        (token,),
    ).fetchone()
    conn.close()
    user = dict(row) if row else None
    if user:
        _ensure_daily_monitor()
    return user


@app.get("/")
def home():
    return jsonify({"status": "ok", "message": "LastMile API running"}), 200


@app.get("/health")
def health():
    try:
        conn = _db()
        conn.execute("SELECT 1")
        conn.close()
        db_status = "ok"
    except Exception as err:
        db_status = f"error: {err}"
    return jsonify({"status": "ok", "database": "postgres" if USE_POSTGRES else "sqlite", "db_status": db_status}), 200


@app.post("/auth/signup")
def auth_signup():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email") or "").strip().lower()
    name = str(data.get("name") or "").strip()
    if not email:
        return jsonify({"error": "email is required"}), 400

    conn = _db()
    try:
        conn.execute(
            "INSERT INTO users(email, name, created_at) VALUES(?,?,?)",
            (email, name, datetime.utcnow().isoformat() + "Z"),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "email already in use"}), 409

    user = conn.execute("SELECT id, email, name FROM users WHERE email = ?", (email,)).fetchone()
    token = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO sessions(token, user_id, created_at) VALUES(?,?,?)",
        (token, user["id"], datetime.utcnow().isoformat() + "Z"),
    )
    conn.commit()
    conn.close()
    return jsonify({"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"]}}), 201


@app.post("/auth/signin")
def auth_signin():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "email is required"}), 400
    conn = _db()
    user = conn.execute("SELECT id, email, name FROM users WHERE email = ?", (email,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "account not found"}), 404
    token = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO sessions(token, user_id, created_at) VALUES(?,?,?)",
        (token, user["id"], datetime.utcnow().isoformat() + "Z"),
    )
    conn.commit()
    conn.close()
    return jsonify({"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"]}}), 200


@app.get("/auth/session")
def auth_session():
    user = _auth_user()
    if not user:
        return jsonify({"error": "unauthorized"}), 401
    return jsonify({"user": user}), 200


@app.post("/quote")
def create_quote():
    data = request.get_json(silent=True) or {}
    try:
        quote = build_quote(data)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    user = _auth_user()
    user_id = user["id"] if user else None
    conn = _db()
    conn.execute(
        "INSERT INTO quotes(quote_id, user_id, payload_json, created_at) VALUES(?,?,?,?)",
        (quote["quote_id"], user_id, json.dumps(quote), datetime.utcnow().isoformat() + "Z"),
    )
    conn.commit()
    conn.close()
    return jsonify(quote), 200


@app.get("/quote/<quote_id>")
def get_quote(quote_id):
    conn = _db()
    row = conn.execute("SELECT payload_json FROM quotes WHERE quote_id = ?", (quote_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "quote not found"}), 404
    return jsonify(json.loads(row["payload_json"])), 200


@app.post("/policy/create")
def create_policy():
    user = _auth_user()
    if not user:
        return jsonify({"error": "unauthorized"}), 401
    data = request.get_json(silent=True) or {}
    quote_id = str(data.get("quote_id") or "").strip()
    plan_name = str(data.get("selected_plan_name") or "").strip()
    payment_method = str(data.get("payment_method") or "").strip()
    upi_id = str(data.get("upi_id") or "").strip()
    if not quote_id or not plan_name or not payment_method:
        return jsonify({"error": "quote_id, selected_plan_name and payment_method are required"}), 400
    if not upi_id:
        return jsonify({"error": "upi_id is required"}), 400

    conn = _db()
    quote_row = conn.execute("SELECT payload_json FROM quotes WHERE quote_id = ?", (quote_id,)).fetchone()
    if not quote_row:
        conn.close()
        return jsonify({"error": "quote not found"}), 404
    quote = json.loads(quote_row["payload_json"])
    selected_plan = next((p for p in quote.get("plans", []) if p["name"].lower() == plan_name.lower()), None)
    if not selected_plan:
        conn.close()
        return jsonify({"error": "selected plan not found in quote"}), 400

    exists = conn.execute(
        "SELECT policy_id FROM policies WHERE user_id = ? AND week_start = ? AND status = 'active'",
        (user["id"], quote["week_start"]),
    ).fetchone()
    if exists:
        conn.close()
        return jsonify({"error": "policy already purchased for this cycle"}), 409

    payout_date = (datetime.strptime(quote["week_start"], "%Y-%m-%d").date() + timedelta(days=7)).isoformat()
    policy_id = str(uuid4())
    conn.execute(
        """
        INSERT INTO policies(policy_id, user_id, quote_id, week_start, plan_name, premium, coverage, payout_date, payment_method, upi_id, status, created_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            policy_id,
            user["id"],
            quote_id,
            quote["week_start"],
            selected_plan["name"],
            float(selected_plan["premium"]),
            float(selected_plan["coverage"]),
            payout_date,
            payment_method,
            upi_id,
            "active",
            datetime.utcnow().isoformat() + "Z",
        ),
    )
    conn.commit()
    conn.close()
    return jsonify({"policy_id": policy_id, "plan": selected_plan["name"], "premium": selected_plan["premium"], "coverage": selected_plan["coverage"], "payout_date": payout_date, "status": "active"}), 201


@app.get("/policies/me")
def policies_me():
    user = _auth_user()
    if not user:
        return jsonify({"error": "unauthorized"}), 401
    conn = _db()
    rows = conn.execute(
        "SELECT policy_id, quote_id, week_start, plan_name, premium, coverage, payout_date, payment_method, status, created_at FROM policies WHERE user_id = ? ORDER BY created_at DESC",
        (user["id"],),
    ).fetchall()
    conn.close()
    return jsonify({"policies": [dict(r) for r in rows]}), 200


@app.get("/claims/me")
def claims_me():
    user = _auth_user()
    if not user:
        return jsonify({"error": "unauthorized"}), 401
    conn = _db()
    rows = conn.execute(
        """
        SELECT c.claim_id, c.policy_id, c.week_start, c.trigger_date, c.trigger_reason, c.amount, c.status, c.payout_id, c.created_at, c.updated_at
        FROM claims c
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
        """,
        (user["id"],),
    ).fetchall()
    conn.close()
    return jsonify({"claims": [dict(r) for r in rows]}), 200


@app.get("/payouts/me")
def payouts_me():
    user = _auth_user()
    if not user:
        return jsonify({"error": "unauthorized"}), 401
    conn = _db()
    rows = conn.execute(
        """
        SELECT payout_id, claim_id, policy_id, amount, status, paid_at, created_at
        FROM payouts
        WHERE user_id = ?
        ORDER BY created_at DESC
        """,
        (user["id"],),
    ).fetchall()
    conn.close()
    return jsonify({"payouts": [dict(r) for r in rows]}), 200


@app.post("/claims/run-daily")
def claims_run_daily():
    user = _auth_user()
    cron_authorized = _is_cron_authorized()
    if not user and not cron_authorized:
        return jsonify({"error": "unauthorized"}), 401
    data = request.get_json(silent=True) or {}
    run_date = data.get("date")
    if run_date:
        try:
            parsed = datetime.strptime(str(run_date), "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "date must be in YYYY-MM-DD format"}), 400
    else:
        parsed = date_cls.today()
    summary = _run_daily_claim_monitor(parsed)
    summary["triggered_by"] = "cron_token" if cron_authorized and not user else "user_session"
    return jsonify(summary), 200


@app.post("/onboarding/save")
def onboarding_save():
    user = _auth_user()
    if not user:
        return jsonify({"error": "unauthorized"}), 401
    data = request.get_json(silent=True) or {}
    conn = _db()
    conn.execute(
        """
        INSERT INTO onboarding(user_id, data_json, updated_at) VALUES(?,?,?)
        ON CONFLICT(user_id) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
        """,
        (user["id"], json.dumps(data), datetime.utcnow().isoformat() + "Z"),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "saved"}), 200


@app.get("/onboarding/me")
def onboarding_me():
    user = _auth_user()
    if not user:
        return jsonify({"error": "unauthorized"}), 401
    conn = _db()
    row = conn.execute("SELECT data_json FROM onboarding WHERE user_id = ?", (user["id"],)).fetchone()
    conn.close()
    return jsonify({"data": json.loads(row["data_json"]) if row else None}), 200


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=8000, debug=True)
