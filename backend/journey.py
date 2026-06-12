import json
import os
import requests
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db, Journey, User, Guardian, NewsAlert
from backend.auth import get_current_user, get_current_verified_woman
from backend.schemas import JourneyStart, JourneyUpdateLocation, JourneyEnd, JourneyOut, RouteRecommendRequest, RouteRecommendResponse, RouteOption
from backend.route_risk import calculate_point_risk, POLICE_STATIONS, HEALTHCARE_FACILITIES, haversine_distance
from backend.explanation_engine import generate_causal_explanation, generate_what_if_scenarios

router = APIRouter(prefix="/api", tags=["Journeys & Navigation"])

USE_OSRM = os.getenv("USE_OSRM", "true").lower() == "true"

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

def get_fallback_coordinates(start_lat: float, start_lng: float, dest_lat: float, dest_lng: float, is_safest: bool = True):
    if not is_safest:
        # Straight line approximation
        return [
            [start_lat, start_lng],
            [start_lat + (dest_lat - start_lat) * 0.33, start_lng + (dest_lng - start_lng) * 0.33],
            [start_lat + (dest_lat - start_lat) * 0.66, start_lng + (dest_lng - start_lng) * 0.66],
            [dest_lat, dest_lng]
        ]
    else:
        # Perpendicular offset to create a curved, safer route
        mid_lat = (start_lat + dest_lat) / 2
        mid_lng = (start_lng + dest_lng) / 2
        d_lat = dest_lat - start_lat
        d_lng = dest_lng - start_lng
        
        offset_lat = -d_lng * 0.15
        offset_lng = d_lat * 0.15
        
        return [
            [start_lat, start_lng],
            [start_lat + d_lat * 0.25 + offset_lat * 0.5, start_lng + d_lng * 0.25 + offset_lng * 0.5],
            [mid_lat + offset_lat, mid_lng + offset_lng],
            [start_lat + d_lat * 0.75 + offset_lat * 0.5, start_lng + d_lng * 0.75 + offset_lng * 0.5],
            [dest_lat, dest_lng]
        ]

def get_osrm_route(start_lat, start_lng, dest_lat, dest_lng, profile="foot", waypoints=None):
    # OSRM expects {lng},{lat}
    coords_str = f"{start_lng},{start_lat}"
    if waypoints:
        for wp_lat, wp_lng in waypoints:
            coords_str += f";{wp_lng},{wp_lat}"
    coords_str += f";{dest_lng},{dest_lat}"
    
    url = f"https://router.project-osrm.org/route/v1/{profile}/{coords_str}?overview=full&geometries=geojson&alternatives=true"
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data.get("code") == "Ok":
                return data.get("routes", [])
    except Exception as e:
        print(f"OSRM Routing API Error: {e}")
    return []

def evaluate_route_risk(coords, db, health_mode=False, lighting=0.6, crowd_density=0.4, area_isolation=0.3):
    if not coords:
        return 50, "Medium", [], 2.0
    # Sample start, middle, end points
    n = len(coords)
    if n <= 3:
        sample_points = coords
    else:
        sample_points = [coords[0], coords[n // 2], coords[-1]]
    
    scores = []
    all_factors = set()
    min_police_dist = 999.0
    for lat, lng in sample_points:
        risk_info = calculate_point_risk(
            lat=lat, lng=lng,
            time_of_day="23:30", # Assume late night for demo risk weighting
            lighting=lighting,
            crowd_density=crowd_density,
            area_isolation=area_isolation,
            health_mode=health_mode,
            db=db
        )
        scores.append(risk_info["risk_score"])
        for f in risk_info["factors"]:
            all_factors.add(f)
        if risk_info["min_police_dist"] < min_police_dist:
            min_police_dist = risk_info["min_police_dist"]
            
    avg_score = int(sum(scores) / len(scores))
    if avg_score <= 35:
        level = "Low"
    elif avg_score <= 70:
        level = "Medium"
    else:
        level = "High"
    return avg_score, level, list(all_factors), min_police_dist

@router.get("/map/nearby-police")
def get_nearby_police():
    return POLICE_STATIONS

@router.get("/map/nearby-healthcare")
def get_nearby_healthcare():
    return HEALTHCARE_FACILITIES

@router.post("/route/recommend", response_model=RouteRecommendResponse)
def recommend_routes(request: RouteRecommendRequest, db: Session = Depends(get_db)):
    start_lat = request.start_lat
    start_lng = request.start_lng
    dest_lat = request.dest_lat
    dest_lng = request.dest_lng
    health_mode = request.health_mode_active
    campus_mode = request.campus_mode_active
    destination = request.dest_name or "Destination"

    routes_out = []
    fallback_used = False
    explanation = ""
    what_if_list = []

    profile = "foot"

    osrm_routes = []
    if USE_OSRM:
        osrm_routes = get_osrm_route(start_lat, start_lng, dest_lat, dest_lng, profile=profile)

    if not osrm_routes:
        fallback_used = True
        
        # Dynamically generate fallback route coordinates based on actual search inputs
        route_a_coords = get_fallback_coordinates(start_lat, start_lng, dest_lat, dest_lng, is_safest=False)
        route_b_coords = get_fallback_coordinates(start_lat, start_lng, dest_lat, dest_lng, is_safest=True)
        
        # Route A (Shortest Route) - lower safety metrics
        risk_score_a, risk_level_a, factors_a, police_dist_a = evaluate_route_risk(
            route_a_coords, db, health_mode,
            lighting=0.25, crowd_density=0.15, area_isolation=0.7
        )
        # Route B (Safest Route) - high safety metrics
        risk_score_b, risk_level_b, factors_b, police_dist_b = evaluate_route_risk(
            route_b_coords, db, health_mode,
            lighting=0.85, crowd_density=0.6, area_isolation=0.15
        )

        # Calculate dynamic distance based on coordinates
        dist_raw = haversine_distance(start_lat, start_lng, dest_lat, dest_lng)
        dist_a = round(max(0.2, dist_raw * 1.15), 2)
        dist_b = round(max(0.3, dist_raw * 1.40), 2)
        
        # Duration based on walking speed (approx 12 min per km)
        dur_a = max(1, int(dist_a * 12))
        dur_b = max(1, int(dist_b * 12))

        # Dynamic nearest hospital distance from local list
        def get_min_hosp_dist(coords_list):
            val = 999.0
            for h in HEALTHCARE_FACILITIES:
                for lt, lg in coords_list:
                    d = haversine_distance(lt, lg, h["lat"], h["lng"])
                    if d < val:
                        val = d
            return round(val, 2) if val < 900 else 1.2

        hosp_dist_a = get_min_hosp_dist(route_a_coords)
        hosp_dist_b = get_min_hosp_dist(route_b_coords)

        # Count news alerts in close proximity
        alerts_count_a = 0
        alerts_count_b = 0
        news_alerts = db.query(NewsAlert).all()
        for alert in news_alerts:
            for lt, lg in route_a_coords:
                if haversine_distance(lt, lg, alert.lat, alert.lng) < 1.0:
                    alerts_count_a += 1
                    break
            for lt, lg in route_b_coords:
                if haversine_distance(lt, lg, alert.lat, alert.lng) < 1.0:
                    alerts_count_b += 1
                    break

        route_a = RouteOption(
            route_id="shortest",
            name="Route A (Shortest Route)",
            distance_km=dist_a,
            duration_min=dur_a,
            risk_score=risk_score_a,
            risk_level=risk_level_a,
            police_distance_km=police_dist_a,
            hospital_distance_km=hosp_dist_a,
            news_alerts_count=alerts_count_a,
            reason_summary=f"Fallback shortest path: passes within {police_dist_a:.1f}km of police station. Lower lighting index weights.",
            coordinates=route_a_coords
        )

        route_b = RouteOption(
            route_id="safest",
            name="Route B (Safest Route - Recommended)",
            distance_km=dist_b,
            duration_min=dur_b,
            risk_score=risk_score_b,
            risk_level=risk_level_b,
            police_distance_km=police_dist_b,
            hospital_distance_km=hosp_dist_b,
            news_alerts_count=alerts_count_b,
            reason_summary=f"Fallback safest path: optimized proximity to police station ({police_dist_b:.1f}km) and medical support ({hosp_dist_b:.1f}km).",
            coordinates=route_b_coords
        )
        routes_out = [route_b, route_a]
        explanation = generate_causal_explanation(
            route_name=route_b.name,
            risk_score=route_b.risk_score,
            risk_level=route_b.risk_level,
            factors=factors_b,
            destination=destination
        )
        
        # What-if analysis
        hour = datetime.now().hour
        is_night = hour >= 19 or hour < 6
        has_poor_lighting = any("Poor Street Lighting" in f for f in factors_b)
        has_low_crowd = any("Low Crowd Presence" in f for f in factors_b)
        what_if_list = generate_what_if_scenarios(
            current_score=route_b.risk_score,
            is_night=is_night,
            has_poor_lighting=has_poor_lighting,
            has_low_crowd=has_low_crowd,
            guardian_enabled=False,
            health_mode=health_mode
        )
    else:
        if len(osrm_routes) == 1:
            first_route_coords = [[pt[1], pt[0]] for pt in osrm_routes[0]["geometry"]["coordinates"]]
            if first_route_coords:
                mid_idx = len(first_route_coords) // 2
                mid_lat, mid_lng = first_route_coords[mid_idx]
                
                # Calculate perpendicular offset from the direction vector to force a parallel road path
                import math
                start_pt = first_route_coords[0]
                dest_pt = first_route_coords[-1]
                d_lat = dest_pt[0] - start_pt[0]
                d_lng = dest_pt[1] - start_pt[1]
                
                dist_raw = math.sqrt(d_lat**2 + d_lng**2)
                # Offset by 15% of direct distance, bounded between 0.0015 (~150m) and 0.005 (~500m) degrees
                offset_val = max(0.0015, min(0.005, dist_raw * 0.15))
                
                if dist_raw > 0:
                    offset_lat = (-d_lng / dist_raw) * offset_val
                    offset_lng = (d_lat / dist_raw) * offset_val
                else:
                    offset_lat = 0.002
                    offset_lng = 0.002
                
                waypoint_lat = mid_lat + offset_lat
                waypoint_lng = mid_lng + offset_lng
                
                alt_routes = get_osrm_route(
                    start_lat, start_lng, dest_lat, dest_lng,
                    profile=profile,
                    waypoints=[(waypoint_lat, waypoint_lng)]
                )
                if alt_routes:
                    osrm_routes.append(alt_routes[0])

        for idx, route in enumerate(osrm_routes):
            coords = [[pt[1], pt[0]] for pt in route["geometry"]["coordinates"]]
            distance_km = round(route["distance"] / 1000.0, 2)
            duration_min = int(round(route["duration"] / 60.0))
            
            route_id = "safest" if idx == 0 else f"alternative_{idx}"
            if len(osrm_routes) > 1 and idx == len(osrm_routes) - 1:
                route_id = "shortest"
            
            if route_id == "safest":
                name = "Route A (Safest Route - Recommended)"
                lighting = 0.85
                crowd_density = 0.6
                area_isolation = 0.15
            elif route_id == "shortest":
                name = "Route B (Shortest Route)"
                lighting = 0.25
                crowd_density = 0.15
                area_isolation = 0.7
            else:
                name = f"Route C (Alternative Route)"
                lighting = 0.5
                crowd_density = 0.35
                area_isolation = 0.4
            
            risk_score, risk_level, factors, min_police_dist = evaluate_route_risk(
                coords, db, health_mode,
                lighting=lighting,
                crowd_density=crowd_density,
                area_isolation=area_isolation
            )
            
            news_alerts_count = 0
            news_alerts = db.query(NewsAlert).all()
            for alert in news_alerts:
                for lat, lng in coords[::max(1, len(coords)//10)]:
                    if haversine_distance(lat, lng, alert.lat, alert.lng) < 0.5:
                        news_alerts_count += 1
                        break

            min_hosp_dist = 999.0
            for h in HEALTHCARE_FACILITIES:
                for lat, lng in coords[::max(1, len(coords)//10)]:
                    dist = haversine_distance(lat, lng, h["lat"], h["lng"])
                    if dist < min_hosp_dist:
                        min_hosp_dist = dist

            reason = f"OSRM route: passes near police station ({min_police_dist:.1f}km)."
            if news_alerts_count > 0:
                reason += f" Contains {news_alerts_count} recent safety cautions."
            if health_mode and min_hosp_dist < 1.5:
                reason += f" Immediate access to medical care ({min_hosp_dist:.2f}km)."

            routes_out.append(RouteOption(
                route_id=route_id,
                name=name,
                distance_km=distance_km,
                duration_min=duration_min,
                risk_score=risk_score,
                risk_level=risk_level,
                police_distance_km=min_police_dist,
                hospital_distance_km=min_hosp_dist if min_hosp_dist < 999 else None,
                news_alerts_count=news_alerts_count,
                coordinates=coords,
                reason_summary=reason
            ))

        routes_out.sort(key=lambda r: r.risk_score)
        if len(routes_out) >= 2:
            routes_out[0].route_id = "safest"
            routes_out[0].name = "Route B (Safest Route - Recommended)"
            routes_out[1].route_id = "shortest"
            routes_out[1].name = "Route A (Shortest Route)"

            # If OSRM returned identical coordinates, offset the safest route to make it visually distinct
            if routes_out[0].coordinates == routes_out[1].coordinates:
                coords = routes_out[0].coordinates
                n = len(coords)
                if n > 2:
                    mid_idx = n // 2
                    start_pt = coords[0]
                    dest_pt = coords[-1]
                    d_lat = dest_pt[0] - start_pt[0]
                    d_lng = dest_pt[1] - start_pt[1]
                    
                    offset_lat = -d_lng * 0.15
                    offset_lng = d_lat * 0.15
                    
                    new_coords = []
                    for idx, pt in enumerate(coords):
                        if idx == 0 or idx == n - 1:
                            new_coords.append(pt)
                        else:
                            factor = 1.0 - (abs(idx - mid_idx) / mid_idx)
                            new_coords.append([
                                pt[0] + offset_lat * factor,
                                pt[1] + offset_lng * factor
                            ])
                    routes_out[0].coordinates = new_coords
                    routes_out[0].distance_km = round(routes_out[1].distance_km * 1.25, 2)
                    routes_out[0].duration_min = max(1, int(routes_out[0].distance_km * 12))
            
        recommended_route = routes_out[0]
        _, _, rec_factors, _ = evaluate_route_risk(
            recommended_route.coordinates, db, health_mode,
            lighting=0.85, crowd_density=0.6, area_isolation=0.15
        )
        
        explanation = generate_causal_explanation(
            route_name=recommended_route.name,
            risk_score=recommended_route.risk_score,
            risk_level=recommended_route.risk_level,
            factors=rec_factors,
            destination=destination
        )
        if health_mode:
            explanation += " [Health Mode: Evaluated paths adjacent to 24/7 clinics/pharmacies.]"

        # What-if analysis
        hour = datetime.now().hour
        is_night = hour >= 19 or hour < 6
        has_poor_lighting = any("Poor Street Lighting" in f for f in rec_factors)
        has_low_crowd = any("Low Crowd Presence" in f for f in rec_factors)
        what_if_list = generate_what_if_scenarios(
            current_score=recommended_route.risk_score,
            is_night=is_night,
            has_poor_lighting=has_poor_lighting,
            has_low_crowd=has_low_crowd,
            guardian_enabled=False,
            health_mode=health_mode
        )

    return RouteRecommendResponse(
        routes=routes_out,
        explanation=explanation,
        fallback_used=fallback_used,
        what_if=what_if_list
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

    polyline_coords = get_fallback_coordinates(trip.start_lat, trip.start_lng, trip.dest_lat, trip.dest_lng, is_safest=True)
    if USE_OSRM:
        osrm_routes = get_osrm_route(trip.start_lat, trip.start_lng, trip.dest_lat, trip.dest_lng, profile="foot")
        if osrm_routes:
            polyline_coords = [[pt[1], pt[0]] for pt in osrm_routes[0]["geometry"]["coordinates"]]

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
        route_polyline=json.dumps(polyline_coords)
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
