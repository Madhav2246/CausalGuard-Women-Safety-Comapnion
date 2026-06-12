import os
import sys
from datetime import datetime, timedelta

# Add parent directory to sys.path to allow absolute imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import init_db, SessionLocal, User, NewsAlert, RAGSource, PrivacySetting
from backend.auth import get_password_hash

def seed_database():
    db = SessionLocal()
    try:
        # 1. Create tables
        print("Initializing CausalGuard database tables...")
        init_db()

        # 2. Seed default users
        print("Checking default users...")
        # Demo Woman User
        woman = db.query(User).filter(User.email == "anya@mail.com").first()
        if not woman:
            hashed_pw = get_password_hash("password123")
            woman = User(
                name="Anya Sharma",
                age=22,
                phone_number="9876543210",
                email="anya@mail.com",
                hashed_password=hashed_pw,
                gender_declaration="Woman",
                gov_id_type="Aadhaar",
                gov_id_number="123456789012",
                emergency_contact="9999888877",
                preferred_language="English",
                role="Woman",
                verification_status="Verified",
                consent_preferences="{}"
            )
            db.add(woman)
            db.commit()
            db.refresh(woman)
            print("Seeded default woman user: anya@mail.com / password123")

            # Create default privacy settings for woman
            privacy = PrivacySetting(
                user_id=woman.id,
                share_sos_only=True,
                enable_safe_word=True,
                safe_word="ACTIVATED",
                enable_health_routing=False,
                enable_news_caution=True,
                store_evidence_locally_only=True,
                anonymize_feedback_learning=True
            )
            db.add(privacy)
            db.commit()

        # Demo Guardian User
        guardian = db.query(User).filter(User.email == "guardian@mail.com").first()
        if not guardian:
            hashed_pw = get_password_hash("password123")
            guardian = User(
                name="Raj Sharma",
                age=45,
                phone_number="9999888877",
                email="guardian@mail.com",
                hashed_password=hashed_pw,
                gender_declaration="Male",
                gov_id_type="N/A",
                gov_id_number="N/A",
                emergency_contact="N/A",
                preferred_language="English",
                role="Guardian",
                verification_status="Verified",
                consent_preferences="{}"
            )
            db.add(guardian)
            db.commit()
            print("Seeded default guardian user: guardian@mail.com / password123")

        # Demo Police/Dispatcher User
        dispatcher = db.query(User).filter(User.email == "dispatcher@mail.com").first()
        if not dispatcher:
            hashed_pw = get_password_hash("password123")
            dispatcher = User(
                name="Pune Police Dispatcher",
                age=35,
                phone_number="1120000000",
                email="dispatcher@mail.com",
                hashed_password=hashed_pw,
                gender_declaration="Male",
                gov_id_type="N/A",
                gov_id_number="N/A",
                emergency_contact="N/A",
                preferred_language="English",
                role="Police",
                verification_status="Verified",
                consent_preferences="{}"
            )
            db.add(dispatcher)
            db.commit()
            print("Seeded default police dispatcher user: dispatcher@mail.com / password123")

        # 3. Seed news caution signals
        print("Checking default news alerts...")
        if db.query(NewsAlert).count() == 0:
            alerts = [
                NewsAlert(
                    title="Low street lighting and route isolation reported near Deccan underpass stretch.",
                    location="Deccan Underpass",
                    severity="Medium",
                    lat=18.5212,
                    lng=73.8398,
                    timestamp=datetime.utcnow() - timedelta(hours=2)
                ),
                NewsAlert(
                    title="Police patrol alert: Recent chain snatching incident near Shivajinagar crossing.",
                    location="Shivajinagar Crossing",
                    severity="High",
                    lat=18.5265,
                    lng=73.8432,
                    timestamp=datetime.utcnow() - timedelta(hours=4)
                ),
                NewsAlert(
                    title="Minor pickpocketing and heavy festive crowding reported near Lakshmi Road shopping block.",
                    location="Lakshmi Road",
                    severity="Low",
                    lat=18.5140,
                    lng=73.8560,
                    timestamp=datetime.utcnow() - timedelta(hours=6)
                )
            ]
            db.bulk_save_objects(alerts)
            db.commit()
            print("Seeded default news alerts.")

        # 4. Seed RAG Sources metadata
        print("Checking RAG sources...")
        if db.query(RAGSource).count() == 0:
            sources = [
                "women_safety_guidelines.md",
                "emergency_procedures_india.md",
                "cybercrime_reporting.md",
                "helpline_information.md",
                "legal_resources_india.md",
                "self_defense_awareness.md",
                "health_safety_resources.md",
                "campus_safety_policies.md",
                "privacy_and_consent_policy.md",
                "guardian_tracking_policy.md"
            ]
            for doc in sources:
                db.add(RAGSource(document_name=doc, last_indexed=datetime.utcnow()))
            db.commit()
            print("Seeded RAG source records.")

        print("CausalGuard database successfully initialized and seeded.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
