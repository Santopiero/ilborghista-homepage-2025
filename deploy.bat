@echo off
REM === Script automatico Git add + commit + push ===

set MSG=Aggiornamenti veloci

echo.
echo === Pull ultimo stato dal remoto ===
git pull --rebase

echo.
echo === Aggiungo tutti i file modificati ===
git add .

echo.
echo === Committo le modifiche ===
git commit -m "%MSG%"

echo.
echo === Push su GitHub ===
git push

echo.
echo Fatto! ✅
pause
