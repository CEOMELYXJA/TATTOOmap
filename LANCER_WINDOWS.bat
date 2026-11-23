@echo off
setlocal
cd /d "%~dp0"

rem Verifier que la commande trouve vraiment Python 3, pas seulement un alias.
py -3 -c "import sys; sys.exit(sys.version_info.major != 3)" >nul 2>&1
if not errorlevel 1 (
  set "PY=py -3"
  goto launch
)
python -c "import sys; sys.exit(sys.version_info.major != 3)" >nul 2>&1
if not errorlevel 1 (
  set "PY=python"
  goto launch
)
echo ERREUR : Python 3 est introuvable ou ne fonctionne pas.
echo Installez Python 3, puis relancez TATTOOmap.
pause
exit /b 1

:launch
echo ------------------------------------------
echo TATTOOmap - MELISA FORTIN
echo ------------------------------------------
echo Interface 3D : http://127.0.0.1:8765/02_peaufine/
echo Prototype : http://127.0.0.1:8765/01_prototype/
echo Pour arreter : Ctrl+C ou fermez cette fenetre.
echo.
rem Un second lancement rouvre cette meme version si elle est deja en marche.
%PY% -u outils\lancer_windows.py
if errorlevel 1 (
  echo.
  echo ERREUR : le serveur local n'a pas pu demarrer ou s'est arrete.
  echo Si le port 8765 est deja utilise, fermez l'autre serveur puis reessayez.
  pause
  exit /b 1
)
endlocal
