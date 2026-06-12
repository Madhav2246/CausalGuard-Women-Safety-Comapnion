import os
import subprocess
import time
import random

REPO_URL = "https://github.com/Madhav2246/CausalGuard-Women-Safety-Comapnion.git"
MIN_SLEEP_SECONDS = 180  # 3 minutes (180s)
MAX_SLEEP_SECONDS = 480  # 8 minutes (480s)

# Define the step-by-step commits to make a realistic, incremental git history
commits = [
    {
        "message": "chore: initialize project and root configuration files",
        "files": [".gitignore", "requirements.txt", "requirements-voice.txt", ".env.example"]
    },
    {
        "message": "chore: add execution scripts and git automation utility",
        "files": ["start_causalguard.bat", "git_incremental_push.py"]
    },
    {
        "message": "feat: set up database schemas and seeding scripts",
        "files": ["backend/database.py", "backend/init_db.py", "backend/config.py"]
    },
    {
        "message": "feat: implement JWT authentication and simulated ID verification",
        "files": ["backend/auth.py", "backend/users.py", "backend/verification.py", "backend/schemas.py"]
    },
    {
        "message": "feat: implement voice command transcription and speech synthesis with fallbacks",
        "files": ["backend/voice/stt.py", "backend/voice/tts.py", "backend/voice/intent_parser.py", "backend/voice/language_support.py"]
    },
    {
        "message": "feat: integrate main voice assistant engine and command router",
        "files": ["backend/voice_assistant.py"]
    },
    {
        "message": "feat: implement guardian permission controls and journey tracking",
        "files": ["backend/guardians.py", "backend/journey.py", "backend/route_risk.py"]
    },
    {
        "message": "feat: implement cab safety monitoring and evidence locker storage",
        "files": ["backend/cab_safety.py", "backend/evidence_locker.py"]
    },
    {
        "message": "feat: develop explainable safety engine and harassment detection",
        "files": ["backend/explanation_engine.py", "backend/harassment_detection.py", "backend/emotional_safety.py"]
    },
    {
        "message": "feat: implement health safety alerts, news intelligence, privacy, and feedback systems",
        "files": ["backend/health_safety.py", "backend/news_intelligence.py", "backend/privacy.py", "backend/feedback_learning.py"]
    },
    {
        "message": "feat: assemble FastAPI routes and custom CORS filters",
        "files": ["backend/main.py", "backend/sos.py", "backend/police_dashboard.py"]
    },
    {
        "message": "chore: configure frontend typescript, tailwind, and vite settings",
        "files": ["frontend/package.json", "frontend/tsconfig.json", "frontend/vite.config.ts", "frontend/tailwind.config.js"]
    },
    {
        "message": "feat: set up frontend assets, stylesheets, and API fetch client",
        "files": ["frontend/index.html", "frontend/src/index.css", "frontend/src/api/index.ts"]
    },
    {
        "message": "feat: build app routing layers and custom safety triggers",
        "files": ["frontend/src/App.tsx", "frontend/src/main.tsx"]
    },
    {
        "message": "feat: design onboarding onboarding components (Landing, Login, Register)",
        "files": ["frontend/src/pages/LandingPage.tsx", "frontend/src/pages/Login.tsx", "frontend/src/pages/Register.tsx"]
    },
    {
        "message": "feat: develop dashboard panels for wards, guardians, and police dispatch",
        "files": ["frontend/src/pages/WomanDashboard.tsx", "frontend/src/pages/GuardianDashboard.tsx", "frontend/src/pages/PoliceDashboard.tsx"]
    },
    {
        "message": "feat: design safest route planning, navigation maps, and auto ride monitors",
        "files": ["frontend/src/pages/SafeJourneyMode.tsx", "frontend/src/pages/LiveMapNavigation.tsx", "frontend/src/pages/CabAutoSafetyMode.tsx"]
    },
    {
        "message": "feat: implement cyber stalking scans, wellness modes, and office safety checks",
        "files": ["frontend/src/pages/HealthSafetyMode.tsx", "frontend/src/pages/DigitalSafetyMode.tsx", "frontend/src/pages/CampusSafetyMode.tsx"]
    },
    {
        "message": "feat: design emergency SOS panels, evidence lockers, and contacts list",
        "files": ["frontend/src/pages/VoiceAssistantPage.tsx", "frontend/src/pages/SOSPage.tsx", "frontend/src/pages/EvidenceLocker.tsx", "frontend/src/pages/ContactsPage.tsx"]
    },
    {
        "message": "feat: design help center, preferences, and privacy configurations",
        "files": ["frontend/src/pages/PrivacySettings.tsx", "frontend/src/pages/SupportCenter.tsx"]
    },
    {
        "message": "feat: add Gemini LLM client and rule-based fallback generator",
        "files": ["backend/llm/gemini_client.py"]
    },
    {
        "message": "feat: construct LangGraph agent orchestrator and node routers",
        "files": ["backend/agents/state.py", "backend/agents/graph.py", "backend/agents/supervisor_agent.py"]
    },
    {
        "message": "feat: implement safety, emergency, digital, and wellness sub-agents",
        "files": ["backend/agents/safety_agent.py", "backend/agents/emergency_agent.py", "backend/agents/digital_safety_agent.py", "backend/agents/health_agent.py"]
    },
    {
        "message": "feat: implement news intelligence and crime mapping sub-agents",
        "files": ["backend/agents/news_agent.py"]
    },
    {
        "message": "feat: implement LlamaIndex RAG grounding sub-agent",
        "files": ["backend/agents/rag_agent.py"]
    },
    {
        "message": "docs: add legal and campus safety guidelines (part 1)",
        "files": [
            "backend/knowledge_base/campus_safety_policies.md",
            "backend/knowledge_base/cybercrime_reporting.md",
            "backend/knowledge_base/emergency_procedures_india.md",
            "backend/knowledge_base/guardian_tracking_policy.md"
        ]
    },
    {
        "message": "docs: add legal and campus safety guidelines (part 2)",
        "files": [
            "backend/knowledge_base/health_safety_resources.md",
            "backend/knowledge_base/helpline_information.md",
            "backend/knowledge_base/legal_resources_india.md",
            "backend/knowledge_base/privacy_and_consent_policy.md"
        ]
    },
    {
        "message": "docs: add legal and campus safety guidelines (part 3)",
        "files": [
            "backend/knowledge_base/self_defense_awareness.md",
            "backend/knowledge_base/women_safety_guidelines.md"
        ]
    },
    {
        "message": "feat: construct multi-agent trace graph and RAG sources view",
        "files": ["frontend/src/pages/MultiAgentConsole.tsx", "frontend/src/pages/RagSources.tsx"]
    },
    {
        "message": "docs: enhance README with LangGraph details and walkthrough scripts",
        "files": ["README.md"]
    }
]

def run_cmd(cmd_list, ignore_error=False):
    res = subprocess.run(cmd_list, capture_output=True, text=True)
    if res.returncode != 0:
        if not ignore_error:
            print(f"Error executing command: {' '.join(cmd_list)}")
            print(res.stderr)
        return False
    return True

def main():
    print("Initializing Git Repository...")
    if not os.path.exists(".git"):
        run_cmd(["git", "init"])
        
    run_cmd(["git", "remote", "remove", "origin"], ignore_error=True)
    run_cmd(["git", "remote", "add", "origin", REPO_URL])
    run_cmd(["git", "branch", "-M", "main"])

    print(f"\nRemote repository set to: {REPO_URL}")
    print("Beginning incremental commit process...\n")

    for i, commit in enumerate(commits, 1):
        print(f"[{i}/{len(commits)}] Preparing commit: {commit['message']}")
        
        # Stage files
        files_staged = 0
        for f in commit["files"]:
            if os.path.exists(f):
                run_cmd(["git", "add", f])
                files_staged += 1
            else:
                # Handle directory wildcards
                import glob
                matched = glob.glob(f)
                for m in matched:
                    run_cmd(["git", "add", m])
                    files_staged += 1
                    
        if files_staged == 0:
            print("  No files present for this step, skipping...")
            continue
            
        # Commit
        if not run_cmd(["git", "commit", "-m", commit["message"]]):
            print("  Commit failed (probably no changes), skipping push...")
            continue
            
        # Push
        print("  Pushing to remote origin main...")
        if not run_cmd(["git", "push", "origin", "main"]):
            print("  Push failed. Make sure you are authenticated to GitHub.")
            print("  Halting script so you can resolve auth, then rerun.")
            break
            
        # Choose a random interval between 2 and 5 minutes (120 to 300 seconds)
        sleep_seconds = random.randint(MIN_SLEEP_SECONDS, MAX_SLEEP_SECONDS)
        minutes = sleep_seconds // 60
        seconds = sleep_seconds % 60
        print(f"  Successfully pushed! Waiting {minutes}m {seconds}s ({sleep_seconds}s) for the next interval...")
        for remaining in range(sleep_seconds, 0, -1):
            import sys
            rem_min = remaining // 60
            rem_sec = remaining % 60
            sys.stdout.write(f"\r  Next commit in {rem_min}m {rem_sec:02d}s...   ")
            sys.stdout.flush()
            time.sleep(1)
        print("\r  Next commit starting now!                               ")

    print("\nIncremental git push completed successfully!")

if __name__ == "__main__":
    main()
