from typing import Dict, Any

VOICE_COMMAND_MAPPING = {
    "sos": ["sos", "unsafe", "danger", "help", "emergency", "attack", "save me", "बचाओ", "खतरा", "காப்பாற்றுங்கள்", "உதவி", "కాపాడండి", "രക്ഷിക്കൂ", "वाचवा"],
    "fake_call": ["fake call", "incoming call", "simulate call", "phone ring", "फर्जी कॉल", "नकली कॉल", "போலி அழைப்பு", "ఫేక్ కాల్", "ವ್ಯಾജ ಕೋಲ್"],
    "safe_route": ["route to", "safest route", "navigate", "find route", "safe route", "सुरक्षित रास्ता", "मार्ग दिखाओ", "பயணம்", "సురక్షిత మార్గం"],
    "cab_safety": ["cab safety", "track my cab", "track auto", "auto safety", "taxi safety", "ऑटो ट्रैक", "टैक्सी", "క్యాబ్ సేఫ్టీ", "கேப்"],
    "health_mode": ["health mode", "period", "hospital", "pharmacy", "clinic", "pregnancy", "medical", "स्वास्थ्य", "अस्पताल", "மருத்துவமனை", "ఆసుపత్రి", "ആശുപത്രി"]
}

def parse_spoken_intent(command_text: str) -> Dict[str, Any]:
    text_lower = command_text.lower().strip()
    
    for intent, keywords in VOICE_COMMAND_MAPPING.items():
        for kw in keywords:
            if kw in text_lower:
                action_text = f"Activated {intent} action panel."
                ui_action = f"show_{intent}"
                if intent == "safe_route":
                    ui_action = "show_safe_route"
                elif intent == "cab_safety":
                    ui_action = "cab_safety_mode"
                elif intent == "health_mode":
                    ui_action = "health_safety_mode"
                elif intent == "sos":
                    ui_action = "trigger_sos"
                elif intent == "fake_call":
                    ui_action = "trigger_fake_call"
                    
                return {
                    "intent": intent,
                    "action_executed": action_text,
                    "response_text": f"Command matched: Opening {intent} settings.",
                    "data": {"command": text_lower, "ui_action": ui_action}
                }
                
    return {
        "intent": "unknown",
        "action_executed": "No specific command matched.",
        "response_text": "I didn't quite catch that. Try saying 'Send SOS', 'Start fake call', or 'Start safe route'.",
        "data": {}
    }
