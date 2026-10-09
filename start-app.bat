@echo off
title What Did I Miss - Local-First AI Catch-Up
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ========================================================
echo   Starting "What Did I Miss?" AI Micro-App...
echo ========================================================
echo.

echo Checking Node.js...
node -v
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js was not found in C:\Program Files\nodejs.
    pause
    exit /b
)

echo Starting local development server...
echo.
echo Once you see "Ready", open your browser at:
echo http://localhost:3000
echo.
echo (Press Ctrl + C in this window to stop the server anytime)
echo ========================================================
echo.

npm run dev
pause
