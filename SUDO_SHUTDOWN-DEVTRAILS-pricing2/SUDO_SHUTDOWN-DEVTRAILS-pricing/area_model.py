from __future__ import annotations

import csv
import math
from functools import lru_cache
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = PROJECT_ROOT / "data" / "datasets"

CITY_POPULATION_FILE = DATASET_ROOT / "List of cities with population above 1,000,000.csv"
CENSUS_FILE = DATASET_ROOT / "census2011.csv"

DARKSTORE_FILES = {
    "blinkit": DATASET_ROOT / "blinkit-darkstores.csv",
    "zepto": DATASET_ROOT / "zepto-darkstores.csv",
    "swiggy": DATASET_ROOT / "swiggy-darkstores.csv",
}

CITY_ALIASES = {
    "bangalore": "bengaluru",
    "ahmadabad": "ahmedabad",
    "bombay": "mumbai",
    "new delhi": "delhi",
}


def _normalize(value: Any) -> str:
    text = str(value or "").strip().lower()
    for old, new in CITY_ALIASES.items():
        if text == old:
            text = new
    filtered = "".join(ch for ch in text if ch.isalnum() or ch.isspace())
    return " ".join(filtered.split())


def _to_int(value: Any) -> int | None:
    if value is None:
        return None
    text = str(value).replace(",", "").strip()
    if not text:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    text = str(value).replace(",", "").replace("%", "").strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return earth_radius_km * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


@lru_cache(maxsize=1)
def _load_city_population() -> dict[str, dict[str, Any]]:
    city_map: dict[str, dict[str, Any]] = {}
    if not CITY_POPULATION_FILE.exists():
        return city_map

    with CITY_POPULATION_FILE.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            city_name = row.get("City") or ""
            state_name = row.get("State or union territory") or ""
            population = _to_int(row.get("Population(2011)[3]"))
            if not city_name or not population:
                continue

            key = _normalize(city_name)
            city_map[key] = {
                "city": city_name.strip(),
                "state": state_name.strip(),
                "population": population,
            }
    return city_map


@lru_cache(maxsize=1)
def _load_census() -> dict[str, Any]:
    district_map: dict[str, dict[str, Any]] = {}
    state_population: dict[str, int] = {}
    if not CENSUS_FILE.exists():
        return {"district_map": district_map, "state_population": state_population}

    with CENSUS_FILE.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            district = row.get("District") or ""
            state = row.get("State") or ""
            population = _to_int(row.get("Population")) or 0
            growth = _to_float(row.get("Growth"))
            literacy = _to_float(row.get("Literacy"))

            if district:
                district_map[_normalize(district)] = {
                    "district": district.strip(),
                    "state": state.strip(),
                    "population": population,
                    "growth_pct": growth if growth is not None else 0.0,
                    "literacy_pct": literacy if literacy is not None else 0.0,
                }

            state_key = _normalize(state)
            if state_key:
                state_population[state_key] = state_population.get(state_key, 0) + population

    return {"district_map": district_map, "state_population": state_population}


@lru_cache(maxsize=1)
def _load_darkstores() -> dict[str, Any]:
    stores: list[dict[str, Any]] = []
    city_counts: dict[str, int] = {}
    state_counts: dict[str, int] = {}
    platform_counts: dict[str, int] = {}

    for platform, path in DARKSTORE_FILES.items():
        if not path.exists():
            continue
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                lat = _to_float(row.get("lat"))
                lon = _to_float(row.get("lng") or row.get("lon"))
                if lat is None or lon is None:
                    continue

                city = (row.get("city") or "").strip()
                state = (row.get("state") or "").strip()

                stores.append(
                    {
                        "platform": platform,
                        "lat": lat,
                        "lon": lon,
                        "city": city,
                        "state": state,
                    }
                )

                platform_counts[platform] = platform_counts.get(platform, 0) + 1

                if city:
                    city_key = _normalize(city)
                    city_counts[city_key] = city_counts.get(city_key, 0) + 1

                if state:
                    state_key = _normalize(state)
                    state_counts[state_key] = state_counts.get(state_key, 0) + 1

    return {
        "stores": stores,
        "city_counts": city_counts,
        "state_counts": state_counts,
        "platform_counts": platform_counts,
    }


def _infer_city_from_input(city: str | None, zone_name: str | None) -> str | None:
    city_population = _load_city_population()
    if city:
        city_key = _normalize(city)
        if city_key in city_population:
            return city_key

    if zone_name:
        zone_key = _normalize(zone_name)
        for city_key in city_population.keys():
            if city_key and city_key in zone_key:
                return city_key
    return None


def get_area_context(
    *,
    city: str | None = None,
    state: str | None = None,
    zone_name: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
) -> dict[str, Any]:
    city_population = _load_city_population()
    census = _load_census()
    darkstores = _load_darkstores()

    inferred_city_key = _infer_city_from_input(city, zone_name)
    city_info = city_population.get(inferred_city_key, {}) if inferred_city_key else {}

    resolved_city = city_info.get("city") or (city or "").strip() or None
    resolved_state = city_info.get("state") or (state or "").strip() or None

    city_pop = city_info.get("population")
    district_info = census["district_map"].get(_normalize(resolved_city)) if resolved_city else None
    if city_pop is None and district_info:
        city_pop = district_info.get("population")
    city_pop = city_pop or 0

    state_key = _normalize(resolved_state)
    state_pop = census["state_population"].get(state_key, 0) if state_key else 0
    city_growth = district_info.get("growth_pct", 0.0) if district_info else 0.0
    city_literacy = district_info.get("literacy_pct", 0.0) if district_info else 0.0

    city_darkstore_count = darkstores["city_counts"].get(_normalize(resolved_city), 0) if resolved_city else 0
    state_darkstore_count = darkstores["state_counts"].get(state_key, 0) if state_key else 0

    local_darkstores_3km = 0
    local_darkstores_5km = 0
    local_darkstores_10km = 0

    if lat is not None and lon is not None:
        for store in darkstores["stores"]:
            dist = _haversine_km(lat, lon, store["lat"], store["lon"])
            if dist <= 10:
                local_darkstores_10km += 1
            if dist <= 5:
                local_darkstores_5km += 1
            if dist <= 3:
                local_darkstores_3km += 1

    max_city_pop = max((item["population"] for item in city_population.values()), default=1)
    max_state_pop = max(census["state_population"].values(), default=1)

    pop_score = math.log1p(city_pop) / math.log1p(max_city_pop) if city_pop else 0.35
    state_score = math.log1p(state_pop) / math.log1p(max_state_pop) if state_pop else 0.35
    growth_score = min(max(city_growth / 40.0, 0.0), 1.0)
    literacy_score = min(max(city_literacy / 100.0, 0.0), 1.0)

    known_darkstore_score = min(city_darkstore_count / 60.0, 1.0)
    local_darkstore_score = min(local_darkstores_5km / 15.0, 1.0)
    darkstore_score = max(known_darkstore_score, local_darkstore_score)

    consumption_index = (
        (0.30 * pop_score)
        + (0.15 * state_score)
        + (0.20 * darkstore_score)
        + (0.15 * growth_score)
        + (0.10 * literacy_score)
        + (0.10 * min(local_darkstores_10km / 25.0, 1.0))
    )
    consumption_index = round(min(max(consumption_index, 0.10), 1.25), 4)

    # Converts index to a multiplier on expected earnings (0.85x to 1.60x range).
    consumption_multiplier = round(0.85 + (consumption_index * 0.60), 3)

    return {
        "city": resolved_city,
        "state": resolved_state,
        "city_population": city_pop,
        "state_population": state_pop,
        "city_growth_pct": round(city_growth, 2),
        "city_literacy_pct": round(city_literacy, 2),
        "city_darkstore_count": city_darkstore_count,
        "state_darkstore_count": state_darkstore_count,
        "local_darkstores_3km": local_darkstores_3km,
        "local_darkstores_5km": local_darkstores_5km,
        "local_darkstores_10km": local_darkstores_10km,
        "consumption_index": consumption_index,
        "consumption_multiplier": consumption_multiplier,
    }
