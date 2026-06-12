# CausalGuard: Women-First AI Safety & Well-Being Companion

CausalGuard is a privacy-preserving, voice-first proactive safety companion designed to protect women in physical commutes, vehicle transit, digital interactions, and wellness tracking. 

It stands as a prevention-first, consent-based utility, rejecting the simplistic "SOS-only" standard in favor of real-time causal risk prediction, multilingual voice command routing, local evidence logging, and voice-based stress analysis.

---

## Root Architecture

```
CausalGuard/
├── backend/                  # FastAPI Python Application
│   ├── main.py               # API Entry Point & CORS Setup
│   ├── database.py           # SQLite Database Connection & SQLAlchemy Models
│   ├── auth.py               # JWT Encryption & Password Hashing
│   ├── verification.py       # Simulated Government ID KYC Verifier
│   ├── route_risk.py         # Route Risk Evaluation Engine
│   ├── explanation_engine.py # Causal Explanation Generator
│   ├── voice_assistant.py     # Multilingual Intent Classification (8 Languages)
│   ├── voice_risk_analysis.py# Voice stress, anxiety, and fear analyzer
│   ├── sos.py                # Alarms, SOS & Response checks
│   ├── guardians.py          # Guardian Links & Consent Controls
│   ├── journey.py            # Commute GPS tracking & OSRM Routing
│   ├── cab_safety.py         # Auto & Cab Deviation Alarms using polyline geometry
│   ├── health_safety.py      # Health indicators & Clinic Proximity weighting
│   ├── digital_safety.py     # Harassment Lexical checking
│   ├── harassment_detection.py# Gemini-enhanced digital safety analyzer
│   ├── evidence_locker.py    # Consent-locked local asset storage
│   ├── privacy.py            # Purge requests & settings
│   └── feedback_learning.py  # Post-journey updates & Federated simulation
├── frontend/                 # Vite React SPA (TypeScript + Tailwind CSS + Leaflet.js)
│   ├── src/
│   │   ├── api/              # Unified API Client Client-side wrappers
│   │   ├── services/         # Speech synthesis/recognition & GPS Location services
│   │   │   ├── locationService.ts
│   │   │   └── speechService.ts
│   │   ├── pages/            # Dashboard panels & safety modes
│   │   ├── App.tsx           # Router, Modal layers, & Emergency Banners
│   │   ├── main.tsx          # Render Init
│   │   └── index.css         # Tailwind directives & Custom Dark Leaflet filters
│   ├── tailwind.config.js    # Premium visual themes configuration
│   ├── vite.config.ts        # Vite Server settings
│   ├── package.json          # Dependency packages
│   └── index.html            # Main markup and Leaflet css link
├── requirements.txt          # Python dependencies
└── README.md                 # Project Setup & Documentation
```

---

## Setup & Running Locally

### Security First: Environment Configuration
CausalGuard strictly isolates private credentials from source repositories. 
1. Copy the `.env.example` template to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your private API keys:
   - `GEMINI_API_KEY`: Generates supervisor intents, voice emotions, and digital harassment classifications.
   - `NEWS_API_KEY`: Feeds real India-centric safety and curfew caution flags from NewsAPI.org.
   - Ensure `USE_OSRM=true` and `USE_NEWS_API=true` are set to enable live routing and news APIs.
   - **Never commit `.env` to public version controls.**

### Backend Setup (FastAPI)
1. Initialize python virtual environment and install dependencies:
   ```bash
   # Initialize Virtual Environment
   python -m venv venv
   
   # Activate Virtual Environment (Windows)
   venv\Scripts\activate
   
   # Install Required Packages
   pip install -r requirements.txt
   ```
2. Launch the FastAPI Uvicorn Server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
   *The backend will boot on http://localhost:8000. Swagger docs are available on http://localhost:8000/docs.*

### Frontend Setup (Vite React SPA)
1. In the root directory, navigate to `frontend`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The SPA client will load on http://localhost:5173.*

---

## Action-First Multi-Agent & RAG Architecture
CausalGuard is optimized for speed and reliability in critical moments:
- **Router-based Intent Classification:** Centralized intent determination skips slow linear pipelines. Emergencies run instantaneously without blocking.
- **Embedded RAG Layer:** LlamaIndex vector queries are processed silently inside Emergency, News, and Support routers rather than appearing as confusing standalone pages.
- **Acoustic Stress Analysis:** `/api/voice/risk-analysis` uses Gemini or keyword matching to score fear, stress, and anxiety in spoken clips, prompting safety checks when thresholds are crossed.
- **Dynamic Polyline Deviations:** Cab safety monitors actual OSRM driving polylines. If the user drifts >500 meters off-course, a safety verification check triggers.

---

## Hackathon Demo Flow Script

1. **KYC check:** Log in as a **Woman User**. Go to the dashboard, click **Simulate Verification** to verify government KYC format checks.
2. **Safe Journey Plan:** Open **Plan Safe Commute**. Click **Use Current Location** to query browser Geolocation GPS. Enter destination "Deccan Gymkhana" and proceed.
3. **Route Risk Assessment:** Leaflet renders Safest (Route B) vs Shortest (Route A) routes using live **OSRM public routing** API geometry. Real-time **News API** curation marks safety cautions on the map.
4. **Voice Safety Monitor:** Turn on **Voice Safety Monitor** during commute. Every 45s, a voice check prompts. Say *"I feel unsafe, someone is following me"*. CausalGuard's voice risk engine registers high fear/stress, prompting the *"Are you safe?"* modal.
5. **SOS Alerting:** Click "Trigger SOS" or let the timer expire. SOS queries browser GPS, sends notifications to the dispatcher, logs active coordinates, and renders an active alerts card on the simulated **Police Dashboard** tab. Generates pre-filled SMS intents and maps links.
6. **Cab Deviation Simulation:** Open **Cab Safety Mode**, start monitoring, and click **Simulate Deviation (Demo)**. The system moves coordinates >500m off the active OSRM geometry and triggers a route deviation check alarm.
7. **Evidence & Feedback:** View stored ride details in the **Evidence Locker**. End the journey and submit route feedback. Community signals update with real-time statistics.
8. **Multi-Agent AI Trace:** Click **Judge AI Trace** button at the dashboard bottom to trace node routing logs and supervisor JSON outputs.
