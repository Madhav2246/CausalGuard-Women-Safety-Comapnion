import os
import logging

logger = logging.getLogger("causalguard.tts")

# Global TTS instance
TTS_MODEL = None

def init_tts():
    global TTS_MODEL
    try:
        import importlib
        TTS = importlib.import_module("TTS.api").TTS
        logger.info("Loading XTTS model...")
        # Load small/fast model for demo
        TTS_MODEL = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")
        logger.info("XTTS v2 loaded successfully.")
    except Exception as e:
        logger.warning(f"XTTS v2 import or load failed: {e}. Fallback to client-side SpeechSynthesis enabled.")
        TTS_MODEL = None

def generate_speech(text: str, output_path: str = "temp_output.wav", language: str = "English") -> dict:
    """
    Synthesizes speech from text.
    If XTTS is not available, returns a status indicating fallback.
    """
    global TTS_MODEL
    if not TTS_MODEL:
        return {
            "status": "fallback",
            "audio_url": "",
            "message": "XTTS engine is disabled. Fallback to browser SpeechSynthesis."
        }
        
    try:
        # Match XTTS language codes
        lang_codes = {
            "English": "en",
            "Hindi": "hi",
            "Bengali": "bn",
            "Telugu": "te",
            "Tamil": "ta",
            "Marathi": "mr"
        }
        code = lang_codes.get(language, "en")
        
        # Synthesize using a placeholder speaker wav or clone
        # For safety/demo, we can just use default speaker settings
        TTS_MODEL.tts_to_file(
            text=text,
            speaker_wav="speaker_sample.wav", # Demo reference wav
            language=code,
            file_path=output_path
        )
        return {
            "status": "success",
            "audio_url": f"/api/voice/audio/{os.path.basename(output_path)}",
            "message": "XTTS synthesis succeeded."
        }
    except Exception as e:
        logger.error(f"XTTS synthesis crash: {e}")
        return {
            "status": "fallback",
            "audio_url": "",
            "message": f"XTTS error: {e}. Fallback to browser SpeechSynthesis."
        }
