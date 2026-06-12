import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db, Journey, User, Guardian
from backend.auth import get_current_user, get_current_verified_woman
from backend.schemas import JourneyStart, JourneyUpdateLocation, JourneyEnd, JourneyOut, RouteRecommendRequest, RouteRecommendResponse, RouteOption
from backend.route_risk import calculate_point_risk, POLICE_STATIONS, HEALTHCARE_FACILITIES, haversine_distance
from backend.explanation_engine import generate_causal_explanation, generate_what_if_scenarios

router = APIRouter(prefix="/api", tags=["Journeys & Navigation"])

ROUTE_SHORTEST_COORDINATES = [
    [18.5308, 73.8474],
    [18.5265, 73.8432],
    [18.5212, 73.8398],
    [18.5162, 73.8415]
]

ROUTE_SAFEST_COORDINATES = [
    [18.5308, 73.8474],
    [18.5290, 73.8505],
    [18.5245, 73.8488],
    [18.5200, 73.8465],
    [18.5162, 73.8415]
]

@router.get("/map/nearby-police")
def get_nearby_police():
    return POLICE_STATIONS

@router.get("/map/nearby-healthcare")
def get_nearby_healthcare():
    return HEALTHCARE_FACILITIES

@router.post("/route/recommend", response_model=RouteRecommendResponse)
def recommend_routes(request: RouteRecommendRequest, db: Session = Depends(get_db)):
    risk_a_info = calculate_point_risk(
        lat=18.5240, lng=73.8410,
        time_of_day="23:30",
        lighting=0.15,
        crowd_density=0.1,
        area_isolation=0.85,
        health_mode=request.health_mode_active,
        db=db
    )
    
    risk_b_info = calculate_point_risk(
        lat=18.5245, lng=73.8488,
        time_of_day="23:30",
        lighting=0.9,
        crowd_density=0.6,
        area_isolation=0.1,
        health_mode=request.health_mode_active,
        db=db
    )

    hosp_dist_a = 2.4
    hosp_dist_b = 0.3

    route_a = RouteOption(
        route_id="shortest",
        name="Route A (Shortest Route)",
        distance_km=1.6,
        duration_min=10,
        risk_score=risk_a_info["risk_score"],
        risk_level=risk_a_info["risk_level"],
        police_distance_km=risk_a_info["min_police_dist"],
        hospital_distance_km=hosp_dist_a,
        news_alerts_count=1,
        reason_summary="Dark isolated lanes, higher crime news signals, distant emergency support.",
        coordinates=ROUTE_SHORTEST_COORDINATES
    )

    route_b = RouteOption(
        route_id="safest",
        name="Route B (Safest Route - Recommended)",
        distance_km=2.2,
        duration_min=14,
        risk_score=risk_b_info["risk_score"],
        risk_level=risk_b_info["risk_level"],
        police_distance_km=risk_b_info["min_police_dist"],
        hospital_distance_km=hosp_dist_b,
        news_alerts_count=0,
        reason_summary="Main commercial corridor, active street lighting, close to Deccan Police Station.",
        coordinates=ROUTE_SAFEST_COORDINATES
    )

    explanation = generate_causal_explanation(
        route_name=route_b.name,
        risk_score=route_b.risk_score,
        risk_level=route_b.risk_level,
        factors=risk_b_info["factors"],
        destination="Deccan Gymkhana"
    )

    if request.health_mode_active:
        explanation += " [Health Mode Active: Route B is weighted safer because it passes within 300m of Sahyadri Hospital and Apollo Pharmacy.]"

    return RouteRecommendResponse(
        routes=[route_a, route_b],
        explanation=explanation
    )

@router.post("/journey/start", response_model=JourneyOut)
def start_journey(
    trip: JourneyStart,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    active = db.query(Journey).filter(
        Journey.user_id == current_user.id,
        Journey.status == "Active"
    ).first()
    
    if active:
        active.status = "Ended"
        active.end_time = datetime.utcnow()
        db.commit()

    check_in = None
    if trip.check_in_minutes:
        check_in = datetime.utcnow() + timedelta(minutes=trip.check_in_minutes)

    db_journey = Journey(
        user_id=current_user.id,
        start_lat=trip.start_lat,
        start_lng=trip.start_lng,
        dest_lat=trip.dest_lat,
        dest_lng=trip.dest_lng,
        current_lat=trip.start_lat,
        current_lng=trip.start_lng,
        mode=trip.mode,
        vehicle_number=trip.vehicle_number,
        driver_name=trip.driver_name,
        check_in_time=check_in,
        risk_score=35,
        status="Active",
        start_time=datetime.utcnow(),
        route_polyline=json.dumps(ROUTE_SAFEST_COORDINATES if trip.mode == "Health Safety" else ROUTE_SHORTEST_COORDINATES)
    )
    db.add(db_journey)
    db.commit()
    db.refresh(db_journey)
    return db_journey

@router.post("/journey/update-location", response_model=JourneyOut)
def update_location(
    loc: JourneyUpdateLocation,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    journey = db.query(Journey).filter(
        Journey.user_id == current_user.id,
        Journey.status == "Active"
    ).first()

    if not journey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active journey found."
        )

    journey.current_lat = loc.latitude
    journey.current_lng = loc.longitude
    
    risk_info = calculate_point_risk(
        lat=loc.latitude,
        lng=loc.longitude,
        time_of_day=datetime.now().strftime("%H:%M"),
        lighting=0.8,
        crowd_density=0.5,
        area_isolation=0.2,
        db=db
    )
    journey.risk_score = risk_info["risk_score"]
    
    db.commit()
    db.refresh(journey)
    return journey

@router.post("/journey/end", response_model=JourneyOut)
def end_journey(
    end_data: JourneyEnd,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    journey = db.query(Journey).filter(
        Journey.id == end_data.journey_id,
        Journey.user_id == current_user.id
    ).first()

    if not journey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journey not found."
        )

    journey.status = "Ended"
    journey.end_time = datetime.utcnow()
    db.commit()
    db.refresh(journey)
    return journey
