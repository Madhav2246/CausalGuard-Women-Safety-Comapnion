from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class UserCreate(BaseModel):
    name: str
    age: int
    phone_number: str
    email: EmailStr
    password: str
    gender_declaration: str
    gov_id_type: str
    gov_id_number: str
    emergency_contact: str
    preferred_language: Optional[str] = "English"
    role: Optional[str] = "Woman"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: str
    verification_status: str

class UserOut(BaseModel):
    id: int
    name: str
    age: int
    phone_number: str
    email: EmailStr
    gender_declaration: str
    gov_id_type: str
    gov_id_number: str
    emergency_contact: str
    preferred_language: str
    role: str
    verification_status: str
    consent_preferences: str

    class Config:
        from_attributes = True

class UserVerify(BaseModel):
    gov_id_type: str
    gov_id_number: str
    name: str
    age: int
    gender_declaration: str

# Guardian Schemas
class GuardianInvite(BaseModel):
    name: str
    phone: str
    email: EmailStr
    relationship: str

class GuardianApprove(BaseModel):
    invitation_code: str

class GuardianPermissionsUpdate(BaseModel):
    guardian_id: int
    permission_level: str # SOS-only, Journey-only, Temp-30m, One-time, Always-on, No access

class GuardianOut(BaseModel):
    id: int
    user_id: int
    guardian_id: Optional[int] = None
    name: str
    phone: str
    email: str
    relationship: str
    invitation_code: str
    status: str
    permission_level: str

    class Config:
        from_attributes = True

# Journey Schemas
class JourneyStart(BaseModel):
    start_lat: float
    start_lng: float
    dest_lat: float
    dest_lng: float
    mode: str # Safe Journey, Cab Safety, Health Safety, Campus Safety, Emotional Safety
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    check_in_minutes: Optional[int] = None

class JourneyUpdateLocation(BaseModel):
    latitude: float
    longitude: float

class JourneyEnd(BaseModel):
    journey_id: int

class JourneyOut(BaseModel):
    id: int
    user_id: int
    start_lat: float
    start_lng: float
    dest_lat: float
    dest_lng: float
    current_lat: float
    current_lng: float
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    mode: str
    check_in_time: Optional[datetime] = None
    risk_score: int
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    route_polyline: Optional[str] = None

    class Config:
        from_attributes = True

# Route Risk / Recommendation Schemas
class Coordinate(BaseModel):
    lat: float
    lng: float

class RouteOption(BaseModel):
    route_id: str
    name: str
    distance_km: float
    duration_min: int
    risk_score: int
    risk_level: str # Low, Medium, High
    police_distance_km: float
    hospital_distance_km: Optional[float] = None
    news_alerts_count: int
    reason_summary: str
    coordinates: List[List[float]] # List of [lat, lng] for routing line

class RouteRecommendRequest(BaseModel):
    start_lat: float
    start_lng: float
    dest_lat: float
    dest_lng: float
    health_mode_active: Optional[bool] = False
    campus_mode_active: Optional[bool] = False

class RouteRecommendResponse(BaseModel):
    routes: List[RouteOption]
    explanation: str

class RouteRiskScoreRequest(BaseModel):
    lat: float
    lng: float
    time_of_day: Optional[str] = None

class RouteRiskScoreResponse(BaseModel):
    risk_score: int
    risk_level: str
    factors: List[str]

# Voice Schemas
class VoiceCommandRequest(BaseModel):
    command: str
    language: Optional[str] = "English"

class VoiceCommandResponse(BaseModel):
    intent: str
    action_executed: str
    response_text: str
    data: Optional[Dict[str, Any]] = None

# SOS / Emergency Schemas
class SOSTrigger(BaseModel):
    latitude: float
    longitude: float
    evidence_consent: bool

class SOSCheckResponse(BaseModel):
    response: str # safe, unsafe, none

class PoliceProtectionRequest(BaseModel):
    latitude: float
    longitude: float
    risk_score: int
    route_details: str

class PoliceAlertOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_phone: str
    latitude: float
    longitude: float
    risk_score: int
    route_details: Optional[str] = None
    status: str
    timestamp: datetime
    alert_type: str

    class Config:
        from_attributes = True

class PoliceAlertUpdate(BaseModel):
    alert_id: int
    status: str # New, Viewed, Responding, Resolved

# News Schemas
class NewsAlertOut(BaseModel):
    id: int
    title: str
    location: str
    severity: str
    lat: float
    lng: float
    timestamp: datetime

    class Config:
        from_attributes = True

# Health Schemas
class HealthProfileUpdate(BaseModel):
    period_discomfort_active: bool
    pregnancy_safety_active: bool
    medicine_reminders: List[str]

class HealthReminderCreate(BaseModel):
    reminder_text: str
    reminder_time: str # e.g. "08:00"

class HealthModeUpdate(BaseModel):
    is_active: bool

# Cab / Auto Schemas
class CabTripStart(BaseModel):
    vehicle_number: str
    driver_name: Optional[str] = None
    start_lat: float
    start_lng: float
    dest_lat: float
    dest_lng: float

class CabLocationUpdate(BaseModel):
    latitude: float
    longitude: float

class CabDeviationCheck(BaseModel):
    journey_id: int
    current_lat: float
    current_lng: float

# Harassment Schemas
class HarassmentCheckRequest(BaseModel):
    text: str

class HarassmentCheckResponse(BaseModel):
    category: str # Safe, Suspicious, Harassment, Threatening
    confidence_score: float
    explanation: str
    suggested_action: str

# Evidence Schemas
class EvidenceCreate(BaseModel):
    title: str
    content_type: str # text, vehicle, audio, photo, route
    description: str
    file_content: Optional[str] = None # Base64 data
    file_name: Optional[str] = None

class EvidenceOut(BaseModel):
    id: int
    user_id: int
    title: str
    content_type: str
    description: str
    file_name: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Privacy Schemas
class PrivacySettingsUpdate(BaseModel):
    consent_preferences: str # JSON format containing settings

# Feedback Schemas
class FeedbackCreate(BaseModel):
    journey_id: int
    safe_rating: int
    risk_accurate: bool
    incident_happened: bool
    crowd_estimate_correct: bool
    comments: Optional[str] = ""
