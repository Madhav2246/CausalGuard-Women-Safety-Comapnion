from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db, User
from backend.auth import get_current_verified_woman
from backend.schemas import HealthProfileUpdate, HealthReminderCreate, HealthModeUpdate
from backend.route_risk import HEALTHCARE_FACILITIES
import json

router = APIRouter(prefix="/api/health", tags=["Health Safety"])

@router.post("/profile")
def update_health_profile(
    data: HealthProfileUpdate,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    pref = json.loads(current_user.consent_preferences or "{}")
    pref["health_profile"] = {
        "period_discomfort_active": data.period_discomfort_active,
        "pregnancy_safety_active": data.pregnancy_safety_active,
        "medicine_reminders": data.medicine_reminders
    }
    
    current_user.consent_preferences = json.dumps(pref)
    db.commit()
    
    return {
        "status": "success",
        "message": "Health safety profile updated. Disclaimer: This is not medical advice. For medical emergencies, contact a doctor or emergency service.",
        "profile": pref["health_profile"]
    }

@router.post("/mode")
def toggle_health_mode(
    data: HealthModeUpdate,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    pref = json.loads(current_user.consent_preferences or "{}")
    pref["health_mode_enabled"] = data.is_active
    current_user.consent_preferences = json.dumps(pref)
    db.commit()
    
    return {
        "status": "success",
        "health_mode_active": data.is_active,
        "message": f"Health-aware route planning {'enabled' if data.is_active else 'disabled'}. Disclaimer: This is not medical advice. For medical emergencies, contact a doctor or emergency service."
    }

@router.get("/nearby-support")
def get_nearby_health_support():
    return {
        "disclaimer": "This is not medical advice. For medical emergencies, contact a doctor or emergency service.",
        "facilities": HEALTHCARE_FACILITIES
    }

@router.post("/reminder")
def add_health_reminder(
    reminder: HealthReminderCreate,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    from backend.database import HealthReminder
    db_reminder = HealthReminder(
        user_id=current_user.id,
        reminder_text=reminder.reminder_text,
        reminder_time=reminder.reminder_time
    )
    db.add(db_reminder)
    
    pref = json.loads(current_user.consent_preferences or "{}")
    hp = pref.get("health_profile", {})
    reminders = hp.get("medicine_reminders", [])
    reminders.append(f"{reminder.reminder_text} at {reminder.reminder_time}")
    hp["medicine_reminders"] = reminders
    pref["health_profile"] = hp
    current_user.consent_preferences = json.dumps(pref)
    
    db.commit()
    return {"status": "success", "message": f"Medicine reminder '{reminder.reminder_text}' added successfully.", "reminder": reminder}

