from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db, NewsAlert
from backend.schemas import NewsAlertOut
from typing import List
from datetime import datetime, timedelta, timezone
import os
import requests
import random
from backend.llm.gemini_client import generate_agent_response

router = APIRouter(prefix="/api/news", tags=["News Intelligence"])

USE_NEWS_API = os.getenv("USE_NEWS_API", "true").lower() == "true"
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

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

PUNE_LOCATIONS = {
    "deccan": (18.5212, 73.8398),
    "shivajinagar": (18.5265, 73.8432),
    "lakshmi road": (18.5140, 73.8560),
    "kothrud": (18.5074, 73.8077),
    "kalyani nagar": (18.5463, 73.9033),
    "viman nagar": (18.5679, 73.9143),
    "hinjewadi": (18.5913, 73.7389),
    "swargate": (18.5018, 73.8636),
    "kharadi": (18.5513, 73.9348),
    "camp": (18.5133, 73.8767),
    "hadapsar": (18.5089, 73.9260),
    "katraj": (18.4575, 73.8677),
    "aundh": (18.5580, 73.8075),
    "baner": (18.5590, 73.7797),
}

def extract_metadata_gemini(title: str, description: str) -> dict:
    """
    Use Gemini to extract location and severity.
    """
    system_prompt = (
        "You are an AI news analyst for CausalGuard, a women safety app.\n"
        "Analyze the given news title and description.\n"
        "Extract:\n"
        "1. A specific neighborhood or city (focus on India if possible).\n"
        "2. Severity classification: 'Low', 'Medium', or 'High'.\n"
        "Return a JSON object in this exact format:\n"
        "{\n"
        "  \"location\": \"Location Name\",\n"
        "  \"severity\": \"Low\" | \"Medium\" | \"High\"\n"
        "}"
    )
    user_prompt = f"Title: {title}\nDescription: {description}"
    try:
        res = generate_agent_response(system_prompt, user_prompt, json_mode=True)
        return {
            "location": res.get("location", "Unknown"),
            "severity": res.get("severity", "Medium")
        }
    except Exception:
        return {}

def fetch_live_news() -> List[dict]:
    if not USE_NEWS_API or not NEWS_API_KEY:
        return []
        
    query = '("women safety" OR "harassment" OR "crime against women" OR "unsafe area" OR "safety alert") AND "India"'
    url = f"https://newsapi.org/v2/everything?q={requests.utils.quote(query)}&sortBy=publishedAt&apiKey={NEWS_API_KEY}&pageSize=15"
    
    try:
        response = requests.get(url, timeout=5)
        if response.status_code != 200:
            return []
        data = response.json()
        if data.get("status") != "ok":
            return []
        
        articles = data.get("articles", [])
        news_items = []
        for art in articles:
            title = art.get("title")
            desc = art.get("description")
            if not title:
                continue
            
            # Extract location and severity
            loc = "Unknown"
            severity = "Medium"
            
            # Attempt Gemini extraction first
            metadata = extract_metadata_gemini(title, desc or "")
            loc = metadata.get("location", "Unknown")
            severity = metadata.get("severity", "Medium")
            
            # Simple keyword check for Pune locations in title/description
            matched_pune_loc = None
            text_to_check = f"{title} {desc or ''}".lower()
            for key in PUNE_LOCATIONS:
                if key in text_to_check:
                    matched_pune_loc = key
                    break
            
            lat, lng = None, None
            if matched_pune_loc:
                lat, lng = PUNE_LOCATIONS[matched_pune_loc]
                loc = matched_pune_loc.title()
            else:
                # If we don't match a Pune location, put it in Pune with a small random offset
                # so it is visible on our Pune map demo
                base_lat, base_lng = 18.5204, 73.8567
                lat = base_lat + random.uniform(-0.02, 0.02)
                lng = base_lng + random.uniform(-0.02, 0.02)
                if loc == "Unknown":
                    loc = "Pune (Area Alert)"
            
            news_items.append({
                "title": title,
                "location": loc,
                "severity": severity,
                "lat": lat,
                "lng": lng,
                "timestamp": datetime.now(timezone.utc)
            })
        return news_items
    except Exception:
        return []

def seed_news_if_empty(db: Session):
    count = db.query(NewsAlert).count()
    if count == 0:
        live_news = fetch_live_news()
        if live_news:
            for item in live_news:
                alert = NewsAlert(
                    title=item["title"],
                    location=item["location"],
                    severity=item["severity"],
                    lat=item["lat"],
                    lng=item["lng"],
                    timestamp=item["timestamp"],
                    is_live=True
                )
                db.add(alert)
            db.commit()
        else:
            for item in MOCK_NEWS:
                alert = NewsAlert(
                    title=item["title"],
                    location=item["location"],
                    severity=item["severity"],
                    lat=item["lat"],
                    lng=item["lng"],
                    timestamp=datetime.now(timezone.utc) - timedelta(hours=3),
                    is_live=False
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
    
    live_news = fetch_live_news()
    if live_news:
        for item in live_news:
            alert = NewsAlert(
                title=item["title"],
                location=item["location"],
                severity=item["severity"],
                lat=item["lat"],
                lng=item["lng"],
                timestamp=item["timestamp"],
                is_live=True
            )
            db.add(alert)
        db.commit()
        msg = f"Fetched {len(live_news)} live safety alerts."
        result_status = "success"
    else:
        for item in MOCK_NEWS:
            alert = NewsAlert(
                title=item["title"],
                location=item["location"],
                severity=item["severity"],
                lat=item["lat"],
                lng=item["lng"],
                timestamp=datetime.now(timezone.utc) - timedelta(hours=3),
                is_live=False
            )
            db.add(alert)
        db.commit()
        msg = "News API call failed or returned empty. Populated mock caution signals."
        result_status = "fallback"
        
    return {
        "status": result_status,
        "message": msg
    }
