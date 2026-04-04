from __future__ import annotations

import os
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

import requests

import trigger_engine as triggers

PROJECT_ROOT = Path(__file__).resolve().parents[2]
API_KEY_ROOT = PROJECT_ROOT / "data" / "api_keys"
FUEL_API_KEY_FILE = API_KEY_ROOT / "fuel-api.txt"
HOLIDAY_API_KEY_FILE = API_KEY_ROOT / "holiday-api.txt"

HOLIDAY_API_URL = os.getenv("HOLIDAY_API_URL", "https://holidayapi.com/v1/holidays")
FUEL_API_URL = os.getenv("FUEL_API_URL", "")

STATE_FUEL_BASELINE = {
    "maharashtra": 106.0,
    "karnataka": 105.0,
    "delhi": 95.0,
    "tamil nadu": 103.0,
    "telangana": 108.0,
    "gujarat": 96.0,
}


def _read_key(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8").strip()


@lru_cache(maxsize=1)
def _holiday_api_key() -> str:
    return os.getenv("HOLIDAY_API_KEY", _read_key(HOLIDAY_API_KEY_FILE))


@lru_cache(maxsize=1)
def _fuel_api_key() -> str:
    return os.getenv("FUEL_API_KEY", _read_key(FUEL_API_KEY_FILE))


def _extract_first_number(payload: Any) -> float | None:
    if isinstance(payload, (int, float)):
        return float(payload)
    if isinstance(payload, str):
        cleaned = payload.replace(",", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return None
    if isinstance(payload, list):
        for item in payload:
            found = _extract_first_number(item)
            if found is not None:
                return found
        return None
    if isinstance(payload, dict):
        preferred_keys = ["price", "petrol", "diesel", "rate", "value", "amount"]
        for key in preferred_keys:
            if key in payload:
                found = _extract_first_number(payload[key])
                if found is not None:
                    return found
        for value in payload.values():
            found = _extract_first_number(value)
            if found is not None:
                return found
    return None


def get_holiday_context(date_str: str) -> dict[str, Any]:
    default_name = triggers.get_festival(date_str)
    if default_name:
        return {
            "is_holiday": True,
            "holiday_name": default_name,
            "source": "local_calendar",
            "risk_modifier": 0.02,
            "demand_modifier": 0.05,
        }

    api_key = _holiday_api_key()
    if not api_key:
        return {
            "is_holiday": False,
            "holiday_name": None,
            "source": "none",
            "risk_modifier": 0.0,
            "demand_modifier": 0.0,
        }

    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        params = {
            "key": api_key,
            "country": "IN",
            "year": dt.year,
            "month": dt.month,
            "day": dt.day,
        }
        res = requests.get(HOLIDAY_API_URL, params=params, timeout=2)
        data = res.json() if res.ok else {}
        holidays = data.get("holidays") if isinstance(data, dict) else None
        if holidays and isinstance(holidays, list):
            first = holidays[0]
            name = first.get("name") if isinstance(first, dict) else None
            if name:
                return {
                    "is_holiday": True,
                    "holiday_name": name,
                    "source": "holidayapi",
                    "risk_modifier": 0.02,
                    "demand_modifier": 0.05,
                }
    except Exception:
        pass

    return {
        "is_holiday": False,
        "holiday_name": None,
        "source": "none",
        "risk_modifier": 0.0,
        "demand_modifier": 0.0,
    }


def get_fuel_context(state: str | None, date_str: str) -> dict[str, Any]:
    state_key = (state or "").strip().lower()
    baseline = STATE_FUEL_BASELINE.get(state_key, 102.0)
    result = {
        "state": state,
        "date": date_str,
        "fuel_price": baseline,
        "source": "baseline",
        "risk_modifier": 0.0,
        "demand_modifier": 0.0,
    }

    api_key = _fuel_api_key()
    if not api_key or not FUEL_API_URL:
        return result

    headers = {
        "Authorization": f"Bearer {api_key}",
        "x-api-key": api_key,
    }
    params = {
        "state": state or "",
        "date": date_str,
    }

    try:
        res = requests.get(FUEL_API_URL, headers=headers, params=params, timeout=2)
        data = res.json() if res.ok else {}
        price = _extract_first_number(data)
        if price and 50.0 <= price <= 200.0:
            result["fuel_price"] = round(price, 2)
            result["source"] = "fuel_api"
    except Exception:
        return result

    deviation = (result["fuel_price"] - baseline) / baseline
    result["risk_modifier"] = round(min(max(deviation * 0.20, -0.02), 0.04), 4)
    # Higher fuel price can slightly reduce rider-side net availability / shift consistency.
    result["demand_modifier"] = round(min(max(-deviation * 0.08, -0.02), 0.02), 4)
    return result
