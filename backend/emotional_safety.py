from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db, User
from backend.auth import get_current_verified_woman
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/emotional", tags=["Emotional Well-Being"])

class MoodLog(BaseModel):
    mood_rating: int
    stress_level: int
    feelings: Optional[str] = ""

@router.post("/mood-checkin")
def log_mood(
    log: MoodLog,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    advice = "Try taking deep breaths for 4 seconds, holding for 4, and exhaling for 4."
    if log.stress_level >= 4:
        advice = "Your stress score indicates high tension. We recommend contacting your trusted guardian or using the 'Fake Call' feature if you need a comfortable distraction. You can also trigger the 'Safe Route Home' shortcut."
    
    return {
        "status": "success",
        "timestamp": datetime.now(timezone.utc),
        "disclaimer": "This is a well-being support and stress indicator tool, not a medical or psychological diagnosis.",
        "stress_indicator": f"{log.stress_level}/5",
        "guidance": advice,
        "mood_rating": log.mood_rating
    }

@router.post("/stress-voice-check")
def voice_stress_check(
    voice_text: dict,
    current_user: User = Depends(get_current_verified_woman)
):
    transcript = voice_text.get("text", "").lower()
    
    stress_words = ["scared", "panicking", "worry", "afraid", "nervous", "alone", "dark", "unsafe"]
    hits = sum(1 for w in stress_words if w in transcript)
    
    stress_detected = hits > 0
    level = "Normal" if not stress_detected else "Elevated Stress"
    
    advice = "Your speech indices show low tension. Continue your commute safely."
    if stress_detected:
        advice = "Elevated stress detected in vocal transcript. Recommended action: Start live guardian tracking or invoke 'Fake Call' to maintain active phone presence."

    return {
        "status": "success",
        "voice_transcript": transcript,
        "stress_level_indicator": level,
        "recommended_action": advice,
        "disclaimer": "This analysis is for well-being support and stress indication, not a medical diagnosis."
    }
