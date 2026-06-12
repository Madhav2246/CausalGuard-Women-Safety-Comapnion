from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db, NewsAlert
from backend.schemas import RouteRiskScoreRequest, RouteRiskScoreResponse
from datetime import datetime
import math

router = APIRouter(prefix="/api/route", tags=["Routing & Risk"])

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0 # Radius of Earth in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

POLICE_STATIONS = [
    {"name": "Deccan Police Station", "lat": 18.5162, "lng": 73.8415},
    {"name": "Shivajinagar Police Station", "lat": 18.5308, "lng": 73.8474},
    {"name": "Kothrud Police Station", "lat": 18.5074, "lng": 73.8077},
    {"name": "Cantonment Police Station", "lat": 18.5089, "lng": 73.8791},
    # Hyderabad Fallbacks for Demo
    {"name": "Punjagutta Police Station", "lat": 17.4264, "lng": 78.4534},
    {"name": "Ameerpet Police Outpost", "lat": 17.4370, "lng": 78.4485},
    {"name": "Madhapur Police Station", "lat": 17.4485, "lng": 78.3738},
    {"name": "Gachibowli Police Station", "lat": 17.4400, "lng": 78.3480},
]

HEALTHCARE_FACILITIES = [
    {"name": "Deenanath Mangeshkar Hospital", "lat": 18.5048, "lng": 73.8329, "type": "Hospital"},
    {"name": "Jehangir Hospital", "lat": 18.5295, "lng": 73.8732, "type": "Hospital"},
    {"name": "Sahyadri Super Speciality Hospital", "lat": 18.5150, "lng": 73.8335, "type": "Hospital"},
    {"name": "Noble Pharmacy Shivajinagar", "lat": 18.5280, "lng": 73.8490, "type": "Pharmacy"},
    {"name": "Apollo Pharmacy Kothrud", "lat": 18.5090, "lng": 73.8100, "type": "Pharmacy"},
    # Hyderabad Fallbacks for Demo
    {"name": "NIMS Hospital Punjagutta", "lat": 17.4250, "lng": 78.4550, "type": "Hospital"},
    {"name": "Apollo Clinic Ameerpet", "lat": 17.4380, "lng": 78.4490, "type": "Hospital"},
    {"name": "MaxCure Hospital Madhapur", "lat": 17.4480, "lng": 78.3750, "type": "Hospital"},
]

def calculate_point_risk(
    lat: float,
    lng: float,
    time_of_day: str,
    lighting: float,
    crowd_density: float,
    area_isolation: float,
    health_mode: bool = False,
    db: Session = None
) -> dict:
    base_score = 15.0
    factors = []

    try:
        hour = int(time_of_day.split(":")[0])
    except:
        hour = datetime.now().hour

    is_late_night = hour >= 22 or hour < 4
    is_evening = hour >= 18 and hour < 22
    
    if is_late_night:
        base_score += 25
        factors.append("Late Night Commute (+25%)")
    elif is_evening:
        base_score += 10
        factors.append("Evening Hours (+10%)")
    else:
        base_score -= 5

    if lighting < 0.3:
        base_score += 20
        factors.append("Poor Street Lighting (+20%)")
    elif lighting > 0.8:
        base_score -= 10
        factors.append("Well-Lit Area (-10%)")

    if crowd_density < 0.2:
        base_score += 15
        factors.append("Low Crowd Presence (+15%)")
    elif crowd_density > 0.6:
        base_score -= 5
        factors.append("Active Crowd/Public Visibility (-5%)")

    if area_isolation > 0.7:
        base_score += 15
        factors.append("Isolated/Desolate Roadway (+15%)")

    min_police_dist = min([haversine_distance(lat, lng, ps["lat"], ps["lng"]) for ps in POLICE_STATIONS])
    if min_police_dist > 2.0:
        base_score += 15
        factors.append(f"Responders distant: Nearest station {min_police_dist:.1f}km away (+15%)")
    else:
        base_score -= 10
        factors.append(f"Proximity to Police Station ({min_police_dist:.2f}km) (-10%)")

    if db:
        news_alerts = db.query(NewsAlert).all()
        nearby_alerts = 0
        for alert in news_alerts:
            dist = haversine_distance(lat, lng, alert.lat, alert.lng)
            if dist < 1.0:
                nearby_alerts += 1
                if alert.severity == "High":
                    base_score += 15
                elif alert.severity == "Medium":
                    base_score += 10
                else:
                    base_score += 5
        if nearby_alerts > 0:
            factors.append(f"News Alert: {nearby_alerts} recent safety reports nearby (+10-15% per report)")

    if health_mode:
        min_health_dist = min([haversine_distance(lat, lng, h["lat"], h["lng"]) for h in HEALTHCARE_FACILITIES])
        if min_health_dist > 1.5:
            base_score += 15
            factors.append(f"Healthcare support far in Health Mode: {min_health_dist:.1f}km away (+15%)")
        else:
            base_score -= 15
            factors.append(f"Medical support immediate ({min_health_dist:.2f}km) (-15%)")

    risk_score = max(0, min(100, int(base_score)))

    if risk_score <= 35:
        risk_level = "Low"
    elif risk_score <= 70:
        risk_level = "Medium"
    else:
        risk_level = "High"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "factors": factors,
        "min_police_dist": min_police_dist
    }

@router.post("/risk", response_model=RouteRiskScoreResponse)
def get_risk_score(request_data: RouteRiskScoreRequest, db: Session = Depends(get_db)):
    time_str = request_data.time_of_day or datetime.now().strftime("%H:%M")
    hour = int(time_str.split(":")[0])
    is_night = hour >= 19 or hour < 6
    
    lighting = 0.2 if is_night else 0.9
    crowd = 0.1 if is_night else 0.7
    isolation = 0.5 if is_night else 0.2

    risk_info = calculate_point_risk(
        lat=request_data.lat,
        lng=request_data.lng,
        time_of_day=time_str,
        lighting=lighting,
        crowd_density=crowd,
        area_isolation=isolation,
        db=db
    )

    return RouteRiskScoreResponse(
        risk_score=risk_info["risk_score"],
        risk_level=risk_info["risk_level"],
        factors=risk_info["factors"]
    )
