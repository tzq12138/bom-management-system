@echo off
setlocal

cd /d "%~dp0bom-app"

if not exist package.json (
  echo [ERROR] package.json not found in bom-app.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [ERROR] node_modules not found.
  echo Please run npm install in bom-app first.
  pause
  exit /b 1
)

echo Starting BOM app dev server...
echo.
echo URL: http://localhost:5173/
echo Press Ctrl+C to stop.
echo.

call npm run dev

if errorlevel 1 (
  echo.
  echo [ERROR] Failed to start the dev server.
  pause
  exit /b 1
)

endlocal
