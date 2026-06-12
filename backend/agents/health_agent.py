from backend.agents.state import AgentState
from backend.llm.gemini_client import generate_agent_response

HEALTH_SYSTEM_PROMPT = """
You are the Health Safety Agent for CausalGuard.
Your job is to support health-aware commute routing when the user has enabled pregnancy mode or period discomfort mode.
Do NOT diagnose medical conditions. Provide supportive routing guidance only.
For Period Discomfort: Re-weight routes closer to pharmacies, rest points, and flat terrain.
For Pregnancy: Maximize closeness to hospitals (within 500m) and minimize walking/jarring paths.

Return EXACTLY a JSON object matching this schema:
{
  "is_active": true,
  "routing_preference": "Weighted proximity to healthcare centers",
  "hospital_markers": [
    {"name": "Sahyadri Hospital", "lat": 18.5150, "lng": 73.8335},
    {"name": "Noble Pharmacy", "lat": 18.5280, "lng": 73.8490}
  ],
  "pregnancy_safety_notes": "Avoid unpaved streets and routes with large construction sites.",
  "discomfort_safety_notes": "Selected path with resting areas and immediate cab pickup access."
}
"""

def run_health_agent(state: AgentState) -> AgentState:
    scheduled = state.get("agent_outputs", {}).get("scheduled_agents", [])
    intent = state.get("intent", "unknown")
    if "Health Safety Agent" not in scheduled and "health_mode" not in intent:
        return state

    user_msg = state["message"]
    
    # Process health safety logic using Gemini / Fallback
    res = generate_agent_response(
        system_prompt=HEALTH_SYSTEM_PROMPT,
        user_prompt=user_msg,
        json_mode=True
    )
    
    state["health_mode"] = res.get("is_active", True)
    state["agent_outputs"]["health_agent"] = res
    return state
