from __future__ import annotations

from typing import Any


def classify_fraud_risk(score: float) -> str:
    if score < 0.25:
        return "low"
    if score < 0.55:
        return "medium"
    return "high"


def score_quote_fraud(
    *,
    weekly_earnings: float,
    working_days_per_week: int,
    shift_hours: float | None,
    area_context: dict[str, Any],
    input_city: str | None,
    resolved_city: str | None,
) -> dict[str, Any]:
    score = 0.0
    reasons: list[str] = []

    local_darkstores = int(area_context.get("local_darkstores_5km", 0))
    city_darkstores = int(area_context.get("city_darkstore_count", 0))
    city_population = int(area_context.get("city_population", 0))

    # High claimed earnings with very weak nearby darkstore footprint can be suspicious.
    if weekly_earnings > 10000 and local_darkstores <= 1:
        score += 0.30
        reasons.append("high_earnings_low_local_darkstore_density")
    elif weekly_earnings > 8000 and local_darkstores <= 2:
        score += 0.18
        reasons.append("earnings_vs_local_density_mismatch")

    # High earnings in city profiles with very low known darkstore network.
    if weekly_earnings > 9000 and city_darkstores <= 2 and city_population > 0:
        score += 0.15
        reasons.append("high_earnings_low_city_darkstore_presence")

    if working_days_per_week >= 7:
        score += 0.08
        reasons.append("high_working_days_frequency")

    if shift_hours is not None and shift_hours >= 13:
        score += 0.15
        reasons.append("long_shift_duration")

    if input_city and resolved_city and input_city.strip().lower() != resolved_city.strip().lower():
        score += 0.10
        reasons.append("input_city_mismatch_with_resolved_city")

    score = round(min(score, 1.0), 4)
    return {
        "fraud_score": score,
        "fraud_risk_level": classify_fraud_risk(score),
        "fraud_flags": reasons,
    }

