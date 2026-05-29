@echo off
chcp 65001 >nul
title AIRI Launcher
cd /d "%~dp0"

echo [1] Starting Ollama...
start "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve
timeout /t 5 /nobreak >nul

echo [2] Starting AIRI...
if exist "apps\stage-tamagotchi\dist\win-unpacked\airi.exe" (
    start "" "apps\stage-tamagotchi\dist\win-unpacked\airi.exe"
) else (
    start "AIRI" cmd /c "pnpm dev:tamagotchi"
)

echo Done.
pause
