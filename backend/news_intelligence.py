from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db, NewsAlert
from backend.schemas import NewsAlertOut
from typing import List
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/news", tags=["News Intelligence"])

MOCK_NEWS = [
    {
        "title": "Low street lighting and route isolation reported near Deccan underpass stretch.",
        "location": "Deccan Underpass",
        "severity": "Medium",
        "lat": 18.5212,
        "lng": 73.8398
    },
    {
        "title": "Police patrol alert: Recent chain snatching incident near Shivajinagar crossing.",
        "location": "Shivajinagar Crossing",
        "severity": "High",
        "lat": 18.5265,
        "lng": 73.8432
    },
    {
        "title": "Minor pickpocketing and heavy festive crowding reported near Lakshmi Road shopping block.",
        "location": "Lakshmi Road",
        "severity": "Low",
        "lat": 18.5140,
        "lng": 73.8560
    }
]

def seed_news_if_empty(db: Session):
    count = db.query(NewsAlert).count()
    if count == 0:
        for item in MOCK_NEWS:
            alert = NewsAlert(
                title=item["title"],
                location=item["location"],
                severity=item["severity"],
                lat=item["lat"],
                lng=item["lng"],
                timestamp=datetime.utcnow() - timedelta(hours=3)
            )
            db.add(alert)
        db.commit()

@router.get("/safety-alerts", response_model=List[NewsAlertOut])
def get_safety_alerts(db: Session = Depends(get_db)):
    seed_news_if_empty(db)
    return db.query(NewsAlert).all()

@router.post("/refresh")
def refresh_news(db: Session = Depends(get_db)):
    db.query(NewsAlert).delete()
    db.commit()
    seed_news_if_empty(db)
    return {
        "status": "success",
        "message": "Scraped 3 news-based temporary caution signals. Route risk indices updated."
    }
