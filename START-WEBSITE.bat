@echo off
setlocal
title Luxoria Scents - Live CMS Preview
cd /d "%~dp0"
where php >nul 2>nul
if errorlevel 1 (
  echo PHP is required for the live admin/API preview.
  echo Install PHP 8+ or upload this package to Hostinger.
  pause
  exit /b 1
)
start "Luxoria PHP Server" /min cmd /c "php -S 127.0.0.1:8000"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8000/index.html"
echo Store: http://127.0.0.1:8000/index.html
echo Admin: http://127.0.0.1:8000/admin.html
echo First open http://127.0.0.1:8000/setup.php to create your admin password.
pause
