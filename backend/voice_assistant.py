from fastapi import APIRouter
from backend.schemas import VoiceCommandRequest, VoiceCommandResponse
from typing import Dict, Any

router = APIRouter(prefix="/api/voice", tags=["Voice Assistant"])

VOICE_INTENTS = {
    "sos": {
        "keywords": {
            "english": ["sos", "unsafe", "danger", "help", "emergency", "attack", "save me"],
            "hindi": ["बचाओ", "खतरा", "आपातकाल", "मदद", "असुरक्षित"],
            "telugu": ["కాపాడండి", "ప్రమాదం", "సహాయం", "అపాయం"],
            "tamil": ["காப்பாற்றுங்கள்", "ஆபத்து", "உதவி", "அவசரம்"],
            "kannada": ["ಉಳಿಸಿ", "ಅಪಾಯ", "ಸಹಾಯ", "ತುರ್ತು"],
            "malayalam": ["രക്ഷിക്കൂ", "അപകടം", "സഹായം", "അടിയന്തിരാവസ്ഥ"],
            "marathi": ["वाचवा", "धोका", "मदत", "असुरक्षित"],
            "bengali": ["বাঁচাও", "বিপদ", "সাহায্য", "জরুরি"]
        },
        "response": {
            "english": "Triggering SOS immediately. Alerting your trusted guardians and nearby response authorities.",
            "hindi": "एसओएस तुरंत सक्रिय किया जा रहा है। आपके अभिभावकों और पुलिस को सूचित किया जा रहा है।",
            "telugu": "వెంటనే ఎస్ఓఎస్ ప్రారంభించబడింది. మీ సంరక్షకులకు సమాచారం అందించబడుతోంది.",
            "tamil": "உடனடியாக எஸ்ఓエス தூண்டப்படுகிறது. உங்கள் பாதுகாவலர்களுக்கு தகவல் அனுப்பப்படுகிறது.",
            "kannada": "ತಕ್ಷಣವೇ ಎಸ್ಒಎಸ್ ಪ್ರಚೋದಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ರಕ್ಷಕರಿಗೆ ಸಂದೇಶ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ.",
            "malayalam": "ഉടൻ തന്നെ എസ്ഒഎസ് സന്ദേശം അയക്കുന്നു. നിങ്ങളുടെ രക്ഷാകർത്താക്കളെ അറിയിക്കുന്നു.",
            "marathi": "तातडीने एसओएस सक्रिय केला जात आहे. आपल्या पालकांना आणि पोलिसांना कळवले जात आहे.",
            "bengali": "অবিলম্বে এসওএস ট্রিগার করা হচ্ছে। আপনার অভিভাবকদের সতর্ক করা হচ্ছে।"
        }
    },
    "fake_call": {
        "keywords": {
            "english": ["fake call", "incoming call", "simulate call", "phone ring"],
            "hindi": ["फर्जी कॉल", "नकली कॉल", "कॉल मिलाओ", "फोन बजाओ"],
            "telugu": ["ఫేక్ కాల్", "कॉल सिमुलेट", "ఫోన్ రింగ్"],
            "tamil": ["போலி அழைப்பு", "ரிங் செய்"],
            "kannada": ["ಸುಳ್ಳು ಕರೆ", "ಫೋನ್ ಮಾಡಿ"],
            "malayalam": ["വ്യാജ കോൾ", "ഫോൺ ബെല്ലടിക്കുക"],
            "marathi": ["फेक कॉल", "नकली कॉल", "फोन वाजवा"],
            "bengali": ["ফেক কল", "মিথ্যে কল"]
        },
        "response": {
            "english": "Initiating a fake incoming call. Please prepare to answer.",
            "hindi": "नकली कॉल आ रही है। कृपया उत्तर देने के लिए तैयार रहें।",
            "telugu": "ఫేక్ కాల్ ప్రారంభించబడింది. మాట్లాడటానికి సిద్ధంగా ఉండండి.",
            "tamil": "போலி அழைப்பு வருகிறது. பதிலளிக்க தயாராகுங்கள்.",
            "kannada": "ಸುಳ್ಳು ಕರೆ ಬರುತ್ತಿದೆ. ಉತ್ತರಿಸಲು ಸಿದ್ಧರಾಗಿ.",
            "malayalam": "വ്യാജ കോൾ വരുന്നു. സംസാരിക്കാൻ തയ്യാറാകുക.",
            "marathi": "नकली कॉल येत आहे. कृपया बोलण्याची तयारी ठेवा.",
            "bengali": "ফেক কল শুরু হচ্ছে। কথা বলার জন্য তৈরি হোন।"
        }
    },
    "safe_route": {
        "keywords": {
            "english": ["route to", "safest route", "navigate", "find route", "safe route"],
            "hindi": ["सुरक्षित रास्ता", "मार्ग दिखाओ", "नेविगेट"],
            "telugu": ["సురక్షిత మార్గం", "దారి చూపించు"],
            "tamil": ["பாதுகாப்பான வழி", "பயணம் தொடங்கு"],
            "kannada": ["ಸುರಕ್ಷಿತ ಮಾರ್ಗ", "ದಾರಿ ತೋರಿಸು"],
            "malayalam": ["സുരക്ഷിത പാത", "വഴി കാണിക്കുക"],
            "marathi": ["सुरक्षित रस्ता", "मार्ग दाखवा"],
            "bengali": ["নিরাপদ পথ", "রাস্তা দেখাও"]
        },
        "response": {
            "english": "Calculating safest route options. Adjusting risk indicators.",
            "hindi": "सुरक्षित मार्ग की गणना की जा रही है। जोखिम कारकों का विश्लेषण चालू है।",
            "telugu": "సురక్షితమైన మార్గాలను లెక్కిస్తున్నాము.",
            "tamil": "பாதுகாப்பான பாதைகளை கணக்கிடுகிறோம்.",
            "kannada": "ಸುರಕ್ಷಿತ ಮಾರ್ಗವನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ.",
            "malayalam": "സുരക്ഷിത പാത കണ്ടെത്തുന്നു.",
            "marathi": "सुरक्षित मार्गाचे नियोजन केले जात आहे.",
            "bengali": "সবচেয়ে নিরাপদ পথ খোঁজা হচ্ছে।"
        }
    },
    "cab_safety": {
        "keywords": {
            "english": ["cab safety", "track my cab", "track auto", "auto safety", "taxi safety"],
            "hindi": ["कैब सुरक्षा", "ऑटो ट्रैक", "टैक्सी सुरक्षा", "गाड़ी ट्रैक"],
            "telugu": ["క్యాబ్ సేఫ్టీ", "ఆటో ట్రాక్", "ట్యాక్సీ సేఫ్టీ"],
            "tamil": ["கேப் பாதுகாப்பு", "ஆட்டோ டிராக்கிங்"],
            "kannada": ["ಕ್ಯಾಬ್ ಸುರಕ್ಷತೆ", "ಆಟೋ ಟ್ರ್ಯಾಕ್"],
            "malayalam": ["ക്യാബ് സുരക്ഷ", "ഓട്ടോ ട്രാക്കിങ്"],
            "marathi": ["कॅब सुरक्षा", "ऑटो ट्रॅक"],
            "bengali": ["ক্যাব নিরাপত্তা", "অটো ট্র্যাক"]
        },
        "response": {
            "english": "Cab safety monitoring mode is active. Please enter your vehicle registration number.",
            "hindi": "कैब सुरक्षा मोड सक्रिय है। कृपया अपना वाहन नंबर दर्ज करें।",
            "telugu": "క్యాబ్ భద్రతా మోడ్ సక్రియంగా ఉంది. దయచేసి వాహనం నంబర్ నమోదు చేయండి.",
            "tamil": "கேப் பாதுகாப்பு கண்காணிப்பு முறை செயலில் உள்ளது. வாகன எண்ணை உள்ளிடவும்.",
            "kannada": "ಕ್ಯಾಬ್ ಸುರಕ್ಷತಾ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ. ವಾಹನದ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
            "malayalam": "ക്യാബ് സുരക്ഷാ മോഡ് സജീവമാണ്. ദയവായി വാഹന നമ്പർ നൽകുക.",
            "marathi": "कॅब सुरक्षा मोड सक्रिय आहे. कृपया वाहन क्रमांक प्रविष्ट करा.",
            "bengali": "ক্যাব নিরাপত্তা মোড সক্রিয়। অনুগ্রহ করে গাড়ির নম্বর দিন।"
        }
    },
    "health_mode": {
        "keywords": {
            "english": ["health mode", "period mode", "hospital clinic", "pregnancy safety", "medical help"],
            "hindi": ["स्वास्थ्य मोड", "पीरियड", "अस्पताल दिखाओ", "गर्भावस्था सुरक्षा"],
            "telugu": ["హెల్త్ మోడ్", "ఆసుపత్రి", "గర్భధారణ రక్షణ"],
            "tamil": ["சுகாதார முறை", "மருத்துவமனை எங்கே", "கர்ப்பகால பாதுகாப்பு"],
            "kannada": ["ಆರೋಗ್ಯ ಮೋಡ್", "ಆಸ್ಪತ್ರೆ ಎಲ್ಲಿದೆ"],
            "malayalam": ["ಆರೋಗ್ಯ മോഡ്", "ആശുപത്രി എവിടെയാണ്"],
            "marathi": ["आरोग्य मोड", "हॉस्पिटल दाखवा", "गर्भावस्थेतील सुरक्षा"],
            "bengali": ["স্বাস্থ্য মোড", "হাসপাতাল দেখাও"]
        },
        "response": {
            "english": "Health-aware safety mode enabled. Preferring routing near pharmacies and medical facilities.",
            "hindi": "स्वास्थ्य-सजग सुरक्षा मोड सक्षम है। फार्मेसियों और अस्पतालों के पास के रास्तों को प्राथमिकता दी जा रही है।",
            "telugu": "హెల్త్ సేఫ్టీ మోడ్ సక్రియం చేయబడింది. ఆసుపత్రులు మరియు ఫార్మసీల సమీప మార్గాలకు ప్రాధాన్యత ఇవ్వబడుతుంది.",
            "tamil": "சுகாதார பாதுகாப்பு முறை செயல்படுத்தப்பட்டது. மருந்தகங்கள் மற்றும் மருத்துவமனைகள் அருகிலுள்ள பாதைகளுக்கு முன்னுரிமை அளிக்கப்படுகிறது.",
            "kannada": "ಆರೋಗ್ಯ ರಕ್ಷಣಾ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ. ಆಸ್ಪತ್ರೆ ಮತ್ತು ಫಾರ್ಮಸಿ ಹತ್ತಿರವಿರುವ ದಾರಿಗೆ ಆದ್ಯತೆ ನೀಡಲಾಗುತ್ತದೆ.",
            "malayalam": "ആರോഗ്യ സുരക്ഷാ മോഡ് സജീവമാക്കി. ആശുപത്രികൾക്ക് സമീപമുള്ള വഴികൾ മുൻഗണന നൽകുന്നു.",
            "marathi": "आरोग्य-जागरूक सुरक्षा मोड सक्षम केला आहे. फार्मसी आणि रुग्णालयांच्या जवळील मार्गांना प्राधान्य दिले जाईल.",
            "bengali": "স্বাস্থ্য সুরক্ষা মোড সক্রিয় হয়েছে। ওষুধ দোকান ও হাসপাতালের কাছের পথকে প্রাধান্য দেওয়া হচ্ছে।"
        }
    }
}

@router.post("/command", response_model=VoiceCommandResponse)
def parse_voice_command(request: VoiceCommandRequest):
    cmd = request.command.strip().lower()
    user_lang = request.language.strip().lower() if request.language else "english"
    
    matched_intent = "unknown"
    action_executed = "No action matched. Defaulting to voice assistant query."
    response_text = "I didn't quite catch that. Try saying 'Send SOS', 'Start fake call', 'Start safe route' or 'Enable health mode'."
    
    lang_translations = {
        "hindi": "मुझे समझ नहीं आया। कृपया 'एसओएस भेजें', 'नकली कॉल शुरू करें' या 'स्वास्थ्य मोड' कहें।",
        "telugu": "నాకు అర్థం కాలేదు. దయచేసి 'SOS పంపండి', 'ఫేక్ కాల్ ప్రారంభించండి' అని చెప్పండి.",
        "tamil": "எனக்கு புரியவில்லை. 'எஸ்ஓஎஸ் அனுப்பு', 'போலி அழைப்பு செய்' என்று கூறவும்.",
        "kannada": "ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು 'ಎಸ್ಒಎಸ್ ಕಳುಹಿಸಿ' ಅಥವಾ 'ಸುಳ್ಳು ಕರೆ ಮಾಡಿ' ಎಂದು ಹೇಳಿ.",
        "malayalam": "എനിക്ക് മനസ്സിലായില്ല. ദയവായി 'എസ്ഒഎസ് അയക്കുക' അല്ലെങ്കിൽ 'വ്യാജ കോൾ ചെയ്യുക' എന്ന് പറയുക.",
        "marathi": "मला समजले नाही. कृपया 'एसओएस पाठवा', 'फेक कॉल सुरू करा' किंवा 'आरोग्य मोड' म्हणा.",
        "bengali": "আমি বুঝতে পারিনি। অনুগ্রহ করে 'এসওএস পাঠান' বা 'ফেক কল করুন' বলুন।"
    }
    
    if user_lang in lang_translations:
        response_text = lang_translations[user_lang]

    for intent_name, intent_data in VOICE_INTENTS.items():
        for lang, words in intent_data["keywords"].items():
            for word in words:
                if word in cmd:
                    matched_intent = intent_name
                    lang_key = user_lang if user_lang in intent_data["response"] else "english"
                    response_text = intent_data["response"][lang_key]
                    
                    if intent_name == "sos":
                        action_executed = "Triggered emergency SOS routing."
                    elif intent_name == "fake_call":
                        action_executed = "Opened fake call interface."
                    elif intent_name == "safe_route":
                        action_executed = "Opened safe route planner."
                    elif intent_name == "cab_safety":
                        action_executed = "Switched to Cab Tracking panel."
                    elif intent_name == "health_mode":
                        action_executed = "Activated Health-Aware safety overlay."
                    break
            if matched_intent != "unknown":
                break
        if matched_intent != "unknown":
            break

    data_payload = {}
    if matched_intent == "safe_route":
        if "home" in cmd or "घर" in cmd or "ఇల్లు" in cmd or "வீடு" in cmd:
            data_payload["destination"] = "Home"
        else:
            data_payload["destination"] = "Deccan Gymkhana"

    return VoiceCommandResponse(
        intent=matched_intent,
        action_executed=action_executed,
        response_text=response_text,
        data=data_payload if data_payload else None
    )
