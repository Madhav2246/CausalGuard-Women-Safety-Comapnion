import logging
from backend.agents.state import AgentState
from backend.agents.supervisor_agent import run_supervisor
from backend.agents.safety_agent import run_safety_agent
from backend.agents.emergency_agent import run_emergency_agent
from backend.agents.digital_safety_agent import run_digital_safety_agent
from backend.agents.health_agent import run_health_agent
from backend.agents.news_agent import run_news_agent
from backend.agents.rag_agent import run_rag_agent

logger = logging.getLogger("causalguard.graph")

class FallbackGraph:
    """
    Action-first, router-based execution flow that routes based on intent,
    bypassing the slow linear chain and running only the required agents.
    """
    def invoke(self, inputs: dict) -> dict:
        state: AgentState = {
            "user_id": inputs.get("user_id", 0),
            "role": inputs.get("role", "Woman"),
            "message": inputs.get("message", ""),
            "intent": "unknown",
            "location": inputs.get("location"),
            "destination": inputs.get("destination"),
            "journey_id": inputs.get("journey_id"),
            "active_mode": inputs.get("active_mode"),
            "health_mode": inputs.get("health_mode", False),
            "guardian_permissions": inputs.get("guardian_permissions"),
            "route_options": [],
            "risk_score": 0,
            "risk_level": "Low",
            "emergency_status": "safe",
            "news_alerts": [],
            "rag_context": "",
            "agent_outputs": {},
            "final_response": "",
            "action": [],
            "missing_data_notes": []
        }
        
        # 1. Run Supervisor first to parse intent
        state = run_supervisor(state)
        intent = state.get("intent", "unknown")
        
        # 2. Router-based conditional execution paths
        if intent == "sos":
            # Emergency Agent is executed immediately and does NOT wait for others
            state = run_emergency_agent(state)
            if state.get("journey_id"):
                state = run_safety_agent(state)
            # RAG used for quick emergency contact guidelines only
            state = run_rag_agent(state)
            
        elif intent in ("safe_route", "safe_journey"):
            state = run_safety_agent(state)
            state = db_news_agent_helper(state)
            if state.get("health_mode"):
                state = run_health_agent(state)
                
        elif intent in ("digital", "digital_harassment", "digital_safety"):
            state = run_digital_safety_agent(state)
            # Pull RAG context if they ask for regulations or safety guidelines
            if any(w in state["message"].lower() for w in ["law", "section", "ipc", "report", "police", "legal"]):
                state = run_rag_agent(state)
                
        elif intent == "health":
            state = run_health_agent(state)
            
        elif intent == "news":
            state = db_news_agent_helper(state)
            
        else:
            # Fallback for unknown intent: supervisor schedules Safety and News
            state = run_safety_agent(state)
            state = db_news_agent_helper(state)
            
        return state

def db_news_agent_helper(state: AgentState) -> AgentState:
    """Helper to query local news alerts from the DB in the state graph."""
    try:
        from backend.database import SessionLocal, NewsAlert
        db = SessionLocal()
        alerts = db.query(NewsAlert).all()
        state["news_alerts"] = [
            {"title": a.title, "location": a.location, "severity": a.severity, "lat": a.lat, "lng": a.lng}
            for a in alerts
        ]
        db.close()
    except Exception as e:
        logger.error(f"News DB query failed: {e}")
        state = run_news_agent(state)
    return state

# Use the action-first router graph directly for 100% uptime and speed
compiled_graph = FallbackGraph()
