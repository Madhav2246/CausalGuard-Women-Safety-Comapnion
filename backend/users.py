from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db, User
from backend.auth import get_password_hash, verify_password, create_access_token, get_current_user
from backend.schemas import UserCreate, UserLogin, Token, UserOut

router = APIRouter(prefix="/api", tags=["Auth & User"])

@router.post("/auth/register", response_model=UserOut)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered."
        )
        
    existing_phone = db.query(User).filter(User.phone_number == user_data.phone_number).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered."
        )

    role = user_data.role
    gender = user_data.gender_declaration.lower()
    
    if role == "Woman":
        if gender not in ["female", "woman"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Woman role registration requires 'Female' or 'Woman' gender declaration."
            )
        verification_status = "Unverified"
    else:
        verification_status = "Verified"

    hashed_pw = get_password_hash(user_data.password)
    
    db_user = User(
        name=user_data.name,
        age=user_data.age,
        phone_number=user_data.phone_number,
        email=user_data.email,
        hashed_password=hashed_pw,
        gender_declaration=user_data.gender_declaration,
        gov_id_type=user_data.gov_id_type,
        gov_id_number=user_data.gov_id_number,
        emergency_contact=user_data.emergency_contact,
        preferred_language=user_data.preferred_language or "English",
        role=role,
        verification_status=verification_status,
        consent_preferences="{}"
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/auth/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email, "id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name,
        "verification_status": user.verification_status
    }

@router.get("/user/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user
