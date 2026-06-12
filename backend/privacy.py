from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db, User, Journey
from backend.auth import get_current_verified_woman
from backend.schemas import PrivacySettingsUpdate
import json

router = APIRouter(prefix="/api/privacy", tags=["Privacy Settings"])

@router.get("/settings")
def get_privacy_settings(
    current_user: User = Depends(get_current_verified_woman)
):
    try:
        preferences = json.loads(current_user.consent_preferences or "{}")
    except:
        preferences = {}
        
    default_settings = {
        "share_location_sos_only": preferences.get("share_location_sos_only", True),
        "enable_safe_word": preferences.get("enable_safe_word", True),
        "safe_word": preferences.get("safe_word", "ACTIVATED"),
        "enable_health_routing": preferences.get("enable_health_routing", False),
        "enable_news_caution": preferences.get("enable_news_caution", True),
        "store_evidence_locally_only": preferences.get("store_evidence_locally_only", True),
        "anonymize_feedback_learning": preferences.get("anonymize_feedback_learning", True)
    }
    
    return default_settings

@router.post("/settings")
def update_privacy_settings(
    settings_data: PrivacySettingsUpdate,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    try:
        parsed_preferences = json.loads(settings_data.consent_preferences)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preferences must be a valid JSON-formatted string."
        )

    current_user.consent_preferences = json.dumps(parsed_preferences)
    db.commit()
    
    return {
        "status": "success",
        "message": "Privacy configurations and consent logs updated successfully.",
        "settings": parsed_preferences
    }

@router.post("/purge-history")
def purge_journey_history(
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    deleted_count = db.query(Journey).filter(
        Journey.user_id == current_user.id,
        Journey.status == "Ended"
    ).delete()
    
    db.commit()
    
    return {
        "status": "success",
        "message": f"Successfully deleted {deleted_count} completed journey logs from the server."
    }
