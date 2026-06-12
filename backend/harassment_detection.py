from fastapi import APIRouter
from backend.schemas import HarassmentCheckRequest, HarassmentCheckResponse

router = APIRouter(prefix="/api/harassment", tags=["Digital Safety"])

THREAT_KEYWORDS = ["kill", "track you", "watch you", "where you live", "follow you", "hurt you", "ruin you"]
HARASSMENT_KEYWORDS = ["bitch", "sexy", "send pics", "nude", "whore", "creep", "stalk", "abusing", "harass", "abuse"]
SUSPICIOUS_KEYWORDS = ["alone", "meet me", "night", "where are you", "your number", "address", "unusual"]

@router.post("/check", response_model=HarassmentCheckResponse)
def check_message(request: HarassmentCheckRequest):
    text = request.text.strip().lower()
    
    if not text:
        return HarassmentCheckResponse(
            category="Safe",
            confidence_score=1.0,
            explanation="Empty input message evaluated.",
            suggested_action="No action needed."
        )

    threat_hits = sum(1 for w in THREAT_KEYWORDS if w in text)
    harass_hits = sum(1 for w in HARASSMENT_KEYWORDS if w in text)
    suspicious_hits = sum(1 for w in SUSPICIOUS_KEYWORDS if w in text)

    if threat_hits > 0:
        category = "Threatening"
        confidence = min(0.95, 0.75 + (0.1 * threat_hits))
        explanation = "High-risk indicators found: The message contains language suggesting direct physical threats, tracking, or harm."
        suggested_action = "Save screenshot evidence to Evidence Locker, block the contact, notify your trusted guardians, and report to the Cybercrime Helpline (1930) or cybercrime.gov.in."
    elif harass_hits > 0:
        category = "Harassment"
        confidence = min(0.92, 0.70 + (0.1 * harass_hits))
        explanation = "Explicit harassment indicators found: The message contains abusive, derogatory, or unsolicited explicit remarks."
        suggested_action = "Save evidence, restrict communication, block user, and consult the Support Center legal guidance panels."
    elif suspicious_hits > 0:
        category = "Suspicious"
        confidence = min(0.85, 0.50 + (0.15 * suspicious_hits))
        explanation = "Suspicious communication detected: The sender is requesting sensitive location details, meeting alone, or asking invasive personal questions."
        suggested_action = "Exercise caution. Do not share location details, phone numbers, or active travel coordinates. Keep details private."
    else:
        category = "Safe"
        confidence = 0.90
        explanation = "Normal conversational structure. No standard cyber harassment patterns or digital threat markers detected."
        suggested_action = "No immediate safety steps required. Continue using consent-based communication."

    return HarassmentCheckResponse(
        category=category,
        confidence_score=confidence,
        explanation=explanation,
        suggested_action=suggested_action
    )
