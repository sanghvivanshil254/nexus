@echo off
rem ==============================================================================
rem  Nexus Offline PDF Translator - Robust Full-Stack Launcher (Frontend + Backend)
rem ==============================================================================
setlocal EnableDelayedExpansion

rem Ensure the working directory is always the script's root folder
cd /d "%~dp0"

rem ------------------------------------------------------------------------------
rem Configuration Settings (Edit as needed)
rem ------------------------------------------------------------------------------
set "BACKEND_HOST=127.0.0.1"
set "BACKEND_PORT=8000"
set "FRONTEND_HOST=localhost"
set "FRONTEND_PORT=5173"
set "DEV_RELOAD=1"
set "AUTO_OPEN_BROWSER=1"
set "MAX_HEALTH_WAIT_SEC=30"

rem ------------------------------------------------------------------------------
rem Initialize Terminal Title & ANSI Colors (Windows 10/11)
rem ------------------------------------------------------------------------------
title Nexus Control Center
reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1
for /f "tokens=*" %%e in ('powershell -NoProfile -Command [char]27 2^>nul') do set "ESC=%%e"

rem Fallback if ANSI is not initialized
if "!ESC!"=="" (
    set "C_RESET="
    set "C_CYAN="
    set "C_GREEN="
    set "C_YELLOW="
    set "C_RED="
    set "C_DIM="
    set "C_BOLD="
) else (
    set "C_RESET=!ESC![0m"
    set "C_CYAN=!ESC![96m"
    set "C_GREEN=!ESC![92m"
    set "C_YELLOW=!ESC![93m"
    set "C_RED=!ESC![91m"
    set "C_DIM=!ESC![90m"
    set "C_BOLD=!ESC![1m"
)

rem ------------------------------------------------------------------------------
rem Handle CLI Arguments (e.g. "start.bat stop", "start.bat restart", "--no-browser")
rem ------------------------------------------------------------------------------
if /i "%~1"=="stop" goto :CLI_STOP
if /i "%~1"=="restart" goto :CLI_RESTART
if /i "%~1"=="--no-browser" set "AUTO_OPEN_BROWSER=0"
if /i "%~1"=="-h" goto :CLI_HELP
if /i "%~1"=="--help" goto :CLI_HELP

rem ------------------------------------------------------------------------------
rem Display Banner
rem ------------------------------------------------------------------------------
cls
echo !C_CYAN!!C_BOLD!==============================================================================!C_RESET!
echo !C_CYAN!!C_BOLD!                                                                              !C_RESET!
echo !C_CYAN!!C_BOLD!                 _   _     _____    __  __    _   _     ____     ____             !C_RESET!
echo !C_CYAN!!C_BOLD!                ^| \ ^| ^|   ^| ____^|   \ \/ /   ^| ^| ^| ^|   / ___\                 !C_RESET!
echo !C_CYAN!!C_BOLD!                ^|  \^| ^|   ^|  _^|      \  /    ^| ^| ^| ^|   \___                  !C_RESET!
echo !C_CYAN!!C_BOLD!                ^| ^|\  ^|   ^| ^|___     /  \    ^| ^|_^| ^|    ___ \                !C_RESET!
echo !C_CYAN!!C_BOLD!                ^|_^| \_^|   ^|_____^|   /_/\_\    \_______^/  \ ____/                 !C_RESET!
echo !C_CYAN!!C_BOLD!                                                                              !C_RESET!
echo !C_CYAN!!C_BOLD!                   Offline PDF Translation ^& Layout Engine                    !C_RESET!
echo !C_CYAN!!C_BOLD!                           Full-Stack Orchestrator                            !C_RESET!
echo !C_CYAN!!C_BOLD!                                                                              !C_RESET!
echo !C_CYAN!!C_BOLD!==============================================================================!C_RESET!
echo.

rem ------------------------------------------------------------------------------
rem Step 1: Detect Python & Virtual Environment
rem ------------------------------------------------------------------------------
echo !C_CYAN![1/6]!C_RESET! Detecting Python runtime environment...

set "PYTHON_BIN="
set "VENV_ACTIVATE="

rem Check for local virtual environments
if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_BIN=%~dp0.venv\Scripts\python.exe"
    set "VENV_ACTIVATE=%~dp0.venv\Scripts\activate.bat"
    echo        Found virtual environment: !C_GREEN!.venv!C_RESET!
    goto :PYTHON_VALIDATED
)
if exist "%~dp0venv\Scripts\python.exe" (
    set "PYTHON_BIN=%~dp0venv\Scripts\python.exe"
    set "VENV_ACTIVATE=%~dp0venv\Scripts\activate.bat"
    echo        Found virtual environment: !C_GREEN!venv!C_RESET!
    goto :PYTHON_VALIDATED
)
if exist "%~dp0env\Scripts\python.exe" (
    set "PYTHON_BIN=%~dp0env\Scripts\python.exe"
    set "VENV_ACTIVATE=%~dp0env\Scripts\activate.bat"
    echo        Found virtual environment: !C_GREEN!env!C_RESET!
    goto :PYTHON_VALIDATED
)
if exist "%~dp0backend\.venv\Scripts\python.exe" (
    set "PYTHON_BIN=%~dp0backend\.venv\Scripts\python.exe"
    set "VENV_ACTIVATE=%~dp0backend\.venv\Scripts\activate.bat"
    echo        Found virtual environment: !C_GREEN!backend\.venv!C_RESET!
    goto :PYTHON_VALIDATED
)
if exist "%~dp0backend\venv\Scripts\python.exe" (
    set "PYTHON_BIN=%~dp0backend\venv\Scripts\python.exe"
    set "VENV_ACTIVATE=%~dp0backend\venv\Scripts\activate.bat"
    echo        Found virtual environment: !C_GREEN!backend\venv!C_RESET!
    goto :PYTHON_VALIDATED
)

rem Check system python on PATH
python --version >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    set "PYTHON_BIN=python"
    for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo        Using system Python: !C_GREEN!%%v!C_RESET!
    goto :PYTHON_VALIDATED
)

rem Check py launcher
py -3 --version >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    set "PYTHON_BIN=py -3"
    for /f "tokens=*" %%v in ('py -3 --version 2^>^&1') do echo        Using Python Launcher: !C_GREEN!%%v!C_RESET!
    goto :PYTHON_VALIDATED
)

rem If no python found
echo.
echo !C_RED!!C_BOLD![ERROR] Python 3.10+ was not found on your system or PATH!!C_RESET!
echo  Nexus requires Python to run the FastAPI translation engine.
echo  Download and install it from: https://www.python.org/downloads/
echo  Ensure "Add Python to PATH" is checked during setup.
echo.
pause
exit /b 1

:PYTHON_VALIDATED
rem Verify backend requirements (fastapi, uvicorn)
"%PYTHON_BIN%" -c "import fastapi, uvicorn" >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo !C_YELLOW![WARN] Backend core packages [fastapi and uvicorn] missing from current Python environment.!C_RESET!
    echo Would you like to install requirements now from requirements.txt?
    choice /c YN /m "Install requirements now? [Y/N]"
    if !ERRORLEVEL! EQU 1 (
        echo Installing dependencies via pip...
        "%PYTHON_BIN%" -m pip install -r "%~dp0requirements.txt"
        if !ERRORLEVEL! NEQ 0 (
            echo !C_RED![ERROR] pip install failed. Please check your network or python configuration.!C_RESET!
            pause
            exit /b 1
        )
    ) else (
        echo Continuing anyway...
    )
) else (
    echo        !C_GREEN![OK]!C_RESET! Python dependencies verified.
)

rem ------------------------------------------------------------------------------
rem Step 2: Detect Node.js & npm Environment
rem ------------------------------------------------------------------------------
echo.
echo !C_CYAN![2/6]!C_RESET! Detecting Node.js and npm...

node -v >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo !C_RED!!C_BOLD![ERROR] Node.js is not found on your system PATH!!C_RESET!
    echo  Nexus Frontend requires Node.js [v18+] to run Vite.
    echo  Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do echo        Node.js version: !C_GREEN!%%v!C_RESET!

rem Check frontend node_modules
if not exist "%~dp0frontend\node_modules\" (
    echo !C_YELLOW![WARN] frontend/node_modules not found. Automatically running 'npm install'... !C_RESET!
    pushd "%~dp0frontend"
    call npm install
    if !ERRORLEVEL! NEQ 0 (
        echo !C_RED![ERROR] 'npm install' failed in frontend directory!!C_RESET!
        popd
        pause
        exit /b 1
    )
    popd
    echo        !C_GREEN![OK]!C_RESET! Frontend dependencies installed successfully.
) else (
    echo        !C_GREEN![OK]!C_RESET! Frontend dependencies found.
)

rem ------------------------------------------------------------------------------
rem Step 3: Check Optional Services (MongoDB)
rem ------------------------------------------------------------------------------
echo.
echo !C_CYAN![3/6]!C_RESET! Checking MongoDB cache service...
netstat -ano 2>nul | findstr /r /c:":27017  *" | findstr LISTENING >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo        !C_GREEN![OK]!C_RESET! MongoDB is running on port 27017 [Persistent Translation Cache Enabled].
) else (
    echo        !C_YELLOW![INFO]!C_RESET! MongoDB is not active on port 27017.
    echo               Nexus will automatically use high-speed !C_CYAN!In-Memory Cache Mode!C_RESET!.
)

rem ------------------------------------------------------------------------------
rem Step 4: Resolve Port Conflicts
rem ------------------------------------------------------------------------------
echo.
echo !C_CYAN![4/6]!C_RESET! Checking for port conflicts (Ports !BACKEND_PORT! and !FRONTEND_PORT!)...

set "PORT_CONFLICT=0"

rem Check Backend Port (8000)
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /r /c:":!BACKEND_PORT!  *" ^| findstr LISTENING') do (
    set "PORT_CONFLICT=1"
    echo        !C_YELLOW![WARN]!C_RESET! Port !BACKEND_PORT! is occupied by PID %%p. Freeing port...
    taskkill /F /PID %%p >nul 2>&1
)

rem Check Frontend Port (5173)
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /r /c:":!FRONTEND_PORT!  *" ^| findstr LISTENING') do (
    set "PORT_CONFLICT=1"
    echo        !C_YELLOW![WARN]!C_RESET! Port !FRONTEND_PORT! is occupied by PID %%p. Freeing port...
    taskkill /F /PID %%p >nul 2>&1
)

rem Close any previous Nexus windows if they exist
taskkill /FI "WINDOWTITLE eq Nexus - Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Nexus - Frontend*" /T /F >nul 2>&1

if !PORT_CONFLICT! EQU 0 (
    echo        !C_GREEN![OK]!C_RESET! Ports !BACKEND_PORT! and !FRONTEND_PORT! are free.
) else (
    ping 127.0.0.1 -n 2 >nul
    echo        !C_GREEN![OK]!C_RESET! Previous conflicting processes terminated cleanly.
)

rem ------------------------------------------------------------------------------
rem Step 5: Launch Backend & Frontend Services
rem ------------------------------------------------------------------------------
echo.
echo !C_CYAN![5/6]!C_RESET! Starting Nexus Backend and Frontend servers...

rem Build Backend Launch Command
set "BACKEND_ARGS=--host !BACKEND_HOST! --port !BACKEND_PORT!"
if "!DEV_RELOAD!"=="1" set "BACKEND_ARGS=!BACKEND_ARGS! --reload"

if not "!VENV_ACTIVATE!"=="" (
    start "Nexus - Backend [FastAPI :!BACKEND_PORT!]" cmd /k "title Nexus - Backend [FastAPI :!BACKEND_PORT!] && cd /d ""%~dp0"" && call ""!VENV_ACTIVATE!"" && ""%PYTHON_BIN%"" -m uvicorn backend.main:app !BACKEND_ARGS!"
) else (
    start "Nexus - Backend [FastAPI :!BACKEND_PORT!]" cmd /k "title Nexus - Backend [FastAPI :!BACKEND_PORT!] && cd /d ""%~dp0"" && ""%PYTHON_BIN%"" -m uvicorn backend.main:app !BACKEND_ARGS!"
)
echo        !C_GREEN![-^>]!C_RESET! Backend started in separate window [!C_BOLD!Nexus - Backend!C_RESET!]

rem Launch Frontend with Vite
start "Nexus - Frontend [Vite :!FRONTEND_PORT!]" cmd /k "title Nexus - Frontend [Vite :!FRONTEND_PORT!] && cd /d ""%~dp0frontend"" && npm run dev"
echo        !C_GREEN![-^>]!C_RESET! Frontend started in separate window [!C_BOLD!Nexus - Frontend!C_RESET!]

rem ------------------------------------------------------------------------------
rem Step 6: Wait for Readiness & Launch Browser
rem ------------------------------------------------------------------------------
echo.
echo !C_CYAN![6/6]!C_RESET! Verifying service health (waiting for ready state)...

set /a "WAIT_COUNT=0"
set "BACKEND_READY=0"
set "FRONTEND_READY=0"

:HEALTH_POLL_LOOP
set /a WAIT_COUNT+=1

rem Check backend health via curl or netstat
if !BACKEND_READY! EQU 0 (
    curl.exe -s --connect-timeout 1 http://!BACKEND_HOST!:!BACKEND_PORT!/api/health >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        set "BACKEND_READY=1"
    ) else (
        netstat -ano 2>nul | findstr /r /c:":!BACKEND_PORT!  *" | findstr LISTENING >nul 2>&1
        if !ERRORLEVEL! EQU 0 set "BACKEND_READY=1"
    )
)

rem Check frontend listening on port 5173
if !FRONTEND_READY! EQU 0 (
    netstat -ano 2>nul | findstr /r /c:":!FRONTEND_PORT!  *" | findstr LISTENING >nul 2>&1
    if !ERRORLEVEL! EQU 0 set "FRONTEND_READY=1"
)

rem If both ready, exit loop
if !BACKEND_READY! EQU 1 if !FRONTEND_READY! EQU 1 goto :SERVICES_HEALTHY

rem If timed out, break loop
if !WAIT_COUNT! GEQ !MAX_HEALTH_WAIT_SEC! goto :SERVICES_TIMEOUT

rem Sleep 1 second before next probe
ping 127.0.0.1 -n 2 >nul
goto :HEALTH_POLL_LOOP

:SERVICES_HEALTHY
echo        !C_GREEN![OK]!C_RESET! Backend API is healthy at !C_BOLD!http://!BACKEND_HOST!:!BACKEND_PORT!!C_RESET!
echo        !C_GREEN![OK]!C_RESET! Frontend UI is live at !C_BOLD!http://!FRONTEND_HOST!:!FRONTEND_PORT!!C_RESET!

if "!AUTO_OPEN_BROWSER!"=="1" (
    echo.
    echo Opening browser to http://!FRONTEND_HOST!:!FRONTEND_PORT! ...
    ping 127.0.0.1 -n 2 >nul
    start http://!FRONTEND_HOST!:!FRONTEND_PORT!
)
goto :CONTROL_DASHBOARD

:SERVICES_TIMEOUT
echo        !C_YELLOW![WARN] Readiness check reached timeout [!MAX_HEALTH_WAIT_SEC!s].!C_RESET!
echo        The servers may still be compiling or loading neural models.
echo        Please inspect the "Nexus - Backend" and "Nexus - Frontend" windows for logs.
goto :CONTROL_DASHBOARD

rem ------------------------------------------------------------------------------
rem Interactive Supervisor Control Dashboard
rem ------------------------------------------------------------------------------
:CONTROL_DASHBOARD
echo.
echo !C_CYAN!!C_BOLD!==============================================================================!C_RESET!
echo !C_CYAN!!C_BOLD!                         NEXUS CONTROL CENTER                                 !C_RESET!
echo !C_CYAN!!C_BOLD!==============================================================================!C_RESET!
echo   * Web Application:     !C_GREEN!http://!FRONTEND_HOST!:!FRONTEND_PORT!!C_RESET!
echo   * Backend REST API:    !C_GREEN!http://!BACKEND_HOST!:!BACKEND_PORT!!C_RESET!
echo   * Interactive Swagger: !C_GREEN!http://!BACKEND_HOST!:!BACKEND_PORT!/docs!C_RESET!
echo   * ReDoc API Reference: !C_GREEN!http://!BACKEND_HOST!:!BACKEND_PORT!/redoc!C_RESET!
echo ------------------------------------------------------------------------------
echo   Quick Actions:
echo     [!C_BOLD!1!C_RESET!] Open Frontend in Browser
echo     [!C_BOLD!2!C_RESET!] Open Backend Swagger Documentation
echo     [!C_BOLD!3!C_RESET!] Restart Both Servers
echo     [!C_BOLD!4!C_RESET!] Stop All Servers and Exit
echo     [!C_BOLD!5!C_RESET!] Exit Controller (Keep servers running in background)
echo ==============================================================================
echo.

:MENU_CHOICE
choice /c 12345 /n /m "Select an action [1-5]: "
if !ERRORLEVEL! EQU 1 goto :ACT_OPEN_FRONTEND
if !ERRORLEVEL! EQU 2 goto :ACT_OPEN_DOCS
if !ERRORLEVEL! EQU 3 goto :ACT_RESTART
if !ERRORLEVEL! EQU 4 goto :ACT_STOP_EXIT
if !ERRORLEVEL! EQU 5 goto :ACT_DETACH_EXIT
goto :MENU_CHOICE

:ACT_OPEN_FRONTEND
start http://!FRONTEND_HOST!:!FRONTEND_PORT!
goto :CONTROL_DASHBOARD

:ACT_OPEN_DOCS
start http://!BACKEND_HOST!:!BACKEND_PORT!/docs
goto :CONTROL_DASHBOARD

:ACT_RESTART
echo.
echo !C_YELLOW!Restarting Nexus services...!C_RESET!
call :CLEAN_SERVICES
goto :START_SERVICES_RESTART

:START_SERVICES_RESTART
ping 127.0.0.1 -n 2 >nul
goto :START_AFTER_CLEAN

:START_AFTER_CLEAN
cls
echo !C_CYAN![INFO] Relaunching servers...!C_RESET!
goto :CHECK_PORTS_FAST

:CHECK_PORTS_FAST
rem Relaunch Backend
if not "!VENV_ACTIVATE!"=="" (
    start "Nexus - Backend [FastAPI :!BACKEND_PORT!]" cmd /k "title Nexus - Backend [FastAPI :!BACKEND_PORT!] && cd /d ""%~dp0"" && call ""!VENV_ACTIVATE!"" && ""%PYTHON_BIN%"" -m uvicorn backend.main:app !BACKEND_ARGS!"
) else (
    start "Nexus - Backend [FastAPI :!BACKEND_PORT!]" cmd /k "title Nexus - Backend [FastAPI :!BACKEND_PORT!] && cd /d ""%~dp0"" && ""%PYTHON_BIN%"" -m uvicorn backend.main:app !BACKEND_ARGS!"
)

rem Relaunch Frontend
start "Nexus - Frontend [Vite :!FRONTEND_PORT!]" cmd /k "title Nexus - Frontend [Vite :!FRONTEND_PORT!] && cd /d ""%~dp0frontend"" && npm run dev"

echo Servers relaunched.
ping 127.0.0.1 -n 3 >nul
goto :CONTROL_DASHBOARD

:ACT_STOP_EXIT
echo.
echo !C_YELLOW!Shutting down all Nexus services...!C_RESET!
call :CLEAN_SERVICES
echo !C_GREEN![OK] All Nexus servers stopped successfully.!C_RESET!
ping 127.0.0.1 -n 2 >nul
exit /b 0

:ACT_DETACH_EXIT
echo.
echo !C_CYAN![INFO] Nexus servers remain running in their respective windows.!C_RESET!
echo        Run !C_BOLD!stop.bat!C_RESET! anytime to terminate them.
ping 127.0.0.1 -n 2 >nul
exit /b 0

rem ------------------------------------------------------------------------------
rem Subroutine: Clean/Stop Services
rem ------------------------------------------------------------------------------
:CLEAN_SERVICES
taskkill /FI "WINDOWTITLE eq Nexus - Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Nexus - Frontend*" /T /F >nul 2>&1

for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /r /c:":!BACKEND_PORT!  *" ^| findstr LISTENING') do (
    taskkill /F /PID %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /r /c:":!FRONTEND_PORT!  *" ^| findstr LISTENING') do (
    taskkill /F /PID %%p >nul 2>&1
)
exit /b 0

rem ------------------------------------------------------------------------------
rem CLI Helpers
rem ------------------------------------------------------------------------------
:CLI_STOP
echo !C_YELLOW!Stopping all Nexus services...!C_RESET!
call :CLEAN_SERVICES
echo !C_GREEN![OK] All Nexus services have been stopped.!C_RESET!
exit /b 0

:CLI_RESTART
echo !C_YELLOW!Restarting all Nexus services...!C_RESET!
call :CLEAN_SERVICES
ping 127.0.0.1 -n 2 >nul
goto :START_AFTER_CLEAN

:CLI_HELP
echo Nexus Launcher CLI Options:
echo   start.bat                Start both Backend and Frontend with interactive menu
echo   start.bat --no-browser   Start servers without auto-opening the browser
echo   start.bat stop           Stop any running Nexus backend and frontend instances
echo   start.bat restart        Quickly restart all servers
echo   start.bat --help         Show this help screen
exit /b 0
