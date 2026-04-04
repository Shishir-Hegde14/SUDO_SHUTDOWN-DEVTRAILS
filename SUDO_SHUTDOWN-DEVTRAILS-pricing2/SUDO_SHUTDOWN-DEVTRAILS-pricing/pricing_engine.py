# standard margins for the business model
LOADINGS = {
    "risk": 0.10,
    "ops": 0.05,
    "fraud": 0.05,
    "base_fee": 10.0
}

def calculate_premium(base_earnings, prob, severity, is_fest, env_risk_mod):
    # bump up earnings exposure if it's a festival week (higher order volume = more to lose)
    exp_earnings = base_earnings * 1.2 if is_fest else base_earnings

    # calc total probability of something going wrong (cap at 100%)
    total_prob = min(prob + env_risk_mod, 1.0)

    # Expected loss formula: E(L) = exposure * probability * severity
    expected_loss = exp_earnings * total_prob * severity

    # add our margins to get the final price
    premium = (
        expected_loss
        + (LOADINGS["risk"] * expected_loss)
        + (LOADINGS["ops"] * expected_loss)
        + (LOADINGS["fraud"] * expected_loss)
        + LOADINGS["base_fee"]
    )

    return round(premium, 2)


def generate_plans(base_premium, earnings, fuel_price=102.0, baseline_fuel_price=102.0):
    fuel_delta = max(fuel_price - baseline_fuel_price, 0.0)
    fuel_liability_cover = round(min(fuel_delta * 35.0, earnings * 0.20), 2)

    return [
        {
            "name": "Basic",
            "premium": round(base_premium * 0.80, 2),
            "coverage": round(earnings * 0.38, 2),
            "benefits": [
                "Core weekly disruption protection",
            ],
        },
        {
            "name": "Super",
            "premium": round(base_premium * 1.22, 2),
            "coverage": round(earnings * 0.78 + fuel_liability_cover, 2),
            "fuel_liability_cover": fuel_liability_cover,
            "benefits": [
                "Fuel surge liability cushion",
                "Higher weekly payout ceiling",
            ],
        },
    ]
