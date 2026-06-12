@echo off
echo Starting CausalGuard Full-Stack Dev Servers...
echo.

echo [1/2] Starting FastAPI Backend Server...
start cmd /k "cd backend && ..\venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000"

echo [2/2] Starting React Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo CausalGuard has been launched successfully!
echo - Backend: http://localhost:8000
echo - Frontend: http://localhost:5173
echo.
pause
