from backend.agents.state import AgentState
from backend.llm.gemini_client import generate_agent_response

SAFETY_SYSTEM_PROMPT = """
You are the Safety Agent for CausalGuard.
Your job is to analyze route risks and plan commutes using environmental factors: lighting, isolation, crowd presence, distance to police stations, news cautions, and feedback.
You must compare two routes:
- Route A (Shortest Route): high risk, unlit, isolated alleys, news caution signals, distant police stations.
- Route B (Safest Route): low risk, well-lit commercial streets, high public visibility, close police presence.

Return EXACTLY a JSON object matching this schema:
{
  "route_id": "safest",
  "risk_score": 32,
  "risk_level": "Low",
  "factors": ["Proximity to Deccan Police Station (0.15km)", "Active Streetlights (90% coverage)"],
  "safest_alternative": "Route B",
  "causal_explanation": "Route B is recommended because main streets with commercial activity increase bystander presence and deter potential threats, whereas Route A has poor lighting and recent incident signals.",
  "what_if_analysis": {
     "if_lighting_improved": "Risk of Route A drops by 15%",
     "if_police_patrol_active": "Risk drops to Low"
  }
}
"""

def run_safety_agent(state: AgentState) -> AgentState:
    scheduled = state.get("agent_outputs", {}).get("scheduled_agents", [])
    intent = state.get("intent", "unknown")
    if "Safety Agent" not in scheduled and "safe_route" not in intent:
        return state

    user_msg = state["message"]
    
    # Process route risk using Gemini / Fallback
    res = generate_agent_response(
        system_prompt=SAFETY_SYSTEM_PROMPT,
        user_prompt=user_msg,
        json_mode=True
    )
    
    state["risk_score"] = res.get("risk_score", 32)
    state["risk_level"] = res.get("risk_level", "Low")
    state["agent_outputs"]["safety_agent"] = res
    return state
