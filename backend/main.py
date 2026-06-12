import os
import sys
from typing import Optional, List
from pydantic import BaseModel
from fastapi import FastAPI, Request, Response, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

# Add the parent directory of 'backend' to sys.path so that 'backend.*' imports resolve
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import init_db, get_db
from backend.users import router as users_router
from backend.verification import router as verification_router
from backend.guardians import router as guardians_router
from backend.journey import router as journey_router
from backend.route_risk import router as route_risk_router
from backend.voice_assistant import router as voice_router
from backend.sos import router as sos_router
from backend.police_dashboard import router as police_router
from backend.news_intelligence import router as news_router
from backend.harassment_detection import router as harassment_router
from backend.health_safety import router as health_router
from backend.cab_safety import router as cab_router
from backend.emotional_safety import router as emotional_router
from backend.evidence_locker import router as evidence_router
from backend.privacy import router as privacy_router
from backend.feedback_learning import router as feedback_router

# Import new Agent & Voice modules
from backend.agents.rag_agent import init_rag_index
from backend.voice.stt import init_whisper, transcribe_audio
from backend.voice.tts import init_tts, generate_speech
from backend.agents.graph import compiled_graph

app = FastAPI(
    title="CausalGuard API",
    description="Women-First AI Safety & Well-Being Companion API Backend",
    version="1.0.0"
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # 1. Initialize SQLite Database Tables
    init_db()
    # 2. Ingest Guidelines into LlamaIndex
    init_rag_index()
    # 3. Pre-load Whisper / XTTS voice engines (gracefully fallback if missing)
    init_whisper()
    init_tts()

# Include Subsystem Routers
app.include_router(users_router)
app.include_router(verification_router)
app.include_router(guardians_router)
app.include_router(journey_router)
app.include_router(route_risk_router)
app.include_router(voice_router)
app.include_router(sos_router)
app.include_router(police_router)
app.include_router(news_router)
app.include_router(harassment_router)
app.include_router(health_router)
app.include_router(cab_router)
app.include_router(emotional_router)
app.include_router(evidence_router)
app.include_router(privacy_router)
app.include_router(feedback_router)

# ----------------- MULTI-AGENT & RAG SCHEMAS & ENDPOINTS -----------------

class AskRequest(BaseModel):
    message: str
    user_id: Optional[int] = None
    role: Optional[str] = "Woman"
    location: Optional[dict] = None
    destination: Optional[dict] = None

class RagQueryRequest(BaseModel):
    query: str

class SpeakRequest(BaseModel):
    text: str
    language: Optional[str] = "English"

class VoiceCommandReq(BaseModel):
    command: str
    language: Optional[str] = "English"

@app.get("/api/agents/status")
def get_agents_status():
    return {
        "status": "ready",
        "gemini_api": "enabled" if os.getenv("GEMINI_API_KEY") else "fallback-mode",
        "llama_index": "loaded",
        "whisper_stt": "fallback-mode",
        "xtts_tts": "fallback-mode",
        "agents": [
            "Supervisor Agent", 
            "Safety Agent", 
            "Emergency Agent", 
            "Digital Safety Agent", 
            "Health Safety Agent", 
            "News Intelligence Agent", 
            "RAG Knowledge Agent"
        ]
    }

@app.post("/api/agents/ask")
def ask_agents(req: AskRequest):
    inputs = {
        "message": req.message,
        "user_id": req.user_id or 1,
        "role": req.role or "Woman",
        "location": req.location,
        "destination": req.destination
    }
    try:
        # Run state machine
        state = compiled_graph.invoke(inputs)
        return {
            "message": state.get("final_response", ""),
            "risk_score": state.get("risk_score", 0),
            "risk_level": state.get("risk_level", "Low"),
            "recommended_action": state.get("recommended_action", ""),
            "actions": state.get("action", []),
            "agents_used": state.get("agent_outputs", {}).get("scheduled_agents", ["Supervisor Agent"]),
            "explanation": state.get("agent_outputs", {}).get("safety_agent", {}).get("causal_explanation", "No causal explanation generated."),
            "rag_context": state.get("rag_context", ""),
            "rag_sources": state.get("agent_outputs", {}).get("rag_agent", {}).get("sources", []),
            "agent_trace": state.get("agent_outputs", {}),
            "missing_data_notes": state.get("missing_data_notes", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph execution failed: {e}")

@app.post("/api/agents/voice-command")
def voice_command_agents(req: VoiceCommandReq):
    from backend.voice.intent_parser import parse_spoken_intent
    parsed = parse_spoken_intent(req.command)
    
    inputs = {
        "message": req.command,
        "role": "Woman"
    }
    state = compiled_graph.invoke(inputs)
    
    return {
        "transcription": req.command,
        "intent": parsed["intent"],
        "action_executed": parsed["action_executed"],
        "response_text": state.get("final_response") or parsed["response_text"],
        "data": parsed["data"],
        "graph_response": {
            "risk_score": state.get("risk_score", 0),
            "actions": state.get("action", []),
            "recommended_action": state.get("recommended_action", "")
        }
    }

@app.post("/api/rag/query")
def query_rag(req: RagQueryRequest):
    from backend.agents.rag_agent import run_rag_agent
    dummy_state = {
        "message": req.query,
        "agent_outputs": {}
    }
    res_state = run_rag_agent(dummy_state)
    rag_info = res_state["agent_outputs"].get("rag_agent", {})
    return {
        "response": res_state.get("rag_context", ""),
        "sources": rag_info.get("sources", []),
        "citations": rag_info.get("citations", [])
    }

@app.post("/api/rag/reindex")
def reindex_rag():
    init_rag_index()
    return {"status": "success", "message": "Knowledge base files successfully re-indexed."}

@app.get("/api/rag/sources")
def get_rag_sources(db: Session = Depends(get_db)):
    from backend.database import RAGSource
    sources = db.query(RAGSource).all()
    return {
        "sources": [s.document_name for s in sources],
        "last_indexed": [s.last_indexed.isoformat() for s in sources]
    }

@app.post("/api/voice/transcribe")
def transcribe_voice(file: UploadFile = File(...)):
    temp_path = "temp_voice_upload.wav"
    try:
        with open(temp_path, "wb") as buffer:
            buffer.write(file.file.read())
        res = transcribe_audio(temp_path)
        return res
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/api/voice/speak")
def speak_voice(req: SpeakRequest):
    temp_output = "temp_synthesis_output.wav"
    res = generate_speech(req.text, temp_output, req.language)
    return res

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "CausalGuard Multi-Agent Safety Companion Backend",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
