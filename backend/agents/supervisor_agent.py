from backend.agents.state import AgentState
from backend.llm.gemini_client import generate_agent_response

SUPERVISOR_SYSTEM_PROMPT = """
You are the Supervisor Agent for CausalGuard, a women-first AI safety and well-being companion.
Your job is to analyze the user request and:
1. Determine the intent of the user. Intents can be:
   - 'sos' (user is in danger, feels unsafe, needs police or emergency help)
   - 'safe_route' (user wants to plan a commute, find the safest route, check route risk)
   - 'cab_safety' (monitoring auto/cab, checking deviations, entering ride details)
   - 'health_mode' (wellness support, pregnancy, period discomfort, nearby pharmacies)
   - 'digital_harassment' (messages with threats, cyber stalking, scans)
   - 'unknown' (general questions, chat)
2. Determine which sub-agents to invoke. Select from:
   - 'Safety Agent' (for route risk, lighting, isolating, police stations)
   - 'Emergency Agent' (for active alarms, fake calls, safe checks)
   - 'Digital Safety Agent' (harassment detection, threat message scanning)
   - 'Health Safety Agent' (clinics, hospitals, medicine reminder, flat routes)
   - 'News Intelligence Agent' (temporary caution markers, crime alerts)
   - 'RAG Knowledge Agent' (retrieving legal guidelines, safety protocols, self-defense tip)
3. Return a clean JSON response.

Return EXACTLY a JSON object matching this schema:
{
  "intent": "intent_string",
  "agents_to_call": ["Agent Name 1", "Agent Name 2"],
  "response_message": "A supportive opening response acknowledging the request.",
  "recommended_action": "High-level safety action recommendation.",
  "actions": ["ui_action_code_1", "ui_action_code_2"]
}

Action codes can be:
- 'show_safe_route'
- 'enable_guardian_tracking'
- 'show_112_button'
- 'cab_safety_mode'
- 'health_safety_mode'
- 'trigger_sos'
- 'save_evidence'
"""

def run_supervisor(state: AgentState) -> AgentState:
    # Ensure agent_outputs dict exists (other keys are guaranteed by the graph)
    if not state.get("agent_outputs"):
        state["agent_outputs"] = {}

    user_msg = state["message"]
    
    import concurrent.futures
    import json
    from backend.llm.gemini_client import get_rule_fallback
    
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                generate_agent_response,
                system_prompt=SUPERVISOR_SYSTEM_PROMPT,
                user_prompt=user_msg,
                json_mode=True
            )
            res = future.result(timeout=5.0)
    except Exception as e:
        # Fall back to rule-based intent detection immediately
        fallback_json = get_rule_fallback(SUPERVISOR_SYSTEM_PROMPT, user_msg)
        res = json.loads(fallback_json)
    
    state["intent"] = res.get("intent", "unknown")
    state["final_response"] = res.get("response_message", "I am processing your safety request.")
    state["recommended_action"] = res.get("recommended_action", "Be aware of your surroundings.")
    state["action"] = res.get("actions", [])
    
    # Track which agents are scheduled
    state["agent_outputs"]["scheduled_agents"] = res.get("agents_to_call", [])
    return state
