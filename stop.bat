@echo off
rem ==============================================================================
rem  Nexus Offline PDF Translator - Quick Server Shutdown Utility
rem ==============================================================================
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Nexus Shutdown Utility

set "BACKEND_PORT=8000"
set "FRONTEND_PORT=5173"

reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1
for /f "tokens=*" %%e in ('powershell -NoProfile -Command [char]27 2^>nul') do set "ESC=%%e"
if "!ESC!"=="" (
    set "C_RESET="
    set "C_GREEN="
    set "C_YELLOW="
    set "C_RED="
) else (
    set "C_RESET=!ESC![0m"
    set "C_GREEN=!ESC![92m"
    set "C_YELLOW=!ESC![93m"
    set "C_RED=!ESC![91m"
)

echo !C_YELLOW!Shutting down Nexus Frontend and Backend services...!C_RESET!

rem 1. Terminate matching command windows
taskkill /FI "WINDOWTITLE eq Nexus - Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Nexus - Frontend*" /T /F >nul 2>&1

rem 2. Terminate any orphaned processes listening on ports
set "KILLED_COUNT=0"

for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /r /c:":!BACKEND_PORT!  *" ^| findstr LISTENING') do (
    echo Terminating backend process [PID %%p] on port !BACKEND_PORT!...
    taskkill /F /PID %%p >nul 2>&1
    set /a KILLED_COUNT+=1
)

for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /r /c:":!FRONTEND_PORT!  *" ^| findstr LISTENING') do (
    echo Terminating frontend process [PID %%p] on port !FRONTEND_PORT!...
    taskkill /F /PID %%p >nul 2>&1
    set /a KILLED_COUNT+=1
)

ping 127.0.0.1 -n 2 >nul

rem 3. Verify ports are free
netstat -ano 2>nul | findstr /r /c:":!BACKEND_PORT!  *" | findstr LISTENING >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo !C_RED![WARN] Port !BACKEND_PORT! is still occupied.!C_RESET!
) else (
    echo !C_GREEN![OK] Port !BACKEND_PORT! is clear.!C_RESET!
)

netstat -ano 2>nul | findstr /r /c:":!FRONTEND_PORT!  *" | findstr LISTENING >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo !C_RED![WARN] Port !FRONTEND_PORT! is still occupied.!C_RESET!
) else (
    echo !C_GREEN![OK] Port !FRONTEND_PORT! is clear.!C_RESET!
)

echo.
echo !C_GREEN!All Nexus services have been cleanly shut down.!C_RESET!
ping 127.0.0.1 -n 2 >nul
exit /b 0
