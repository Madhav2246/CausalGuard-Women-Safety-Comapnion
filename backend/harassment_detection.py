from fastapi import APIRouter
from backend.schemas import HarassmentCheckRequest, HarassmentCheckResponse
import os
import json
import concurrent.futures
from backend.llm.gemini_client import generate_agent_response

router = APIRouter(prefix="/api/harassment", tags=["Digital Safety"])

THREAT_KEYWORDS = ["kill", "track you", "watch you", "where you live", "follow you", "hurt you", "ruin you"]
HARASSMENT_KEYWORDS = ["bitch", "sexy", "send pics", "nude", "whore", "creep", "stalk", "abusing", "harass", "abuse"]
SUSPICIOUS_KEYWORDS = ["alone", "meet me", "night", "where are you", "your number", "address", "unusual"]

HARASSMENT_SYSTEM_PROMPT = """
You are a Digital Safety Analyst for CausalGuard.
Classify the given message text into one of these categories:
- 'Safe' (normal conversation, no threats)
- 'Suspicious' (invasive questions, asking for location/number, meeting alone)
- 'Harassment' (explicit, abusive, offensive, derogatory words)
- 'Threatening' (physical harm, stalking, tracking, intimidation)

Also provide a confidence_score (float, 0-1) representing your certainty.
Provide a clear explanation of why this classification was made, and a suggested_action for the user.

Return EXACTLY a JSON object matching this schema:
{
  "category": "Safe" | "Suspicious" | "Harassment" | "Threatening",
  "confidence_score": 0.95,
  "explanation": "Reasoning...",
  "suggested_action": "Action steps..."
}
"""

@router.post("/check", response_model=HarassmentCheckResponse)
def check_message(request: HarassmentCheckRequest):
    text = request.text.strip()
    
    if not text:
        return HarassmentCheckResponse(
            category="Safe",
            confidence_score=1.0,
            explanation="Empty input message evaluated.",
            suggested_action="No action needed.",
            analysis_method="keyword_fallback"
        )

    # 1. Try Gemini classifier first with 4-second timeout
    gemini_key = os.getenv("GEMINI_API_KEY")
    use_gemini = os.getenv("USE_GEMINI", "true").lower() == "true"
    
    if gemini_key and use_gemini:
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(
                    generate_agent_response,
                    system_prompt=HARASSMENT_SYSTEM_PROMPT,
                    user_prompt=f"Analyze this message: '{text}'",
                    json_mode=True
                )
                res = future.result(timeout=4.0)
                
            return HarassmentCheckResponse(
                category=res.get("category", "Safe"),
                confidence_score=res.get("confidence_score", 0.9),
                explanation=res.get("explanation", "Analyzed using Gemini safety models."),
                suggested_action=res.get("suggested_action", "No immediate safety steps needed."),
                analysis_method="gemini"
            )
        except Exception:
            pass

    # 2. Rule-based / Keyword fallback
    text_lower = text.lower()
    threat_hits = sum(1 for w in THREAT_KEYWORDS if w in text_lower)
    harass_hits = sum(1 for w in HARASSMENT_KEYWORDS if w in text_lower)
    suspicious_hits = sum(1 for w in SUSPICIOUS_KEYWORDS if w in text_lower)

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
        suggested_action=suggested_action,
        analysis_method="keyword_fallback"
    )
