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


def generate_plans(base_premium, earnings):
    return [
        {
            "name": "Basic",
            "premium": round(base_premium * 0.80, 2),
            "coverage": round(earnings * 0.35, 2)
        },
        {
            "name": "Standard",
            "premium": round(base_premium * 1.00, 2),
            "coverage": round(earnings * 0.60, 2)
        },
        {
            "name": "Premium",
            "premium": round(base_premium * 1.35, 2),
            "coverage": round(earnings * 0.90, 2)
        }
    ]