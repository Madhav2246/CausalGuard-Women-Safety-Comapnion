import os
import logging

logger = logging.getLogger("causalguard.stt")

# Global model instance
WHISPER_MODEL = None

def init_whisper():
    global WHISPER_MODEL
    try:
        import importlib
        whisper = importlib.import_module("whisper")
        logger.info("Loading Whisper model...")
        WHISPER_MODEL = whisper.load_model("base")
        logger.info("Whisper model loaded successfully.")
    except Exception as e:
        logger.warning(f"Whisper STT import or load failed: {e}. Fallback to client-side STT enabled.")
        WHISPER_MODEL = None

def transcribe_audio(audio_file_path: str, language: str = "English") -> dict:
    """
    Transcribes audio files.
    If Whisper is not installed or available, returns a status indicating fallback.
    """
    global WHISPER_MODEL
    if not WHISPER_MODEL:
        return {
            "status": "fallback",
            "transcription": "",
            "message": "Whisper STT is disabled or not installed. Falling back to browser SpeechRecognition."
        }
        
    try:
        if not os.path.exists(audio_file_path):
            return {"status": "error", "transcription": "", "message": f"Audio file not found at {audio_file_path}"}
            
        # Run transcription
        result = WHISPER_MODEL.transcribe(audio_file_path)
        return {
            "status": "success",
            "transcription": result.get("text", "").strip(),
            "message": "Transcription succeeded."
        }
    except Exception as e:
        logger.error(f"Whisper transcription crash: {e}")
        return {
            "status": "fallback",
            "transcription": "",
            "message": f"Local STT error: {e}. Fallback to browser SpeechRecognition."
        }
