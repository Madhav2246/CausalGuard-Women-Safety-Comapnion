@echo off
echo Starting CausalGuard Full-Stack Dev Servers...
echo.

echo [1/2] Starting FastAPI Backend Server (from project root)...
start cmd /k "cd /d %~dp0 && venv\Scripts\python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting React Frontend Server...
start cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo CausalGuard has been launched successfully!
echo - Backend API:  http://localhost:8000
echo - API Docs:     http://localhost:8000/docs
echo - Frontend:     http://localhost:5173
echo.
pause
