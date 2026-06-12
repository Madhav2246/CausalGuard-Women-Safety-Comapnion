from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db, Alert, User
from backend.auth import get_current_user, get_current_verified_woman
from backend.schemas import PoliceProtectionRequest, PoliceAlertOut, PoliceAlertUpdate
from datetime import datetime

router = APIRouter(prefix="/api/police", tags=["Police Dashboard"])

@router.post("/protection-request")
def request_protection(
    req: PoliceProtectionRequest,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    alert = Alert(
        user_id=current_user.id,
        latitude=req.latitude,
        longitude=req.longitude,
        risk_score=req.risk_score,
        route_details=req.route_details,
        status="New",
        alert_type="Protection Request",
        timestamp=datetime.utcnow()
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return {
        "status": "success",
        "alert_id": alert.id,
        "message": "Proactive protection request dispatched to police. Patrols alerted."
    }

@router.get("/alerts", response_model=List[PoliceAlertOut])
def get_police_alerts(
    db: Session = Depends(get_db)
):
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).all()
    
    result = []
    for alert in alerts:
        user = db.query(User).filter(User.id == alert.user_id).first()
        user_name = user.name if user else "Anonymous"
        user_phone = user.phone_number if user else "N/A"
        
        result.append(
            PoliceAlertOut(
                id=alert.id,
                user_id=alert.user_id,
                user_name=user_name,
                user_phone=user_phone,
                latitude=alert.latitude,
                longitude=alert.longitude,
                risk_score=alert.risk_score,
                route_details=alert.route_details,
                status=alert.status,
                timestamp=alert.timestamp,
                alert_type=alert.alert_type
            )
        )
    return result

@router.post("/update-status")
def update_alert_status(
    data: PoliceAlertUpdate,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == data.alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency record not found."
        )

    valid_statuses = ["New", "Viewed", "Responding", "Resolved"]
    if data.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status value. Must be: {valid_statuses}"
        )

    alert.status = data.status
    db.commit()
    return {
        "status": "success",
        "message": f"Alert status updated to {data.status}."
    }
