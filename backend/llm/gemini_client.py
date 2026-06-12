import os
import json
import logging
from typing import Optional, Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
USE_GEMINI = os.getenv("USE_GEMINI", "true").lower() == "true"

# Configure Logging
logger = logging.getLogger("causalguard.gemini")

# Initialize Gemini SDK
if GEMINI_API_KEY and USE_GEMINI:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("Gemini SDK configured successfully.")
    except Exception as e:
        logger.error(f"Failed to configure Gemini SDK: {e}")

def get_rule_fallback(system_prompt: str, user_prompt: str) -> str:
    """
    Analyzes prompts to return structured, realistic agent outputs
    statically when LLM calls are disabled or fail.
    """
    user_lower = user_prompt.lower()
    system_lower = system_prompt.lower()

    # 1. Supervisor Agent Fallback
    if "supervisor" in system_lower:
        intent = "safe_route"
        agents = ["Safety Agent", "News Intelligence Agent", "RAG Knowledge Agent"]
        action = ["show_safe_route"]
        rec = "Take Route B (Safest Route) and notify your guardians."
        msg = "I have calculated safest routing options and pulled safety context."
        
        if "unsafe" in user_lower or "danger" in user_lower or "sos" in user_lower or "help" in user_lower:
            intent = "sos"
            agents = ["Emergency Agent", "Safety Agent", "RAG Knowledge Agent"]
            action = ["show_safe_route", "enable_guardian_tracking", "show_112_button"]
            rec = "Press the call 112 button immediately, start silent tracking, or board transit."
            msg = "Emergency status detected. Safety and Emergency agents have prepared help hotlines."
        elif "cab" in user_lower or "auto" in user_lower or "taxi" in user_lower:
            intent = "cab_safety"
            agents = ["Safety Agent", "Emergency Agent"]
            action = ["cab_safety_mode"]
            rec = "Input vehicle number and start Cab Safety monitoring mode."
            msg = "Cab safety monitoring requested. Ready to track ride."
        elif "health" in user_lower or "period" in user_lower or "pregnancy" in user_lower:
            intent = "health_mode"
            agents = ["Health Safety Agent", "Safety Agent"]
            action = ["health_safety_mode"]
            rec = "Enabling Health-Aware routing mode."
            msg = "Activated Health Safety mode overlays."

        return json.dumps({
            "intent": intent,
            "response_message": msg,
            "message": msg,
            "risk_score": 75 if intent == "sos" else 32,
            "risk_level": "High" if intent == "sos" else "Low",
            "recommended_action": rec,
            "actions": action,
            "agents_to_call": agents,
            "agents_used": agents,
            "explanation": "Safety overlays have re-weighted routing checks.",
            "missing_data_notes": []
        })

    # 2. Safety Agent Fallback
    elif "safety agent" in system_lower or "routing" in system_lower:
        risk_score = 32
        factors = ["Proximity to Deccan Police Station (0.15km)", "Well-Lit Commercial Street"]
        if "shortest" in user_lower:
            risk_score = 78
            factors = ["Low Street Lighting (+20%)", "Isolated Road Segment (+15%)", "Recent Crime Reports (+15%)"]

        return json.dumps({
            "route_id": "safest" if risk_score == 32 else "shortest",
            "risk_score": risk_score,
            "risk_level": "Low" if risk_score == 32 else "High",
            "factors": factors,
            "safest_alternative": "Route B (Safest Route)",
            "causal_explanation": "Route B is recommended because it utilizes active main streets and passes directly next to Deccan Police Station, reducing vulnerability.",
            "what_if_analysis": {
                "if_lighting_improved": "Risk drops by 15%",
                "if_patrols_active": "Risk drops by 20%"
            }
        })

    # 3. Emergency Agent Fallback
    elif "emergency agent" in system_lower or "sos" in system_lower:
        return json.dumps({
            "sos_active": True,
            "notified_guardians": ["Raj Sharma (Father)", "Emergency Services Desk"],
            "simulated_dispatch_id": "CG-SOS-991",
            "safe_word_matched": True if "activated" in user_lower else False,
            "fake_call_trigger": True if "fake" in user_lower else False,
            "recommended_action": "Tap tel:112 to connect immediately to dispatcher. Keep walking to commercial spaces."
        })

    # 4. Digital Safety Agent Fallback
    elif "digital safety" in system_lower or "harassment" in system_lower:
        category = "Safe"
        confidence = 0.95
        action = "None needed."
        exp = "The message appears to be safe and standard."

        if any(w in user_lower for w in ["kill", "hurt", "stalk", "sex", "bitch", "nude", "address", "track you"]):
            category = "Threatening" if "kill" in user_lower or "hurt" in user_lower else "Harassment"
            confidence = 0.89
            action = "Block the number immediately, take screenshots, save this log in the Evidence Locker, and report to cybercrime.gov.in."
            exp = "High threat indicators present. The sender is attempting to intimidate or track you, violating personal safety boundaries."

        return json.dumps({
            "category": category,
            "confidence_score": confidence,
            "explanation": exp,
            "suggested_action": action,
            "evidence_relevance": "High" if category != "Safe" else "Low"
        })

    # 5. Health Agent Fallback
    elif "health agent" in system_lower or "health safety" in system_lower:
        return json.dumps({
            "is_active": True,
            "routing_preference": "Prefer streets close to 24/7 clinics and pharmacies",
            "hospital_markers": [
                {"name": "Sahyadri Hospital", "lat": 18.5150, "lng": 73.8335},
                {"name": "Noble Pharmacy", "lat": 18.5280, "lng": 73.8490}
            ],
            "pregnancy_safety_notes": "Flatter main streets selected. Avoid unpaved paths.",
            "discomfort_safety_notes": "High coverage of active rest spots and public clinics."
        })

    # 6. News Intelligence Agent Fallback
    elif "news agent" in system_lower or "news intelligence" in system_lower:
        return json.dumps({
            "extracted_locations": ["Deccan Gymkhana", "Shivajinagar Crossing"],
            "caution_level": "Medium",
            "signals": [
                {"title": "Low lighting reported near Deccan stretch", "severity": "Medium", "lat": 18.5212, "lng": 73.8398},
                {"title": "Recent chain snatching near crossing", "severity": "High", "lat": 18.5265, "lng": 73.8432}
            ]
        })

    # 7. RAG Knowledge Agent Fallback
    elif "rag" in system_lower or "knowledge base" in system_lower:
        return json.dumps({
            "retrieved_context": "Under the POSH Act, women have the right to submit complaints to the Internal Complaints Committee (ICC) regarding workplace harassment. Dialing 112 connects directly to Indian Emergency Response desks.",
            "sources": ["legal_resources_india.md", "helpline_information.md"],
            "citations": ["Legal Safety Section 1", "Emergency Helpline Section 2"]
        })

    # Generic Fallback
    return json.dumps({
        "status": "success",
        "response_text": "Request processed successfully.",
        "intent": "unknown"
    })

def generate_agent_response(
    system_prompt: str,
    user_prompt: str,
    context: Optional[str] = None,
    json_mode: bool = True
) -> Dict[str, Any]:
    """
    Queries Gemini 2.5 Flash using structured prompts.
    Falls back to deterministic rule-based JSON output on error or missing keys.
    """
    if not GEMINI_API_KEY or not USE_GEMINI:
        logger.warning("Gemini API key missing or disabled. Using rule-based fallback.")
        fallback_json = get_rule_fallback(system_prompt, user_prompt)
        return json.loads(fallback_json)

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_prompt
        )
        
        prompt = user_prompt
        if context:
            prompt = f"Context Guidelines:\n{context}\n\nUser Message:\n{user_prompt}"

        # Request parameters
        config = {}
        if json_mode:
            config["response_mime_type"] = "application/json"

        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(model.generate_content, prompt, generation_config=config)
            response = future.result(timeout=5.0)
        
        text_resp = response.text.strip()
        if json_mode:
            return json.loads(text_resp)
        return {"response": text_resp}

    except Exception as e:
        logger.error(f"Gemini API call failed or timed out: {e}. Falling back to rule-based parser.")
        fallback_json = get_rule_fallback(system_prompt, user_prompt)
        return json.loads(fallback_json)
