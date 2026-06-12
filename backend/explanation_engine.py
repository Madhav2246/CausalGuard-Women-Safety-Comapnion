def generate_causal_explanation(
    route_name: str,
    risk_score: int,
    risk_level: str,
    factors: list,
    destination: str = "your destination"
) -> str:
    if risk_level == "Low":
        explanation = (
            f"Route '{route_name}' to {destination} is classified as Low Risk ({risk_score}/100). "
            f"The route has high visibility, adequate street lighting, active pedestrian movement, and "
            f"remains close to rescue points like police stations or hospitals."
        )
    elif risk_level == "Medium":
        reasons = ", ".join([f.split(" (+")[0] for f in factors if "+" in f])
        if not reasons:
            reasons = "minor localized safety caution markers"
        explanation = (
            f"Route '{route_name}' is classified as Medium Risk ({risk_score}/100) primarily due to: {reasons}. "
            f"While passable, we suggest notifying your guardian and ensuring your phone's battery is above 20%. "
            f"Choosing a slightly longer route on main roads could reduce risk."
        )
    else:
        reasons = ", and ".join([f.split(" (+")[0] for f in factors if "+" in f])
        if not reasons:
            reasons = "unfavorable lighting conditions and low pedestrian crowd density"
        explanation = (
            f"Route '{route_name}' is classified as High Risk ({risk_score}/100) because: {reasons}. "
            f"It is highly recommended that you take an alternative route or start guardian tracking. "
            f"Avoiding isolated lanes and low-light paths reduces potential exposure to hazards."
        )
    return explanation

def generate_what_if_scenarios(
    current_score: int,
    is_night: bool,
    has_poor_lighting: bool,
    has_low_crowd: bool,
    guardian_enabled: bool,
    health_mode: bool = False
) -> list:
    scenarios = []

    if is_night:
        reduced_score = max(15, current_score - 25)
        scenarios.append({
            "condition": "If leaving earlier (Daylight hours)",
            "impact": f"Risk reduces by ~25 pts (New Score: {reduced_score} - Low Risk)",
            "reason": "Increases public crowd visibility and natural daylight illumination."
        })

    if has_poor_lighting or has_low_crowd:
        reduced_score = max(20, current_score - (15 if has_poor_lighting else 0) - (10 if has_low_crowd else 0))
        scenarios.append({
            "condition": "If shifting route to Main Highway",
            "impact": f"Risk reduces by ~15-25 pts (New Score: {reduced_score})",
            "reason": "Provides bright streetlighting and active neighborhood watch footprint."
        })

    if not guardian_enabled:
        scenarios.append({
            "condition": "If Guardian Live Tracking is enabled",
            "impact": "Response support improves significantly",
            "reason": "Reduces incident escalation delays from hours to seconds as coordinates sync automatically."
        })

    if health_mode:
        scenarios.append({
            "condition": "If Health safety routing is active",
            "impact": "Preferential proximity weighting",
            "reason": "Routes automatically re-balance to pass directly by operating clinics and 24x7 pharmacies."
        })

    if not scenarios:
        scenarios.append({
            "condition": "If safety markers remain optimal",
            "impact": f"Risk remains Low (Current Score: {current_score})",
            "reason": "Active monitoring indicates normal patrol presence and standard crowd metrics."
        })

    return scenarios
