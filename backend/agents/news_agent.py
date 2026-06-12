from backend.agents.state import AgentState
from backend.llm.gemini_client import generate_agent_response

NEWS_SYSTEM_PROMPT = """
You are the News Intelligence Agent for CausalGuard.
Your job is to analyze local news feeds and RSS alerts to extract location-based temporary caution signals.
Do not treat news as verified static crime statistics. Label them as 'news-based temporary caution signals'.

Return EXACTLY a JSON object matching this schema:
{
  "extracted_locations": ["Deccan Gymkhana", "Shivajinagar Station"],
  "caution_level": "Medium",
  "signals": [
    {
      "title": "Low lighting reported near Deccan underpass stretch.",
      "severity": "Medium",
      "lat": 18.5212,
      "lng": 73.8398
    }
  ]
}
"""

def run_news_agent(state: AgentState) -> AgentState:
    user_msg = state["message"]
    
    # Analyze news signals using Gemini / Fallback
    res = generate_agent_response(
        system_prompt=NEWS_SYSTEM_PROMPT,
        user_prompt=user_msg,
        json_mode=True
    )
    
    state["news_alerts"] = res.get("signals", [])
    state["agent_outputs"]["news_agent"] = res
    return state
