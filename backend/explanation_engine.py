def generate_causal_explanation(
    route_name: str,
    risk_score: int,
    risk_level: str,
    factors: list,
    destination: str = "your destination"
) -> str:
    # Separate positive and negative factors
    negatives = [f.split(" (")[0] for f in factors if "+" in f]
    positives = [f.split(" (")[0] for f in factors if "-" in f]

    neg_str = ", and ".join(negatives) if negatives else ""
    pos_str = ", and ".join(positives) if positives else ""

    if risk_level == "Low":
        explanation = f"Route '{route_name}' to {destination} is classified as Low Risk ({risk_score}/100). "
        if pos_str:
            explanation += f"Safety indicators are strong: it features {pos_str.lower()}. "
        else:
            explanation += "The route has good public visibility, adequate lighting, and active pedestrian presence. "
        
        if neg_str:
            explanation += f"Keep in mind there is minor exposure to: {neg_str.lower()}."
        else:
            explanation += "No significant risk factors were detected."
            
    elif risk_level == "Medium":
        explanation = f"Route '{route_name}' to {destination} is classified as Medium Risk ({risk_score}/100). "
        if neg_str:
            explanation += f"This is primarily due to safety cautions: {neg_str}. "
        else:
            explanation += "This is due to localized safety markers. "
            
        if pos_str:
            explanation += f"On the positive side, it offers: {pos_str.lower()}. "
            
        explanation += "We suggest notifying your guardian and ensuring your phone remains charged."
        
    else: # High
        explanation = f"Route '{route_name}' to {destination} is classified as High Risk ({risk_score}/100). "
        if neg_str:
            explanation += f"This is due to critical factors: {neg_str}. "
        else:
            explanation += "The route is highly isolated or lacks essential lighting. "
            
        if pos_str:
            explanation += f"Despite some support from: {pos_str.lower()}, "
            
        explanation += "it is highly recommended to take an alternative route or activate Guardian live tracking."

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
