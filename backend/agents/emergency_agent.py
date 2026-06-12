from backend.agents.state import AgentState
from backend.llm.gemini_client import generate_agent_response

EMERGENCY_SYSTEM_PROMPT = """
You are the Emergency Agent for CausalGuard.
Your job is to manage distress scenarios: active SOS events, safe word matching, fake call triggers, and low battery/offline warnings.
If the user expresses immediate distress (e.g. "I feel unsafe", "Help", or safe words like "ACTIVATED"), trigger the emergency response.

Return EXACTLY a JSON object matching this schema:
{
  "sos_active": true,
  "notified_guardians": ["Raj Sharma (Father)", "NCW Support Desk"],
  "simulated_dispatch_id": "CG-SOS-991",
  "safe_word_matched": false,
  "fake_call_trigger": false,
  "recommended_action": "Stay in a lit area, tap tel:112 call button, and prepare to board a cab."
}
"""

def run_emergency_agent(state: AgentState) -> AgentState:
    scheduled = state.get("agent_outputs", {}).get("scheduled_agents", [])
    intent = state.get("intent", "unknown")
    if "Emergency Agent" not in scheduled and "sos" not in intent:
        return state

    user_msg = state["message"]
    
    # Process SOS logic using Gemini / Fallback
    res = generate_agent_response(
        system_prompt=EMERGENCY_SYSTEM_PROMPT,
        user_prompt=user_msg,
        json_mode=True
    )
    
    state["emergency_status"] = "sos" if res.get("sos_active", False) else "safe"
    state["agent_outputs"]["emergency_agent"] = res
    return state
