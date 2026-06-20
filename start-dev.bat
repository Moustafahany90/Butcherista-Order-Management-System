@echo off
echo Starting Butcherista Admin Server...
start "Admin Server" cmd /c "node server\index.js"
echo Starting Butcherista Frontend...
start "Frontend" cmd /c "npm run dev"
echo Both servers started!
echo   Admin Server: http://localhost:3001
echo   Frontend:     http://localhost:5173
