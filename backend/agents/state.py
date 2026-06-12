from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    user_id: int
    role: str
    message: str
    intent: str
    location: Optional[Dict[str, float]]
    destination: Optional[Dict[str, float]]
    journey_id: Optional[int]
    active_mode: Optional[str]
    health_mode: bool
    guardian_permissions: Optional[str]
    route_options: List[Dict[str, Any]]
    risk_score: int
    risk_level: str
    emergency_status: str # "safe", "alerted", "sos"
    news_alerts: List[Dict[str, Any]]
    rag_context: str
    agent_outputs: Dict[str, Any]
    final_response: str
    action: List[str]
    missing_data_notes: List[str]
    voice_risk_score: Optional[int]
    voice_risk_level: Optional[str]
