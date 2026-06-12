import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db, User
from backend.auth import get_current_user
from backend.schemas import UserVerify

router = APIRouter(prefix="/api", tags=["Verification"])

@router.post("/verify-id")
def verify_id(verification_data: UserVerify, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Simulated Government ID verification.
    For MVP, government ID verification is simulated. In production, authorized KYC APIs
    would verify the user, and only verification status would be stored.
    """
    id_type = verification_data.gov_id_type
    id_number = verification_data.gov_id_number
    age = verification_data.age
    gender = verification_data.gender_declaration
    name = verification_data.name

    # Validate Gender
    if gender.lower() != "female" and gender.lower() != "woman":
        # Full safety companion features are consent-based or restricted, let's keep it clean
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gender declaration must match 'Female' or 'Woman' to complete women-first registration."
        )

    # Validate Age
    if age < 13:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be at least 13 years old to register."
        )

    # Validate ID formatting
    is_valid_format = False
    error_msg = ""
    
    if id_type.lower() == "aadhaar":
        # 12 digits
        if re.match(r"^\d{12}$", id_number):
            is_valid_format = True
        else:
            error_msg = "Aadhaar must be a 12-digit number."
    elif id_type.lower() == "voter id":
        # E.g., ABC1234567 (3 letters followed by 7 digits) or simple 10 alphanumeric characters
        if re.match(r"^[A-Z]{3}\d{7}$", id_number) or len(id_number) == 10:
            is_valid_format = True
        else:
            error_msg = "Voter ID must be a standard 10-character alphanumeric string."
    elif id_type.lower() == "college id":
        # At least 5 alphanumeric characters
        if len(id_number) >= 5:
            is_valid_format = True
        else:
            error_msg = "College ID must be at least 5 characters."
    else:
        # Other Government ID: generic validation
        if len(id_number) >= 6:
            is_valid_format = True
        else:
            error_msg = "Government ID must be at least 6 characters."

    if not is_valid_format:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    # Update current user verification status
    db_user = db.query(User).filter(User.id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_user.verification_status = "Verified"
    # We do NOT save raw ID images or ID numbers for privacy-preservation, 
    # but we record that the ID check succeeded.
    db_user.gov_id_type = id_type
    # Store a masked version of ID for verification logs
    masked_id = id_number[:2] + "*" * (len(id_number) - 4) + id_number[-2:] if len(id_number) > 4 else "**"
    db_user.gov_id_number = masked_id
    
    db.commit()
    db.refresh(db_user)

    return {
        "status": "success",
        "verification_status": "Verified",
        "message": "Government ID verified successfully. Note: For MVP, government ID verification is simulated. In production, authorized KYC APIs would verify the user, and only verification status would be stored."
    }
