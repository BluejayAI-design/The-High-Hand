@echo off
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
    py -3 start.py
) else (
    where python >nul 2>nul
    if errorlevel 1 (
        echo Python 3 is needed to run this local copy.
        echo Install Python 3 from python.org, then open this launcher again.
        pause
        exit /b 1
    )
    python start.py
)
pause
