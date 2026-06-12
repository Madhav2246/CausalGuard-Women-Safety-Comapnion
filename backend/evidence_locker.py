from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db, Evidence, User
from backend.auth import get_current_verified_woman
from backend.schemas import EvidenceCreate, EvidenceOut

router = APIRouter(prefix="/api/evidence", tags=["Evidence Locker"])

@router.post("/create", response_model=EvidenceOut)
def create_evidence(
    item: EvidenceCreate,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    db_evidence = Evidence(
        user_id=current_user.id,
        title=item.title,
        content_type=item.content_type,
        description=item.description,
        file_content=item.file_content,
        file_name=item.file_name
    )
    db.add(db_evidence)
    db.commit()
    db.refresh(db_evidence)
    return db_evidence

@router.get("/list", response_model=List[EvidenceOut])
def list_evidence(
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    return db.query(Evidence).filter(Evidence.user_id == current_user.id).all()

@router.delete("/{evidence_id}")
def delete_evidence(
    evidence_id: int,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    evidence = db.query(Evidence).filter(
        Evidence.id == evidence_id,
        Evidence.user_id == current_user.id
    ).first()

    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence record not found."
        )

    db.delete(evidence)
    db.commit()
    return {
        "status": "success",
        "message": "Evidence record permanently deleted from local locker."
    }
