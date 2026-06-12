from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db, Journey, User, Evidence
from backend.auth import get_current_verified_woman
from backend.schemas import CabTripStart, CabLocationUpdate, CabDeviationCheck
from backend.route_risk import haversine_distance
from datetime import datetime
import json
import os

router = APIRouter(prefix="/api/cab", tags=["Cab & Auto Safety"])

@router.post("/start")
def start_cab_monitoring(
    trip: CabTripStart,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    route_coords = None
    if os.getenv("USE_OSRM", "true").lower() == "true":
        try:
            from backend.journey import get_osrm_route
            routes = get_osrm_route(trip.start_lat, trip.start_lng, trip.dest_lat, trip.dest_lng, profile="driving")
            if routes:
                route_coords = [[pt[1], pt[0]] for pt in routes[0]["geometry"]["coordinates"]]
        except Exception:
            pass
            
    if not route_coords:
        route_coords = [
            [trip.start_lat, trip.start_lng],
            [trip.dest_lat, trip.dest_lng]
        ]

    db_journey = Journey(
        user_id=current_user.id,
        start_lat=trip.start_lat,
        start_lng=trip.start_lng,
        dest_lat=trip.dest_lat,
        dest_lng=trip.dest_lng,
        current_lat=trip.start_lat,
        current_lng=trip.start_lng,
        vehicle_number=trip.vehicle_number,
        driver_name=trip.driver_name or "Unknown Driver",
        mode="Cab Safety",
        risk_score=20,
        status="Active",
        start_time=datetime.utcnow(),
        route_polyline=json.dumps(route_coords)
    )
    db.add(db_journey)
    db.commit()
    db.refresh(db_journey)

    evidence = Evidence(
        user_id=current_user.id,
        title=f"Cab Ride Log: {trip.vehicle_number}",
        content_type="vehicle",
        description=f"Trip started in vehicle {trip.vehicle_number} driven by {trip.driver_name or 'N/A'}. Route: ({trip.start_lat}, {trip.start_lng}) to ({trip.dest_lat}, {trip.dest_lng})",
        timestamp=datetime.utcnow()
    )
    db.add(evidence)
    db.commit()

    return {
        "status": "success",
        "journey_id": db_journey.id,
        "message": f"Cab safety monitoring initialized for vehicle {trip.vehicle_number}. Vehicle details saved to Evidence Locker.",
        "journey": db_journey
    }

@router.post("/deviation-check")
def check_route_deviation(
    check: CabDeviationCheck,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    journey = db.query(Journey).filter(
        Journey.id == check.journey_id,
        Journey.user_id == current_user.id
    ).first()

    if not journey:
        raise HTTPException(status_code=404, detail="Active cab journey not found")

    journey.current_lat = check.current_lat
    journey.current_lng = check.current_lng
    
    polyline_coords = []
    if journey.route_polyline:
        try:
            polyline_coords = json.loads(journey.route_polyline)
        except Exception:
            pass
            
    if not polyline_coords:
        polyline_coords = [
            [journey.start_lat, journey.start_lng],
            [journey.dest_lat, journey.dest_lng]
        ]

    min_dist = min([
        haversine_distance(check.current_lat, check.current_lng, pt[0], pt[1])
        for pt in polyline_coords
    ])

    deviation_detected = False
    # Threshold: 0.5km for cab deviation
    if min_dist > 0.5:
        deviation_detected = True
        journey.risk_score = 75
        db.commit()

    return {
        "journey_id": check.journey_id,
        "current_lat": check.current_lat,
        "current_lng": check.current_lng,
        "distance_from_route_km": round(min_dist, 3),
        "deviation_detected": deviation_detected,
        "message": "Route deviation detected! Prompting safety verification modal." if deviation_detected else "Route alignment normal."
    }

@router.post("/update-location")
def update_cab_location(
    loc: CabLocationUpdate,
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    journey = db.query(Journey).filter(
        Journey.user_id == current_user.id,
        Journey.mode == "Cab Safety",
        Journey.status == "Active"
    ).first()
    if not journey:
        raise HTTPException(status_code=404, detail="No active cab journey found.")
    journey.current_lat = loc.latitude
    journey.current_lng = loc.longitude
    db.commit()
    return {"status": "success", "message": "Cab location updated successfully."}

@router.post("/end")
def end_cab_trip(
    current_user: User = Depends(get_current_verified_woman),
    db: Session = Depends(get_db)
):
    journey = db.query(Journey).filter(
        Journey.user_id == current_user.id,
        Journey.mode == "Cab Safety",
        Journey.status == "Active"
    ).first()
    if not journey:
        raise HTTPException(status_code=404, detail="No active cab journey found.")
    journey.status = "Ended"
    journey.end_time = datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Cab journey ended."}

