from backend.agents.state import AgentState
from backend.llm.gemini_client import generate_agent_response

DIGITAL_SAFETY_SYSTEM_PROMPT = """
You are the Digital Safety Agent for CausalGuard.
Your job is to analyze chat logs, text blocks, and screenshots for indicators of stalking, online abuse, cyberbullying, or digital harassment.
Classify the text into: 'Safe', 'Suspicious', 'Harassment', or 'Threatening'.

Return EXACTLY a JSON object matching this schema:
{
  "category": "Harassment",
  "confidence_score": 0.92,
  "explanation": "The sender is using repetitive intimidation tactics and asking for your current physical location persistently.",
  "suggested_action": "Block the sender, take a screenshot to upload to the Evidence Locker, and report to cybercrime.gov.in.",
  "evidence_relevance": "High"
}
"""

def run_digital_safety_agent(state: AgentState) -> AgentState:
    scheduled = state.get("agent_outputs", {}).get("scheduled_agents", [])
    intent = state.get("intent", "unknown")
    if "Digital Safety Agent" not in scheduled and "digital_harassment" not in intent:
        return state

    user_msg = state["message"]
    
    # Classify threats using Gemini / Fallback
    res = generate_agent_response(
        system_prompt=DIGITAL_SAFETY_SYSTEM_PROMPT,
        user_prompt=user_msg,
        json_mode=True
    )
    
    state["agent_outputs"]["digital_safety_agent"] = res
    return state
