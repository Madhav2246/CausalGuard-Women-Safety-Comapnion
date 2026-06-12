import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db, Guardian, User, Journey
from backend.auth import get_current_user, get_current_verified_woman
from backend.schemas import GuardianInvite, GuardianApprove, GuardianPermissionsUpdate, GuardianOut, JourneyOut

router = APIRouter(prefix="/api/guardian", tags=["Guardians"])

def generate_invitation_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

@router.post("/invite", response_model=GuardianOut)
def invite_guardian(
    invite_data: GuardianInvite,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    code = generate_invitation_code()
    
    existing = db.query(Guardian).filter(
        Guardian.user_id == current_user.id,
        Guardian.phone == invite_data.phone
    ).first()
    
    if existing:
        existing.invitation_code = code
        existing.status = "Pending"
        db.commit()
        db.refresh(existing)
        return existing

    db_guardian = Guardian(
        user_id=current_user.id,
        name=invite_data.name,
        phone=invite_data.phone,
        email=invite_data.email,
        relationship=invite_data.relationship,
        invitation_code=code,
        status="Pending",
        permission_level="SOS-only"
    )
    db.add(db_guardian)
    db.commit()
    db.refresh(db_guardian)
    return db_guardian

@router.post("/approve")
def approve_invitation(
    approve_data: GuardianApprove,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "Guardian":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only users registered as Guardians can approve invitations."
        )

    guardian_record = db.query(Guardian).filter(
        Guardian.invitation_code == approve_data.invitation_code.upper()
    ).first()

    if not guardian_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation code."
        )

    if guardian_record.status == "Approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation already used."
        )

    guardian_record.guardian_id = current_user.id
    guardian_record.status = "Approved"
    db.commit()
    db.refresh(guardian_record)

    return {
        "status": "success",
        "message": f"Successfully linked as trusted guardian for user.",
        "ward_id": guardian_record.user_id
    }

@router.post("/permissions")
def update_permissions(
    permission_data: GuardianPermissionsUpdate,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    guardian_record = db.query(Guardian).filter(
        Guardian.id == permission_data.guardian_id,
        Guardian.user_id == current_user.id
    ).first()

    if not guardian_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guardian connection not found."
        )

    valid_levels = ["No access", "SOS-only", "Journey-only", "Temp-30m", "One-time", "Always-on"]
    if permission_data.permission_level not in valid_levels:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid permission level. Must be one of: {valid_levels}"
        )

    guardian_record.permission_level = permission_data.permission_level
    db.commit()
    return {
        "status": "success",
        "message": f"Permissions updated to {permission_data.permission_level}.",
        "guardian": guardian_record.name
    }

@router.get("/my-guardians", response_model=List[GuardianOut])
def get_my_guardians(
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    return db.query(Guardian).filter(Guardian.user_id == current_user.id).all()

@router.get("/my-wards", response_model=List[GuardianOut])
def get_my_wards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "Guardian":
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(Guardian).filter(Guardian.guardian_id == current_user.id).all()

@router.get("/active-journeys", response_model=List[JourneyOut])
def get_active_journeys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "Guardian":
        raise HTTPException(status_code=403, detail="Access denied")

    guardian_relations = db.query(Guardian).filter(
        Guardian.guardian_id == current_user.id,
        Guardian.status == "Approved"
    ).all()

    active_journeys = []
    for relation in guardian_relations:
        if relation.permission_level == "No access":
            continue

        journey = db.query(Journey).filter(
            Journey.user_id == relation.user_id,
            Journey.status == "Active"
        ).first()

        if journey:
            if relation.permission_level == "SOS-only":
                from backend.database import Alert
                active_sos = db.query(Alert).filter(
                    Alert.user_id == relation.user_id,
                    Alert.alert_type == "SOS",
                    Alert.status.in_(["New", "Responding"])
                ).first()
                if not active_sos:
                    continue

            active_journeys.append(journey)

    return active_journeys
