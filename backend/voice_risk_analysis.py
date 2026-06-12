from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
import os
import json
from backend.llm.gemini_client import generate_agent_response

router = APIRouter(prefix="/api/voice", tags=["Voice Risk Analysis"])

class VoiceRiskRequest(BaseModel):
    transcript: str
    user_id: Optional[int] = None
    journey_id: Optional[int] = None
    mode: Optional[str] = None
    language: Optional[str] = "English"

class VoiceRiskResponse(BaseModel):
    fear_score: int
    anxiety_score: int
    stress_score: int
    calm_score: int
    voice_risk_score: int
    risk_level: str
    should_trigger_safe_check: bool
    should_prepare_sos: bool
    recommended_action: str

VOICE_SYSTEM_PROMPT = """
You are an AI speech and emotion analyst for CausalGuard.
Analyze the user's spoken transcript. Assess the emotional state and danger level.
Determine:
1. fear_score (0-100)
2. anxiety_score (0-100)
3. stress_score (0-100)
4. calm_score (0-100)
5. voice_risk_score (0-100)
6. risk_level ('Low', 'Medium', 'High')
7. should_trigger_safe_check (boolean)
8. should_prepare_sos (boolean)
9. recommended_action (string)

Return EXACTLY a JSON object matching this schema:
{
  "fear_score": 0,
  "anxiety_score": 0,
  "stress_score": 0,
  "calm_score": 100,
  "voice_risk_score": 0,
  "risk_level": "Low",
  "should_trigger_safe_check": false,
  "should_prepare_sos": false,
  "recommended_action": "No action needed."
}
"""

@router.post("/risk-analysis", response_model=VoiceRiskResponse)
def analyze_voice_risk(req: VoiceRiskRequest):
    text = req.transcript.lower()
    
    # Try Gemini analysis first
    gemini_key = os.getenv("GEMINI_API_KEY")
    use_gemini = os.getenv("USE_GEMINI", "true").lower() == "true"
    
    if gemini_key and use_gemini:
        try:
            res = generate_agent_response(
                system_prompt=VOICE_SYSTEM_PROMPT,
                user_prompt=f"Analyze this transcript: '{req.transcript}' in language {req.language}.",
                json_mode=True
            )
            return VoiceRiskResponse(
                fear_score=res.get("fear_score", 0),
                anxiety_score=res.get("anxiety_score", 0),
                stress_score=res.get("stress_score", 0),
                calm_score=res.get("calm_score", 100),
                voice_risk_score=res.get("voice_risk_score", 0),
                risk_level=res.get("risk_level", "Low"),
                should_trigger_safe_check=res.get("should_trigger_safe_check", False),
                should_prepare_sos=res.get("should_prepare_sos", False),
                recommended_action=res.get("recommended_action", "No action needed.")
            )
        except Exception:
            pass
            
    # Rule-based / Keyword fallback
    fear_score = 0
    anxiety_score = 0
    stress_score = 0
    calm_score = 100
    
    fear_keywords = ["following me", "unsafe", "scared", "help", "danger", "don't feel safe", "stalk", "picha kar raha"]
    panic_keywords = ["run", "chasing", "outside", "breaking in", "bhago", "bachao", "stop"]
    calm_keywords = ["fine", "safe", "okay", "home", "thik", "normal", "reached"]

    if any(w in text for w in panic_keywords):
        fear_score = 90
        anxiety_score = 85
        stress_score = 95
        calm_score = 5
    elif any(w in text for w in fear_keywords):
        fear_score = 65
        anxiety_score = 70
        stress_score = 60
        calm_score = 20
    elif any(w in text for w in calm_keywords):
        calm_score = 90
        fear_score = 5
        
    voice_risk_score = int((fear_score * 0.5) + (anxiety_score * 0.2) + (stress_score * 0.3))
    
    if voice_risk_score <= 35:
        risk_level = "Low"
    elif voice_risk_score <= 70:
        risk_level = "Medium"
    else:
        risk_level = "High"
        
    should_trigger_safe_check = voice_risk_score > 60
    should_prepare_sos = voice_risk_score > 80
    
    rec_action = "No action needed."
    if should_prepare_sos:
        rec_action = "Prepare SOS trigger immediately. Alert emergency contacts."
    elif should_trigger_safe_check:
        rec_action = "Prompt security verification check."

    return VoiceRiskResponse(
        fear_score=fear_score,
        anxiety_score=anxiety_score,
        stress_score=stress_score,
        calm_score=calm_score,
        voice_risk_score=voice_risk_score,
        risk_level=risk_level,
        should_trigger_safe_check=should_trigger_safe_check,
        should_prepare_sos=should_prepare_sos,
        recommended_action=rec_action
    )
