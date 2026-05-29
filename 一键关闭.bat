@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title AIRI 统一关闭
cd /d "%~dp0"

echo ========================================
echo     AIRI 桌面宠物 - 统一关闭
echo ========================================
echo.

:: 1. 关闭 AIRI
echo [AIRI] 关闭桌面宠物...
tasklist /FI "IMAGENAME eq airi.exe" 2>nul | findstr /I "airi.exe" >nul
if !errorlevel! equ 0 (
    taskkill /F /IM airi.exe /T >nul 2>&1
    echo [AIRI] OK - 已关闭
) else (
    set AIRI_ELECTRON_KILLED=0
    for /f "tokens=2" %%a in ('tasklist /V /FI "IMAGENAME eq electron.exe" 2^>nul ^| findstr /I "AIRI"') do (
        if !AIRI_ELECTRON_KILLED! equ 0 (
            taskkill /F /PID %%a /T >nul 2>&1
            echo [AIRI] OK - 已关闭（开发模式 PID: %%a）
            set AIRI_ELECTRON_KILLED=1
        )
    )
    if !AIRI_ELECTRON_KILLED! equ 0 (
        echo [AIRI] - 未在运行
    ) else (
        rem Already closed by window title match.
    )
)

:: 2. 关闭 STT（端口 8000）
echo [STT] 检查语音识别服务...
set STT_KILLED=0
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    if !STT_KILLED! equ 0 (
        taskkill /F /PID %%a >nul 2>&1
        echo [STT] OK - 已关闭 ^(PID: %%a^)
        set STT_KILLED=1
    )
)
if !STT_KILLED! equ 0 echo [STT] - 未在运行

:: 3. 关闭 GPT-SoVITS（端口 9881，AIRI 专用）
echo [GPT-SoVITS] 检查 TTS 服务...
set GSV_KILLED=0
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":9881 " ^| findstr "LISTENING"') do (
    if !GSV_KILLED! equ 0 (
        taskkill /F /PID %%a >nul 2>&1
        echo [GPT-SoVITS] OK - 已关闭 ^(PID: %%a^)
        set GSV_KILLED=1
    )
)
if !GSV_KILLED! equ 0 echo [GPT-SoVITS] - 未在运行

:: 4. Ollama 保持运行
echo.
echo [Ollama] 保持运行（其他程序可能在使用）
echo          如需关闭: taskkill /F /IM ollama.exe /T

echo.
echo ========================================
echo     全部关闭完成
echo ========================================
echo.
timeout /t 3 >nul
