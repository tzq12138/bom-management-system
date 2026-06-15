@echo off
setlocal

cd /d "%~dp0bom-server"

if not exist package.json (
  echo [ERROR] package.json not found in bom-server.
  pause
  exit /b 1
)

echo Starting BOM server...
echo.
echo API URL: http://localhost:3001/api/health
echo Press Ctrl+C to stop.
echo.

call npm run start

if errorlevel 1 (
  echo.
  echo [ERROR] Failed to start the backend server.
  pause
  exit /b 1
)

endlocal
