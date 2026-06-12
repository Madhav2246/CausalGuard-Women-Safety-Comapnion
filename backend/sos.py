from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db, Alert, User, Journey
from backend.auth import get_current_user
from backend.schemas import SOSTrigger, SOSCheckResponse
from datetime import datetime

router = APIRouter(prefix="/api/sos", tags=["SOS Emergency"])

@router.post("/trigger")
def trigger_sos(
    sos_data: SOSTrigger,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    active_journey = db.query(Journey).filter(
        Journey.user_id == current_user.id,
        Journey.status == "Active"
    ).first()
    
    route_info = ""
    if active_journey:
        route_info = f"Mode: {active_journey.mode}, Vehicle: {active_journey.vehicle_number or 'Walking'}, Destination coordinates: ({active_journey.dest_lat}, {active_journey.dest_lng})"

    alert = Alert(
        user_id=current_user.id,
        latitude=sos_data.latitude,
        longitude=sos_data.longitude,
        risk_score=95,
        route_details=route_info or "Direct SOS Button Triggered (No Active Route)",
        status="New",
        alert_type="SOS",
        timestamp=datetime.utcnow()
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    evidence_status = "Skipped"
    if sos_data.evidence_consent:
        from backend.database import Evidence
        evidence = Evidence(
            user_id=current_user.id,
            title=f"SOS Location Capture - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            content_type="route",
            description=f"Auto-saved GPS coordinate: ({sos_data.latitude}, {sos_data.longitude}). Route: {route_info or 'N/A'}",
            timestamp=datetime.utcnow()
        )
        db.add(evidence)
        db.commit()
        evidence_status = "Saved to Evidence Locker"

    return {
        "status": "success",
        "alert_id": alert.id,
        "timestamp": alert.timestamp,
        "message": "SOS alert successfully registered. Simulated police dispatch and trusted guardians notified.",
        "evidence_locker": evidence_status
    }

@router.post("/check-response")
def check_response(
    check: SOSCheckResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if check.response == "safe":
        return {
            "status": "success",
            "message": "User verified safe. Monitoring continues."
        }
    
    active_journey = db.query(Journey).filter(
        Journey.user_id == current_user.id,
        Journey.status == "Active"
    ).first()
    
    lat = active_journey.current_lat if active_journey else 18.5200
    lng = active_journey.current_lng if active_journey else 73.8400

    alert = Alert(
        user_id=current_user.id,
        latitude=lat,
        longitude=lng,
        risk_score=90,
        route_details=f"Auto-Triggered: Unresponsive Check-in. Active Mode: {active_journey.mode if active_journey else 'Unknown'}",
        status="New",
        alert_type="SOS",
        timestamp=datetime.utcnow()
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    return {
        "status": "escalated",
        "alert_id": alert.id,
        "message": "User unresponsive or declared unsafe. Emergency SOS auto-triggered. Guardians and authorities alerted."
    }
