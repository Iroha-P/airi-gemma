@echo off
chcp 65001 >nul
title AIRI 统一进程管理
cd /d "%~dp0"

echo ========================================
echo     AIRI - 统一启动
echo ========================================
echo.

echo [Ollama] 检查中...
curl.exe -s -o NUL -w "%%{http_code}" --connect-timeout 2 http://127.0.0.1:11434/ 2>nul | findstr "200" >nul
if %errorlevel%==0 (
    echo [Ollama] OK - 已在运行
) else (
    echo [Ollama] 正在启动...
    start /min "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve
    echo [Ollama] 等待就绪...
    call :wait_for http://127.0.0.1:11434/ Ollama
)

echo [STT] 检查 Paraformer...
curl.exe -s -o NUL -w "%%{http_code}" --connect-timeout 2 http://127.0.0.1:8000/ 2>nul | findstr "200" >nul
if %errorlevel%==0 (
    echo [STT] OK - 已在运行
) else (
    echo [STT] 正在启动 Paraformer（CPU 模式，不占显存）...
    set CUDA_VISIBLE_DEVICES=-1
    start /min /D "%~dp0" "" stt-funasr\Scripts\python.exe stt-funasr\funasr_server.py
    echo [STT] 等待就绪...
    call :wait_for http://127.0.0.1:8000/ STT
)

echo [GSV] 检查 GPT-SoVITS...
curl.exe -s -o NUL --connect-timeout 2 http://127.0.0.1:9881/ 2>nul
if %errorlevel%==0 (
    echo [GSV] OK - 已在运行
) else (
    echo [GSV] 正在启动 GPT-SoVITS API（端口 9881）...
    start /min "GPT-SoVITS" cmd /c "cd /d E:\GPT-SoVITS-v2pro-20250604 && runtime\python.exe api_v2.py -a 127.0.0.1 -p 9881"
    echo [GSV] 等待就绪（首次加载较慢）...
    call :wait_for_port 127.0.0.1 9881 GSV
)

echo [AIRI] 启动桌面宠物...
echo.
echo ========================================
echo     所有服务就绪，正在启动 AIRI...
echo     此窗口可以关闭
echo ========================================

pnpm dev:tamagotchi
goto :eof

:wait_for
set "_url=%~1"
set "_name=%~2"
:wait_loop
timeout /t 1 /nobreak >nul
curl.exe -s -o NUL -w "%%{http_code}" --connect-timeout 2 "%_url%" 2>nul | findstr "200" >nul
if %errorlevel%==0 (
    echo [%_name%] OK
    goto :eof
)
goto wait_loop

:wait_for_port
set "_host=%~1"
set "_port=%~2"
set "_name=%~3"
:wait_port_loop
timeout /t 1 /nobreak >nul
curl.exe -s -o NUL --connect-timeout 2 http://%_host%:%_port%/ 2>nul
if %errorlevel%==0 (
    echo [%_name%] OK
    goto :eof
)
goto wait_port_loop
