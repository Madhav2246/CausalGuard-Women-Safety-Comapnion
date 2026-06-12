import json
import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Always use an absolute path so the DB location is consistent regardless of CWD
_HERE = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(_HERE, 'causalguard.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 1. Users Table
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    phone_number = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    gender_declaration = Column(String)
    gov_id_type = Column(String) # Aadhaar, Voter ID, College ID
    gov_id_number = Column(String)
    emergency_contact = Column(String)
    preferred_language = Column(String, default="English")
    role = Column(String, default="Woman") # Woman, Guardian, Police
    verification_status = Column(String, default="Unverified") # Verified, Unverified
    consent_preferences = Column(Text, default="{}") # JSON string containing tracking consent rules

    # Relationships
    journeys = relationship("Journey", back_populates="user")
    evidences = relationship("Evidence", back_populates="user")
    alerts = relationship("Alert", back_populates="user")

# 2. Guardians Table
class Guardian(Base):
    __tablename__ = "guardians"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # The woman user
    guardian_id = Column(Integer, ForeignKey("users.id"), nullable=True) # If registered
    name = Column(String)
    phone = Column(String, index=True)
    email = Column(String)
    relationship = Column(String) # Father, Mother, Husband, etc.
    invitation_code = Column(String, unique=True)
    status = Column(String, default="Pending") # Pending, Approved, Rejected
    permission_level = Column(String, default="SOS-only") # SOS-only, Journey-only, Temp-30m, One-time, Always-on

# 3. Guardian Permissions Table
class GuardianPermission(Base):
    __tablename__ = "guardian_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    guardian_link_id = Column(Integer, ForeignKey("guardians.id"))
    permission_level = Column(String)
    granted_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

# 4. Journeys Table
class Journey(Base):
    __tablename__ = "journeys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start_lat = Column(Float)
    start_lng = Column(Float)
    dest_lat = Column(Float)
    dest_lng = Column(Float)
    current_lat = Column(Float)
    current_lng = Column(Float)
    vehicle_number = Column(String, nullable=True)
    driver_name = Column(String, nullable=True)
    mode = Column(String, default="Safe Journey") # Safe Journey, Cab Safety, Health Safety, Campus Safety, Emotional Safety
    check_in_time = Column(DateTime, nullable=True)
    risk_score = Column(Integer, default=0)
    status = Column(String, default="Active") # Active, Ended
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    route_polyline = Column(Text, nullable=True) # JSON string of route coordinates

    user = relationship("User", back_populates="journeys")
    feedbacks = relationship("Feedback", back_populates="journey")

# 5. Journey Locations Table
class JourneyLocation(Base):
    __tablename__ = "journey_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    journey_id = Column(Integer, ForeignKey("journeys.id"))
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

# 6. Route Options Table
class RouteOption(Base):
    __tablename__ = "route_options"
    
    id = Column(Integer, primary_key=True, index=True)
    journey_id = Column(Integer, ForeignKey("journeys.id"))
    route_id = Column(String) # shortest, safest
    name = Column(String)
    distance_km = Column(Float)
    duration_min = Column(Integer)
    risk_score = Column(Integer)
    risk_level = Column(String)
    coordinates = Column(Text) # JSON string of coordinates list

# 7. Alerts Table
class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    latitude = Column(Float)
    longitude = Column(Float)
    risk_score = Column(Integer)
    route_details = Column(Text, nullable=True)
    status = Column(String, default="New") # New, Viewed, Responding, Resolved
    timestamp = Column(DateTime, default=datetime.utcnow)
    alert_type = Column(String) # SOS, Protection Request

    user = relationship("User", back_populates="alerts")

# 8. SOS Events Table
class SOSEvent(Base):
    __tablename__ = "sos_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Active") # Active, Resolved
    resolved_at = Column(DateTime, nullable=True)

# 9. Police Alerts Table
class PoliceAlert(Base):
    __tablename__ = "police_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    sos_event_id = Column(Integer, ForeignKey("sos_events.id"), nullable=True)
    user_name = Column(String)
    user_phone = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    risk_score = Column(Integer)
    alert_details = Column(Text)
    status = Column(String, default="New") # New, Responding, Resolved
    timestamp = Column(DateTime, default=datetime.utcnow)

# 10. Evidence Table
class Evidence(Base):
    __tablename__ = "evidences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    content_type = Column(String) # text, vehicle, audio, photo, route
    description = Column(Text)
    file_content = Column(Text, nullable=True) # Base64 data
    file_name = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="evidences")

# 11. Feedback Table
class Feedback(Base):
    __tablename__ = "feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    journey_id = Column(Integer, ForeignKey("journeys.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    safe_rating = Column(Integer)
    risk_accurate = Column(Boolean)
    incident_happened = Column(Boolean)
    crowd_estimate_correct = Column(Boolean)
    comments = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    journey = relationship("Journey", back_populates="feedbacks")

# 12. Privacy Settings Table
class PrivacySetting(Base):
    __tablename__ = "privacy_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    share_sos_only = Column(Boolean, default=True)
    enable_safe_word = Column(Boolean, default=True)
    safe_word = Column(String, default="ACTIVATED")
    enable_health_routing = Column(Boolean, default=False)
    enable_news_caution = Column(Boolean, default=True)
    store_evidence_locally_only = Column(Boolean, default=True)
    anonymize_feedback_learning = Column(Boolean, default=True)

# 13. News Alerts Table
class NewsAlert(Base):
    __tablename__ = "news_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    location = Column(String)
    severity = Column(String) # Low, Medium, High
    lat = Column(Float)
    lng = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_live = Column(Boolean, default=False)

# 14. Health Profiles Table
class HealthProfile(Base):
    __tablename__ = "health_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    period_discomfort_active = Column(Boolean, default=False)
    pregnancy_safety_active = Column(Boolean, default=False)
    medicine_reminders_json = Column(Text, default="[]") # JSON string list

# 15. Health Reminders Table
class HealthReminder(Base):
    __tablename__ = "health_reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    reminder_text = Column(String)
    reminder_time = Column(String) # e.g. "08:00"

# 16. Cab Trips Table
class CabTrip(Base):
    __tablename__ = "cab_trips"
    
    id = Column(Integer, primary_key=True, index=True)
    journey_id = Column(Integer, ForeignKey("journeys.id"))
    vehicle_number = Column(String)
    driver_name = Column(String, nullable=True)
    start_time = Column(DateTime, default=datetime.utcnow)

# 17. Voice Logs Table
class VoiceLog(Base):
    __tablename__ = "voice_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    command_text = Column(Text)
    recognized_intent = Column(String)
    response_text = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

# 18. RAG Sources Table
class RAGSource(Base):
    __tablename__ = "rag_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    document_name = Column(String)
    last_indexed = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
