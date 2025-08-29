@echo off
cd /d "%~dp0"
git add -A
set /p MSG=Messaggio commit: 
git commit -m "%MSG%"
git push
pause
